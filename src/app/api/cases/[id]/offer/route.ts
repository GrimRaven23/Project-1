import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { OfferDraft } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";
import { RbacGuard } from "@/core/security/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = ApiGuard.authenticate(request);
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const currentCase = DatabaseRepository.getCaseById(params.id);
  if (!currentCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { title, summaryExecutive, technicalAssumptions = [], contractTermMonths = 36 } = body;

    // Calculate totals from BOM
    const bomItems = currentCase.bomItems || [];
    const capexTotal = bomItems.reduce((acc, item) => acc + (item.capexTotalEur || 0), 0);
    const opexMonthly = bomItems.reduce((acc, item) => acc + (item.opexMonthlyTotalEur || 0), 0);

    const offer: OfferDraft = {
      id: `OFFER-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      caseId: currentCase.id,
      version: (currentCase.offers?.length || 0) + 1,
      status: "DRAFT",
      title: title || `Proposition Commerciale - ${currentCase.title}`,
      summaryExecutive: summaryExecutive || `Proposition technique et commerciale pour ${currentCase.customer?.companyName || "le client"}.`,
      technicalAssumptions: technicalAssumptions.length > 0 ? technicalAssumptions : [
        "Sous réserve d'éligibilité optique finale après commande d'accès FTTO.",
        "Architecture dimensionnée selon les règles d'ingénierie approuvées.",
        "Garantie de Temps de Rétablissement (GTR) 4h heures ouvrées incluse."
      ],
      totalCapexEur: capexTotal,
      totalMonthlyOpexEur: opexMonthly,
      contractTermMonths: contractTermMonths as 24 | 36 | 48 | 60,
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = ApiGuard.authenticate(request);
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const currentCase = DatabaseRepository.getCaseById(params.id);
  if (!currentCase || !currentCase.offers || currentCase.offers.length === 0) {
    return NextResponse.json({ error: "Offer not found for this case" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { offerId, status } = body as { offerId?: string; status: OfferDraft["status"] };

    const targetIndex = offerId
      ? currentCase.offers.findIndex((o) => o.id === offerId)
      : currentCase.offers.length - 1;

    if (targetIndex === -1) {
      return NextResponse.json({ error: "Target offer not found" }, { status: 404 });
    }

    if (status === "APPROVED" || status === "REJECTED") {
      const canApprove = RbacGuard.hasPermission(user.role, "offers:approve");
      if (!canApprove) {
        return NextResponse.json(
          { error: "Access Denied: Only Commercial Managers can approve or reject offers" },
          { status: 403 }
        );
      }
    }

    const previousOffer = currentCase.offers[targetIndex];
    const updatedOffer: OfferDraft = {
      ...previousOffer,
      status: status || previousOffer.status,
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
