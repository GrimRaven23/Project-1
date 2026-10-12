import { NextRequest, NextResponse } from "next/server";
import { JwtService } from "@/core/security/jwt";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";

export async function POST(request: NextRequest) {
  const auth = ApiGuard.authenticate(request);

  if (auth.user) {
    AuditService.logEvent({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: auth.user.role,
      action: "AUTH_LOGOUT",
      resource: "UserAuth",
      resourceId: auth.user.id,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1"
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully"
  });

  // Clear HTTP-only cookie
  response.headers.set("Set-Cookie", JwtService.clearAuthCookie());

  return response;
}
