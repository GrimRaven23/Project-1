import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";
import { CaseStateMachine } from "@/core/state-machine/case-state-machine";
import { QualificationEngine } from "@/core/qualification/qualification-engine";
import { BomItem, CaseLifecycleState } from "@/core/domain/types";

/**
 * POST /api/cases/[id]/bom — regenerate the suggested Bill of Materials from the
 * case's latest qualification result.
 *
 * SECURITY: requires `bom:edit` plus case access. Totals are computed
 * server-side from the engine's output; the client cannot submit its own BOM.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "bom:edit");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const currentCase = DatabaseRepository.getCaseById(id);
  if (!currentCase || !ApiGuard.canAccessCase(user, currentCase)) {
    return ApiGuard.notFound("Case");
  }

  if (!currentCase.qualificationResult) {
    return NextResponse.json(
      { error: "Run qualification before generating a Bill of Materials" },
      { status: 409 }
    );
  }

  const autoBom: BomItem[] = QualificationEngine.generateSuggestedBomItems(
    currentCase,
    currentCase.qualificationResult
  );

  // Moving to SOLUTION_READY is a lifecycle change, so validate it. If the role
  // cannot make the hop we still persist the BOM but leave the state untouched.
  let nextState = currentCase.lifecycleState;
  if (currentCase.lifecycleState !== "SOLUTION_READY") {
    const hops: CaseLifecycleState[] = ["QUALIFICATION_IN_PROGRESS", "SOLUTION_READY"];
    const provisional = { ...currentCase, bomItems: autoBom };
    let cursor: CaseLifecycleState = currentCase.lifecycleState;
    let ok = true;
    for (const hop of hops) {
      const step = CaseStateMachine.validateTransition(
        { ...provisional, lifecycleState: cursor },
        hop,
        user.role
      );
      if (!step.valid) {
        ok = false;
        break;
      }
      cursor = hop;
    }
    if (ok) nextState = cursor;
  }

  const previousState = currentCase.lifecycleState;
  const updatedCase = DatabaseRepository.saveCase(
    { ...currentCase, bomItems: autoBom, lifecycleState: nextState },
    user
  );

  AuditService.logEvent({
    caseId: updatedCase.id,
    caseNumber: updatedCase.caseNumber,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "BOM_GENERATED",
    resource: "BomItem",
    resourceId: updatedCase.id,
    previousState: { state: previousState, itemCount: currentCase.bomItems.length },
    newState: { state: nextState, itemCount: autoBom.length }
  });

  return NextResponse.json({ data: autoBom, updatedCase });
}
