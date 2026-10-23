import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { DataMaskingService } from "@/core/security/data-masking";
import { RbacGuard } from "@/core/security/rbac";

/**
 * GET /api/experts — the expert review queue.
 *
 * SECURITY: this previously returned every expert request for every case with no
 * authentication at all, leaking customer names, project details and confidential
 * internal notes. It now requires `expert_requests:view_queue`, and responses are
 * masked per-role so confidential notes never reach non-specialist callers.
 */
export async function GET(request: NextRequest) {
  const guard = ApiGuard.verifyAccess(request, "expert_requests:view_queue");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || undefined;
  const status = searchParams.get("status") || undefined;

  let requests = DatabaseRepository.getAllExpertRequests({ domain, status });

  // Queue visibility is scoped: specialists see the queue for domains they are
  // qualified in; managers/admins/auditors see the whole queue.
  if (!RbacGuard.hasPermission(user.role, "cases:view_all")) {
    requests = requests.filter((r) => RbacGuard.canAccessDomainExpertise(user.role, r.domain));
  }

  // Mask by role so confidential internal notes never reach non-specialist callers.
  const canSeeConfidential = RbacGuard.hasPermission(user.role, "expert_notes:view_confidential");
  const masked = canSeeConfidential
    ? requests
    : requests.map((r) => DataMaskingService.maskExpertRequest(r, user.role));

  return NextResponse.json({
    data: masked,
    total: masked.length
  });
}
