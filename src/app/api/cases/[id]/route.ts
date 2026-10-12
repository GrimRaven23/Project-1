import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { DataMaskingService } from "@/core/security/data-masking";
import { ApiGuard } from "@/core/security/api-guard";
import { CaseStateMachine } from "@/core/state-machine/case-state-machine";
import { AuditService } from "@/core/audit/audit-logger";
import { CaseLifecycleState } from "@/core/domain/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = ApiGuard.authenticate(request);
  const user = auth.user;
  const role = user?.role || "COMMERCIAL_AGENT";

  const targetCase = DatabaseRepository.getCaseById(params.id);
  if (!targetCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const masked = DataMaskingService.maskCase(targetCase, role);
  return NextResponse.json({ data: masked });
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

  const existingCase = DatabaseRepository.getCaseById(params.id);
  if (!existingCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Check lifecycle transition if state is changing
    if (body.lifecycleState && body.lifecycleState !== existingCase.lifecycleState) {
      const transition = CaseStateMachine.validateTransition(
        existingCase,
        body.lifecycleState as CaseLifecycleState,
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

    const updated = DatabaseRepository.saveCase(
      {
        ...existingCase,
        ...body,
        id: params.id
      },
      user
    );

    const masked = DataMaskingService.maskCase(updated, user.role);
    return NextResponse.json({ data: masked });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = ApiGuard.authenticate(request);
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "COMMERCIAL_MANAGER") {
    return NextResponse.json(
      { error: "Only Commercial Managers or Admins can cancel cases" },
      { status: 403 }
    );
  }

  const existingCase = DatabaseRepository.getCaseById(params.id);
  if (!existingCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  existingCase.lifecycleState = "CANCELLED";
  const saved = DatabaseRepository.saveCase(existingCase, user);

  AuditService.logEvent({
    caseId: existingCase.id,
    caseNumber: existingCase.caseNumber,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CASE_CANCELLED",
    resource: "SolutionCase",
    resourceId: existingCase.id,
    previousState: { state: existingCase.lifecycleState },
    newState: { state: "CANCELLED" }
  });

  return NextResponse.json({ success: true, data: saved });
}
