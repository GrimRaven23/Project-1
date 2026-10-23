import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { DataMaskingService } from "@/core/security/data-masking";
import { ApiGuard } from "@/core/security/api-guard";
import { CaseStateMachine } from "@/core/state-machine/case-state-machine";
import { AuditService } from "@/core/audit/audit-logger";
import { CaseLifecycleState } from "@/core/domain/types";
import { z } from "zod";

/**
 * Shared lookup that 404s (rather than 403s) when the caller may not see the
 * case, so we never confirm the existence of another team's records.
 */
function findAccessibleCase(request: NextRequest, caseId: string) {
  const guard = ApiGuard.verifyAccess(request, "cases:view_assigned");
  if (guard instanceof NextResponse) return { error: guard };

  const targetCase = DatabaseRepository.getCaseById(caseId);
  if (!targetCase || !ApiGuard.canAccessCase(guard.user, targetCase)) {
    return { error: ApiGuard.notFound("Case") };
  }
  return { user: guard.user, targetCase };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const scope = findAccessibleCase(request, params.id);
  if (scope.error) return scope.error;

  const masked = DataMaskingService.maskCase(scope.targetCase, scope.user.role);
  return NextResponse.json({ data: masked });
}

/**
 * PUT /api/cases/[id] — update case metadata / advance lifecycle state.
 *
 * SECURITY: the body is whitelisted. Previously `...body` was spread over the
 * stored case, letting any authenticated caller overwrite `version` (defeating
 * optimistic concurrency), `qualificationResult` (forging an eligibility verdict),
 * `bomItems`/`offers` (self-approving a quote), or `assignedCommercialId`
 * (reassigning the account).
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const scope = findAccessibleCase(request, params.id);
  if (scope.error) return scope.error;
  const { user, targetCase: existingCase } = scope;

  const updateGuard = ApiGuard.verifyAccess(request, "cases:update");
  if (updateGuard instanceof NextResponse) return updateGuard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const parsed = CaseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return ApiGuard.badRequest(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }
  const input = parsed.data;

  // Lifecycle changes go through the state machine, which enforces both the
  // allowed transition graph AND the role permitted to make it.
  if (input.lifecycleState && input.lifecycleState !== existingCase.lifecycleState) {
    const transition = CaseStateMachine.validateTransition(
      existingCase,
      input.lifecycleState as CaseLifecycleState,
      user.role
    );
    if (!transition.valid) {
      return NextResponse.json(
        {
          error: `State transition rejected: ${transition.reason || "Transition not permitted for this role"}`
        },
        { status: 403 }
      );
    }
  }

  // Re-resolve sites if the caller supplied a new list, scoped to this customer.
  let sites = existingCase.sites;
  if (input.siteIds) {
    const customerSites = DatabaseRepository.getSitesByCustomerId(existingCase.customerId);
    sites = input.siteIds
      .map((sid) => customerSites.find((s) => s.id === sid))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }

  try {
    const updated = DatabaseRepository.saveCase(
      {
        ...existingCase,
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.classification !== undefined ? { classification: input.classification } : {}),
        ...(input.questionnaire !== undefined ? { questionnaire: input.questionnaire } : {}),
        ...(input.participatingExpertDomains !== undefined
          ? { participatingExpertDomains: input.participatingExpertDomains }
          : {}),
        ...(input.lifecycleState !== undefined
          ? { lifecycleState: input.lifecycleState as CaseLifecycleState }
          : {}),
        sites,
        id: params.id
      },
      user
    );

    const masked = DataMaskingService.maskCase(updated, user.role);
    return NextResponse.json({ data: masked });
  } catch (err: any) {
    // Optimistic-concurrency conflicts surface as 409, not a generic 400.
    const isConflict = typeof err?.message === "string" && err.message.startsWith("Concurrency Conflict");
    return NextResponse.json(
      { error: err.message },
      { status: isConflict ? 409 : 400 }
    );
  }
}

/**
 * DELETE /api/cases/[id] — cancel a case (soft delete; the record and its audit
 * trail are preserved).
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const scope = findAccessibleCase(request, params.id);
  if (scope.error) return scope.error;
  const { user, targetCase: existingCase } = scope;

  // Cancellation is a privileged action: manager/admin only.
  if (user.role !== "SUPER_ADMIN" && user.role !== "COMMERCIAL_MANAGER" && user.role !== "PLATFORM_ADMIN") {
    return NextResponse.json(
      { error: "Only Commercial Managers or Admins can cancel cases" },
      { status: 403 }
    );
  }

  if (existingCase.lifecycleState === "CANCELLED") {
    return NextResponse.json({ success: true, data: existingCase });
  }

  const previousState = existingCase.lifecycleState;
  const saved = DatabaseRepository.saveCase(
    { ...existingCase, lifecycleState: "CANCELLED" },
    user
  );

  AuditService.logEvent({
    caseId: existingCase.id,
    caseNumber: existingCase.caseNumber,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CASE_CANCELLED",
    resource: "SolutionCase",
    resourceId: existingCase.id,
    previousState: { state: previousState },
    newState: { state: "CANCELLED" }
  });

  return NextResponse.json({ success: true, data: saved });
}

/** Whitelisted, validated, mutable case fields. */
const CaseUpdateSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    classification: z.enum([
      "PUBLIC",
      "INTERNAL",
      "CUSTOMER_CONFIDENTIAL",
      "RESTRICTED",
      "SECURITY_SENSITIVE"
    ]),
    lifecycleState: z.string().trim().min(1),
    siteIds: z.array(z.string().trim().min(1)).max(50),
    participatingExpertDomains: z
      .array(z.enum(["TELEPHONY", "NETWORK_SDWAN", "WIFI", "CYBERSECURITY_FIREWALL", "SOLUTIONS_ARCHITECT"]))
      .max(10),
    // When a questionnaire is supplied it must be COMPLETE: PUT replaces the whole
    // object, so a partial payload would silently zero out the omitted answers.
    questionnaire: z.object({
      telephonyEndpointsCount: z.number().int().min(0).max(100_000),
      telephonyCategory: z.enum(["BASIC", "STANDARD", "PREMIUM", "MIXED"]),
      telephonyBreakdown: z.object({
        executiveCount: z.number().int().min(0),
        standardCount: z.number().int().min(0),
        receptionistCount: z.number().int().min(0),
        softphoneOnlyCount: z.number().int().min(0)
      }),
      hasLegacyIsdnT0T2: z.boolean(),
      hasExistingSipTrunk: z.boolean(),
      desiredTelephonyFeatures: z.array(z.string()).max(50),
      telephonyAction: z.enum(["RENEW", "MIGRATE_CLOUD", "EXPAND", "REPLACE_ALL"]),
      internetStatus: z.enum(["NO_LINK", "COPPER_ADSL_VDSL", "SHARED_FTTH", "DEDICATED_FTTO", "MULTI_LINK"]),
      existingBandwidthDownMbps: z.number().min(0),
      existingBandwidthUpMbps: z.number().min(0),
      desiredBandwidthDownMbps: z.number().min(0),
      desiredBandwidthUpMbps: z.number().min(0),
      isSymmetricalRequired: z.boolean(),
      gtrRequiredHours: z.union([z.literal(4), z.literal(8), z.literal(24), z.literal(48)]),
      requiresCellularBackup: z.boolean(),
      requiresMultiSiteSdWan: z.boolean(),
      wifiCoverageRequired: z.boolean(),
      wifiDesiredFeatures: z.array(z.string()).max(50),
      wifiOutdoorRequired: z.boolean(),
      hasExistingFirewall: z.boolean(),
      firewallAgeYears: z.number().min(0),
      firewallLicenseValid: z.boolean(),
      requiredSecurityCapabilities: z.array(z.string()).max(50),
      concurrentVpnUsersNeeded: z.number().int().min(0),
      requiresCaptivePortal: z.boolean()
    }).optional()
  })
  .partial();
