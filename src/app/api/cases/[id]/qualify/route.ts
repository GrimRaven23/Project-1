import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { QualificationEngine } from "@/core/qualification/qualification-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const currentCase = DatabaseRepository.getCaseById(caseId);

  if (!currentCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const result = QualificationEngine.evaluateCase(currentCase);
  const updatedCase = {
    ...currentCase,
    qualificationResult: result,
    lifecycleState:
      result.expertEscalationsNeeded.length > 0
        ? "EXPERT_REVIEW_REQUIRED"
        : "QUALIFICATION_COMPLETE"
  };

  DatabaseRepository.saveCase(updatedCase as any);

  return NextResponse.json({
    data: result,
    updatedLifecycleState: updatedCase.lifecycleState
  });
}
