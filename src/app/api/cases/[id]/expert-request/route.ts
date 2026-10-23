import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { RbacGuard } from "@/core/security/rbac";
import { CaseStateMachine } from "@/core/state-machine/case-state-machine";
import { ExpertRequest, TelecomDomain, PriorityLevel } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";
import { DataMaskingService } from "@/core/security/data-masking";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = ApiGuard.verifyAccess(request, "expert_requests:create");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const currentCase = DatabaseRepository.getCaseById(params.id);
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
    domain,
    questionTitle,
    questionDetail,
    question,
    priority = "HIGH",
    requestedDeadline
  } = body as Record<string, unknown>;

  const title = (questionTitle as string) || (question as string) || "Demande d'expertise technique";
  const detail = (questionDetail as string) || (question as string) || "Validation d'architecture requise";

  if (!domain) {
    return ApiGuard.badRequest("domain is required");
  }

  if (!VALID_DOMAINS.includes(domain as TelecomDomain)) {
    return ApiGuard.badRequest(
      `domain must be one of: ${VALID_DOMAINS.join(", ")}`
    );
  }

  if (!VALID_PRIORITIES.includes(priority as PriorityLevel)) {
    return ApiGuard.badRequest(`priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }

  if (title.length > 200 || detail.length > 4000) {
    return ApiGuard.badRequest("questionTitle must be <=200 chars and questionDetail <=4000 chars");
  }

  // Deadlines are clamped to a sane window so a client cannot set 1970 or year 3000.
  const parsedDeadline = requestedDeadline ? Date.parse(String(requestedDeadline)) : NaN;
  const deadline = Number.isFinite(parsedDeadline)
    ? new Date(Math.min(Math.max(parsedDeadline, Date.now()), Date.now() + 365 * 86400000)).toISOString()
    : new Date(Date.now() + 86400000 * 3).toISOString();

  const newRequest: ExpertRequest = {
    id: `EXP-REQ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    caseId: currentCase.id,
    caseNumber: currentCase.caseNumber,
    customerName: currentCase.customer?.companyName || "Client Entreprise",
    domain: domain as TelecomDomain,
    status: "OPEN",
    priority: priority as PriorityLevel,
    questionTitle: title,
    questionDetail: detail,
    requestedByUserId: user.id,
    requestedByUserName: user.name,
    requestedDeadline: deadline,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedRequests = [...(currentCase.expertRequests || []), newRequest];

  // Escalating to expert review is a lifecycle change, so it must go through the
  // state machine. From INTAKE the legal route is via QUALIFICATION_IN_PROGRESS;
  // if the role cannot make that move we still record the request but leave the
  // lifecycle untouched rather than silently forcing an illegal state.
  let nextState = currentCase.lifecycleState;
  if (currentCase.lifecycleState !== "EXPERT_REVIEW_REQUIRED") {
    const provisional = { ...currentCase, expertRequests: updatedRequests };
    const firstHop = CaseStateMachine.validateTransition(
      provisional,
      "QUALIFICATION_IN_PROGRESS",
      user.role
    );
    const canReach = firstHop.valid
      ? CaseStateMachine.validateTransition(
          { ...provisional, lifecycleState: "QUALIFICATION_IN_PROGRESS" as const },
          "EXPERT_REVIEW_REQUIRED",
          user.role
        )
      : CaseStateMachine.validateTransition(provisional, "EXPERT_REVIEW_REQUIRED", user.role);

    if (canReach.valid) {
      nextState = "EXPERT_REVIEW_REQUIRED";
    }
  }

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
    action: "EXPERT_REQUEST_CREATED",
    resource: "ExpertRequest",
    resourceId: newRequest.id,
    newState: { domain, questionTitle: title, priority: newRequest.priority }
  });

  const masked = DataMaskingService.maskCase(updatedCase, user.role);
  return NextResponse.json({ data: newRequest, updatedCase: masked }, { status: 201 });
}

const VALID_DOMAINS: TelecomDomain[] = [
  "TELEPHONY",
  "NETWORK_SDWAN",
  "WIFI",
  "CYBERSECURITY_FIREWALL",
  "SOLUTIONS_ARCHITECT"
];
const VALID_PRIORITIES: PriorityLevel[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = ApiGuard.verifyAccess(request, "expert_requests:respond");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const currentCase = DatabaseRepository.getCaseById(params.id);
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
    requestId,
    status = "COMPLETED",
    clientSafeRecommendation,
    internalNotes = "",
    technicalRisks = [],
    suggestedBomItems = [],
    technicalAlternatives
  } = body as Record<string, unknown>;

  if (!requestId || typeof requestId !== "string") {
    return ApiGuard.badRequest("requestId is required");
  }

  if (!RESPONSE_STATUSES.includes(status as ExpertRequest["status"])) {
    return ApiGuard.badRequest(`status must be one of: ${RESPONSE_STATUSES.join(", ")}`);
  }

  const existingReqIndex = (currentCase.expertRequests || []).findIndex((r) => r.id === requestId);
  if (existingReqIndex === -1) {
    return ApiGuard.notFound("Expert request");
  }

  const req = currentCase.expertRequests![existingReqIndex];

  // A requester can ask for clarification on their own request; only specialists
  // (or a manager/admin) may submit the actual expert response. `respond` is held
  // by the specialist roles in the RBAC matrix.
  const canRespond = RbacGuard.hasPermission(user.role, "expert_requests:respond");
  if (!canRespond) {
    return NextResponse.json(
      { error: `Access Denied: Role '${user.role}' lacks 'expert_requests:respond' permission` },
      { status: 403 }
    );
  }

  // Domain expertise check: a telephony expert should not answer a firewall question.
  if (
    !RbacGuard.canAccessDomainExpertise(user.role, req.domain) &&
    user.role !== "COMMERCIAL_MANAGER" &&
    user.role !== "AUDITOR_COMPLIANCE"
  ) {
    return NextResponse.json(
      { error: `Access Denied: Role '${user.role}' is not qualified for domain '${req.domain}'` },
      { status: 403 }
    );
  }

  const updatedReq: ExpertRequest = {
    ...req,
    assignedExpertUserId: user.id,
    assignedExpertUserName: user.name,
    status: status as ExpertRequest["status"],
    updatedAt: new Date().toISOString(),
    response: {
      respondedAt: new Date().toISOString(),
      expertUserId: user.id,
      expertUserName: user.name,
      clientSafeRecommendation:
        (clientSafeRecommendation as string) || "Recommandation validée par le pôle d'expertise.",
      internalNotes: String(internalNotes ?? ""),
      // Copied field-by-field so a client cannot inject arbitrary keys into the
      // stored BOM lines (e.g. a forged `id` or `source`).
      suggestedBomItems: Array.isArray(suggestedBomItems)
        ? suggestedBomItems.slice(0, 100).map((b: Record<string, unknown>) => ({
            productCode: String(b.productCode ?? ""),
            productName: String(b.productName ?? ""),
            quantity: Number(b.quantity ?? 0),
            unit: String(b.unit ?? "UNIT"),
            reason: String(b.reason ?? ""),
            capexEur: Number(b.capexEur ?? 0),
            opexMonthlyEur: Number(b.opexMonthlyEur ?? 0)
          }))
        : [],
      technicalRisks: Array.isArray(technicalRisks)
        ? technicalRisks.slice(0, 50).map((r) => String(r))
        : [],
      technicalAlternatives: technicalAlternatives ? String(technicalAlternatives) : undefined
    }
  };

  const updatedRequests = [...currentCase.expertRequests!];
  updatedRequests[existingReqIndex] = updatedReq;

  // When the last request is resolved the case may leave expert review. The state
  // machine forbids EXPERT_REVIEW_REQUIRED -> QUALIFICATION_COMPLETE directly, so
  // step through EXPERT_REVIEW_IN_PROGRESS first.
  const allCompleted = updatedRequests.every(
    (r) => r.status === "COMPLETED" || r.status === "REJECTED"
  );
  const provisional = { ...currentCase, expertRequests: updatedRequests };
  let nextState = currentCase.lifecycleState;

  if (allCompleted) {
    const viaProgress = CaseStateMachine.validateTransition(
      provisional,
      "EXPERT_REVIEW_IN_PROGRESS",
      user.role
    );
    const toComplete = CaseStateMachine.validateTransition(
      { ...provisional, lifecycleState: "EXPERT_REVIEW_IN_PROGRESS" as const },
      "QUALIFICATION_COMPLETE",
      user.role
    );
    nextState = viaProgress.valid && toComplete.valid ? "QUALIFICATION_COMPLETE" : provisional.lifecycleState;
  } else {
    const step = CaseStateMachine.validateTransition(
      provisional,
      "EXPERT_REVIEW_IN_PROGRESS",
      user.role
    );
    nextState = step.valid ? "EXPERT_REVIEW_IN_PROGRESS" : provisional.lifecycleState;
  }

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
    previousState: { status: req.status },
    newState: { status: updatedReq.status, expert: user.name }
  });

  const masked = DataMaskingService.maskCase(updatedCase, user.role);
  return NextResponse.json({ data: updatedReq, updatedCase: masked });
}

const RESPONSE_STATUSES: ExpertRequest["status"][] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "CLARIFICATION_REQUESTED",
  "COMPLETED",
  "REJECTED"
];
