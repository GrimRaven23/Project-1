import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/core/audit/audit-logger";
import { ApiGuard } from "@/core/security/api-guard";
import { RbacGuard } from "@/core/security/rbac";

export async function GET(request: NextRequest) {
  const auth = ApiGuard.authenticate(request);
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const canViewAudit = RbacGuard.hasPermission(user.role, "audit:view");
  if (!canViewAudit) {
    return NextResponse.json(
      { error: `Access Denied: Role '${user.role}' lacks 'audit:view' permission` },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId") || undefined;
  const resource = searchParams.get("resource") || undefined;
  const actorId = searchParams.get("actorId") || undefined;
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const logs = AuditService.getLogs({ caseId, resource, actorId, limit });

  return NextResponse.json({
    data: logs,
    total: logs.length
  });
}
