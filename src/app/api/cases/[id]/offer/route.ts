import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { OfferDraft } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";
import { RbacGuard, Permission } from "@/core/security/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "offers:create");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const currentCase = DatabaseRepository.getCaseById(id);
  if (!currentCase || !ApiGuard.canAccessCase(user, currentCase)) {
    return ApiGuard.notFound("Case");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const {
    title,
    summaryExecutive,
    technicalAssumptions = [],
    contractTermMonths = 36
  } = body as Record<string, unknown>;

  if (![24, 36, 48, 60].includes(Number(contractTermMonths))) {
    return ApiGuard.badRequest("contractTermMonths must be one of 24, 36, 48 or 60");
  }

  // Calculate totals from BOM — never trust client-supplied totals.
  const bomItems = currentCase.bomItems || [];
  const capexTotal = bomItems.reduce((acc, item) => acc + (item.capexTotalEur || 0), 0);
  const opexMonthly = bomItems.reduce((acc, item) => acc + (item.opexMonthlyTotalEur || 0), 0);

  const offer: OfferDraft = {
    id: `OFFER-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    caseId: currentCase.id,
    version: (currentCase.offers?.length || 0) + 1,
    // A new offer always starts as a draft; only a manager can approve it.
    status: "DRAFT",
    title: (title as string) || `Proposition Commerciale - ${currentCase.title}`,
    summaryExecutive:
      (summaryExecutive as string) ||
      `Proposition technique et commerciale pour ${currentCase.customer?.companyName || "le client"}.`,
    technicalAssumptions:
      Array.isArray(technicalAssumptions) && technicalAssumptions.length > 0
        ? technicalAssumptions.slice(0, 50).map((a) => String(a))
        : [
            "Sous réserve d'éligibilité optique finale après commande d'accès FTTO.",
            "Architecture dimensionnée selon les règles d'ingénierie approuvées.",
            "Garantie de Temps de Rétablissement (GTR) 4h heures ouvrées incluse."
          ],
    totalCapexEur: capexTotal,
    totalMonthlyOpexEur: opexMonthly,
    contractTermMonths: Number(contractTermMonths) as 24 | 36 | 48 | 60,
    createdAt: new Date().toISOString()
  };

  const updatedOffers = [...(currentCase.offers || []), offer];
  const updatedCase = DatabaseRepository.saveCase(
    {
      ...currentCase,
      offers: updatedOffers,
      lifecycleState: "OFFER_PREPARATION"
    },
    user
  );

  AuditService.logEvent({
    caseId: currentCase.id,
    caseNumber: currentCase.caseNumber,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "OFFER_DRAFT_CREATED",
    resource: "OfferDraft",
    resourceId: offer.id,
    newState: { capexTotal, opexMonthly, status: offer.status }
  });

  return NextResponse.json({ data: offer, updatedCase }, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "offers:view");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const currentCase = DatabaseRepository.getCaseById(id);
  if (!currentCase || !ApiGuard.canAccessCase(user, currentCase)) {
    return ApiGuard.notFound("Case");
  }
  if (!currentCase.offers || currentCase.offers.length === 0) {
    return ApiGuard.notFound("Offer");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const { offerId, status } = body as { offerId?: string; status?: OfferDraft["status"] };

  if (!status || !OFFER_STATUSES.includes(status)) {
    return ApiGuard.badRequest(`status must be one of: ${OFFER_STATUSES.join(", ")}`);
  }

  const targetIndex = offerId
    ? currentCase.offers.findIndex((o) => o.id === offerId)
    : currentCase.offers.length - 1;

  if (targetIndex === -1) {
    return ApiGuard.notFound("Offer");
  }

  // Issuing an offer to a customer is itself a privileged step.
  if (status === "APPROVED" || status === "ISSUED") {
    const required: Permission = status === "APPROVED" ? "offers:approve" : "offers:create";
    if (!RbacGuard.hasPermission(user.role, required)) {
      return NextResponse.json(
        {
          error: `Access Denied: Role '${user.role}' lacks '${required}' permission`
        },
        { status: 403 }
      );
    }
  }

  const previousOffer = currentCase.offers[targetIndex];
  const updatedOffer: OfferDraft = {
    ...previousOffer,
    status,
    // Approval provenance is server-derived from the authenticated approver.
    approvalByManagerId: status === "APPROVED" ? user.id : undefined,
    approvalDate: status === "APPROVED" ? new Date().toISOString() : undefined
  };

  const updatedOffers = [...currentCase.offers];
  updatedOffers[targetIndex] = updatedOffer;

  const nextLifecycle =
    status === "APPROVED"
      ? "APPROVED"
      : status === "ISSUED"
      ? "SENT_TO_CUSTOMER"
      : currentCase.lifecycleState;

  const updatedCase = DatabaseRepository.saveCase(
    {
      ...currentCase,
      offers: updatedOffers,
      lifecycleState: nextLifecycle
    },
    user
  );

  AuditService.logEvent({
    caseId: currentCase.id,
    caseNumber: currentCase.caseNumber,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: `OFFER_STATUS_${status}`,
    resource: "OfferDraft",
    resourceId: updatedOffer.id,
    previousState: { status: previousOffer.status },
    newState: { status: updatedOffer.status }
  });

  return NextResponse.json({ data: updatedOffer, updatedCase });
}

const OFFER_STATUSES: OfferDraft["status"][] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "ISSUED"
];
