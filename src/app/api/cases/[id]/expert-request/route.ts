import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { ExpertRequest, TelecomDomain, PriorityLevel } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";
import { DataMaskingService } from "@/core/security/data-masking";

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
    const { domain, questionTitle, questionDetail, question, priority = "HIGH", requestedDeadline } = body;

    const title = questionTitle || question || "Demande d'expertise technique";
    const detail = questionDetail || question || "Validation d'architecture requise";

    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 }
      );
    }

    const newRequest: ExpertRequest = {
      id: `EXP-REQ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      caseId: currentCase.id,
      caseNumber: currentCase.caseNumber,
      customerName: currentCase.customer?.companyName || "Client Entreprise",
      domain: domain as TelecomDomain,
      status: "OPEN",
      priority: (priority as PriorityLevel) || "HIGH",
      questionTitle: title,
      questionDetail: detail,
      requestedByUserId: user.id,
      requestedByUserName: user.name,
      requestedDeadline: requestedDeadline || new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedRequests = [...(currentCase.expertRequests || []), newRequest];

    const updatedCase = DatabaseRepository.saveCase(
      {
        ...currentCase,
        expertRequests: updatedRequests,
        lifecycleState: "EXPERT_REVIEW_REQUIRED"
      },
      user
    );

    AuditService.logEvent({
      caseId: currentCase.id,
      caseNumber: currentCase.caseNumber,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "EXPERT_REQUEST_CREATED",
      resource: "ExpertRequest",
      resourceId: newRequest.id,
      newState: { domain, questionTitle: title, priority: newRequest.priority }
    });

    const masked = DataMaskingService.maskCase(updatedCase, user.role);
    return NextResponse.json({ data: newRequest, updatedCase: masked }, { status: 201 });
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
  if (!currentCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const {
      requestId,
      status = "COMPLETED",
      clientSafeRecommendation,
      internalNotes = "",
      technicalRisks = [],
      suggestedBomItems = [],
      technicalAlternatives
    } = body;

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const existingReqIndex = (currentCase.expertRequests || []).findIndex(
      (r) => r.id === requestId
    );

    if (existingReqIndex === -1) {
      return NextResponse.json({ error: "Expert request not found" }, { status: 404 });
    }

    const req = currentCase.expertRequests![existingReqIndex];
    const isSpecialistOrAdmin =
      user.role === "SUPER_ADMIN" ||
      user.role === "PRESALES_ENGINEER" ||
      user.role.includes("EXPERT");

    if (!isSpecialistOrAdmin && user.role !== "COMMERCIAL_MANAGER") {
      return NextResponse.json(
        { error: "Only specialists or managers can respond to expert requests" },
        { status: 403 }
      );
    }

    const updatedReq: ExpertRequest = {
      ...req,
      assignedExpertUserId: user.id,
      assignedExpertUserName: user.name,
      status: status,
      updatedAt: new Date().toISOString(),
      response: {
        respondedAt: new Date().toISOString(),
        expertUserId: user.id,
        expertUserName: user.name,
        clientSafeRecommendation: clientSafeRecommendation || "Recommandation validée par le pôle d'expertise.",
        internalNotes: internalNotes,
        suggestedBomItems: suggestedBomItems,
        technicalRisks: technicalRisks,
        technicalAlternatives: technicalAlternatives
      }
    };

    const updatedRequests = [...currentCase.expertRequests!];
    updatedRequests[existingReqIndex] = updatedReq;

    // Check if all expert requests are completed
    const allCompleted = updatedRequests.every((r) => r.status === "COMPLETED" || r.status === "REJECTED");
    const nextState = allCompleted ? "QUALIFICATION_COMPLETE" : "EXPERT_REVIEW_IN_PROGRESS";

    const updatedCase = DatabaseRepository.saveCase(
      {
        ...currentCase,
        expertRequests: updatedRequests,
        lifecycleState: nextState
      },
      user
    );

    AuditService.logEvent({
      caseId: currentCase.id,
      caseNumber: currentCase.caseNumber,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "EXPERT_REQUEST_RESPONDED",
      resource: "ExpertRequest",
      resourceId: updatedReq.id,
      newState: { status: updatedReq.status, expert: user.name }
    });

    const masked = DataMaskingService.maskCase(updatedCase, user.role);
    return NextResponse.json({ data: updatedReq, updatedCase: masked });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
