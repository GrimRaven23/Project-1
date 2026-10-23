import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { QualificationEngine } from "@/core/qualification/qualification-engine";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";
import { CaseStateMachine } from "@/core/state-machine/case-state-machine";
import { CaseLifecycleState } from "@/core/domain/types";

/**
 * POST /api/cases/[id]/qualify — run the deterministic qualification engine and
 * persist its verdict on the case.
 *
 * SECURITY: this mutates lifecycle state, so it requires `qualification:run` and
 * the caller must be able to access the case. The transition out of the current
 * state is validated by the state machine rather than hard-coded.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "qualification:run");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const currentCase = DatabaseRepository.getCaseById(id);
  if (!currentCase || !ApiGuard.canAccessCase(user, currentCase)) {
    return ApiGuard.notFound("Case");
  }

  const result = QualificationEngine.evaluateCase(currentCase);

  const nextState =
    result.expertEscalationsNeeded.length > 0 ? "EXPERT_REVIEW_REQUIRED" : "QUALIFICATION_COMPLETE";

  // A freshly-created case sits at INTAKE_IN_PROGRESS, and the state machine only
  // permits leaving QUALIFICATION_IN_PROGRESS for the two outcomes above. Walk the
  // legal path hop-by-hop so the state machine stays the single source of truth
  // instead of hard-coding an end state that would be an illegal jump.
  let cursor: CaseLifecycleState = currentCase.lifecycleState;
  const goal = nextState as CaseLifecycleState;

  if (cursor !== goal) {
    if (cursor === "DRAFT" || cursor === "INTAKE_IN_PROGRESS" || cursor === "INFORMATION_REQUIRED") {
      const step1 = CaseStateMachine.validateTransition(currentCase, "QUALIFICATION_IN_PROGRESS", user.role);
      if (!step1.valid) {
        return NextResponse.json(
          { error: `Cannot start qualification: ${step1.reason || "transition not permitted for this role"}` },
          { status: 403 }
        );
      }
      cursor = "QUALIFICATION_IN_PROGRESS";
    }

    const step2 = CaseStateMachine.validateTransition(
      { ...currentCase, lifecycleState: cursor },
      goal,
      user.role
    );
    if (!step2.valid) {
      return NextResponse.json(
        { error: `Cannot move case to '${goal}': ${step2.reason || "transition not permitted for this role"}` },
        { status: 403 }
      );
    }
  }

  const previousState = currentCase.lifecycleState;
  const updatedCase = DatabaseRepository.saveCase(
    { ...currentCase, qualificationResult: result, lifecycleState: goal } as typeof currentCase,
    user
  );

  AuditService.logEvent({
    caseId: updatedCase.id,
    caseNumber: updatedCase.caseNumber,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "QUALIFICATION_RUN",
    resource: "SolutionCase",
    resourceId: updatedCase.id,
    previousState: { state: previousState },
    newState: { state: nextState, overallEligibility: result.overallEligibility },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({
    data: result,
    updatedLifecycleState: updatedCase.lifecycleState
  });
}
