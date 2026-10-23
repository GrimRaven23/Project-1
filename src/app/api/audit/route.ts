import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/core/audit/audit-logger";
import { ApiGuard } from "@/core/security/api-guard";

export async function GET(request: NextRequest) {
  const guard = ApiGuard.verifyAccess(request, "audit:view");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId") || undefined;
  const resource = searchParams.get("resource") || undefined;
  const actorId = searchParams.get("actorId") || undefined;
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  // Clamp: a caller must not be able to request an unbounded audit dump.
  const rawLimit = parseInt(searchParams.get("limit") || "100", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 100;

  let logs = AuditService.getLogs({ caseId, resource, actorId, limit });

  // Free-text filter over action / actor / case number / resource id.
  if (search) {
    logs = logs.filter((l) =>
      [l.action, l.actorName, l.caseNumber || "", l.resource, l.resourceId]
        .some((field) => field.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    data: logs,
    total: logs.length
  });
}
