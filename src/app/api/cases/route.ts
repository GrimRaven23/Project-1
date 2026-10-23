import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { DataMaskingService } from "@/core/security/data-masking";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";
import { SolutionCase } from "@/core/domain/types";
import { z } from "zod";

/**
 * GET /api/cases — list solution cases.
 * Callers without `cases:view_all` only see cases assigned to them or to an
 * expert request they own (see ApiGuard.canAccessCase).
 */
export async function GET(request: NextRequest) {
  const guard = ApiGuard.verifyAccess(request, "cases:view_assigned");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const state = searchParams.get("state") || undefined;

  let cases = DatabaseRepository.getCases({ search, state });
  cases = cases.filter((c) => ApiGuard.canAccessCase(user, c));

  const maskedCases = cases.map((c) => DataMaskingService.maskCase(c, user.role));

  return NextResponse.json({
    data: maskedCases,
    total: maskedCases.length
  });
}

/**
 * POST /api/cases — create a solution case under an existing customer.
 *
 * SECURITY: the request body is explicitly whitelisted. `id`, `caseNumber`,
 * `lifecycleState`, `version`, `assignedCommercialId`, `qualificationResult`,
 * `bomItems`, `offers` and `customer` are all server-derived so a client cannot
 * forge ownership, skip the state machine, or pre-approve its own offer.
 */
export async function POST(request: NextRequest) {
  const guard = ApiGuard.verifyAccess(request, "cases:create");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const parsed = CaseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return ApiGuard.badRequest(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const { customerId, title, priority, classification, siteIds, questionnaire } = parsed.data;

  const customer = DatabaseRepository.getCustomerById(customerId);
  if (!customer) return ApiGuard.notFound("Customer");
  if (!ApiGuard.canAccessCustomer(user, customer)) {
    return ApiGuard.notFound("Customer");
  }

  // Duplicate detection: one open case per customer+title.
  const duplicate = DatabaseRepository.getCases({ customerId }).find(
    (c) =>
      c.title.trim().toLowerCase() === title.trim().toLowerCase() &&
      c.lifecycleState !== "CANCELLED" &&
      c.lifecycleState !== "LOST" &&
      c.lifecycleState !== "WON"
  );
  if (duplicate) {
    return NextResponse.json(
      { error: `An open case titled '${title}' already exists for ${customer.companyName} (${duplicate.caseNumber})` },
      { status: 409 }
    );
  }

  // Resolve requested sites, keeping only those that really belong to the customer.
  const customerSites = DatabaseRepository.getSitesByCustomerId(customer.id);
  const sites = (siteIds || [])
    .map((sid) => customerSites.find((s) => s.id === sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const now = new Date().toISOString();
  const newCase: SolutionCase = {
    id: `CASE-${Date.now().toString(36).toUpperCase()}`,
    caseNumber: generateCaseNumber(),
    customerId: customer.id,
    customer,
    title,
    // Ownership always derives from the authenticated creator.
    assignedCommercialId: user.id,
    assignedCommercialName: user.name,
    participatingExpertDomains: [],
    // New cases always enter at INTAKE — never whatever the client asked for.
    lifecycleState: "INTAKE_IN_PROGRESS",
    priority,
    classification,
    version: 0,
    completenessPercentage: 0,
    sites,
    existingAssets: [],
    questionnaire: questionnaire ?? DEFAULT_QUESTIONNAIRE,
    expertRequests: [],
    bomItems: [],
    offers: [],
    documents: [],
    createdAt: now,
    updatedAt: now
  };

  const saved = DatabaseRepository.saveCase(newCase, user);
  const masked = DataMaskingService.maskCase(saved, user.role);

  AuditService.logEvent({
    caseId: saved.id,
    caseNumber: saved.caseNumber,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CASE_CREATED",
    resource: "SolutionCase",
    resourceId: saved.id,
    newState: { state: saved.lifecycleState, title: saved.title, customerId: customer.id },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ data: masked }, { status: 201 });
}

/**
 * Monotonic-ish case number. Uses wall clock so numbers do not collide across
 * restarts the way a simple `count + 1` would.
 */
function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const seq = Date.now().toString().slice(-6);
  return `CASE-${year}-${seq}`;
}

const DEFAULT_QUESTIONNAIRE: SolutionCase["questionnaire"] = {
  telephonyEndpointsCount: 0,
  telephonyCategory: "BASIC",
  telephonyBreakdown: { executiveCount: 0, standardCount: 0, receptionistCount: 0, softphoneOnlyCount: 0 },
  hasLegacyIsdnT0T2: false,
  hasExistingSipTrunk: false,
  desiredTelephonyFeatures: [],
  telephonyAction: "RENEW",
  internetStatus: "NO_LINK",
  existingBandwidthDownMbps: 0,
  existingBandwidthUpMbps: 0,
  desiredBandwidthDownMbps: 0,
  desiredBandwidthUpMbps: 0,
  isSymmetricalRequired: false,
  gtrRequiredHours: 24,
  requiresCellularBackup: false,
  requiresMultiSiteSdWan: false,
  wifiCoverageRequired: false,
  wifiDesiredFeatures: [],
  wifiOutdoorRequired: false,
  hasExistingFirewall: false,
  firewallAgeYears: 0,
  firewallLicenseValid: false,
  requiredSecurityCapabilities: [],
  concurrentVpnUsersNeeded: 0,
  requiresCaptivePortal: false
};

const CaseCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  title: z.string().trim().min(3).max(200),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
  classification: z
    .enum(["PUBLIC", "INTERNAL", "CUSTOMER_CONFIDENTIAL", "RESTRICTED", "SECURITY_SENSITIVE"])
    .optional()
    .default("INTERNAL"),
  siteIds: z.array(z.string().trim().min(1)).max(50).optional(),
  questionnaire: z
    .object({
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
    })
    .optional()
});
