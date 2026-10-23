import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { JwtService } from "@/core/security/jwt";
import { AuditService } from "@/core/audit/audit-logger";
import { devOnlyGuard } from "@/lib/dev/dev-guard";

/**
 * POST /api/dev/switch — impersonate a seeded persona for local RBAC testing.
 *
 * DEVELOPMENT ONLY. Returns a 403 in production (see devOnlyGuard).
 *
 * This issues a REAL signed JWT via the normal cookie path rather than a
 * bypass token, so nothing in ApiGuard needs a special case: in dev the switcher
 * simply logs you in as the chosen persona, exactly as the login form would.
 */
export async function POST(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const { userId } = body as { userId?: string };
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = DatabaseRepository.getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }
  if (user.isActive === false) {
    return NextResponse.json({ error: "Persona is disabled" }, { status: 403 });
  }

  const token = JwtService.signToken(user);

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "DEV_PERSONA_SWITCH",
    resource: "UserAuth",
    resourceId: user.id,
    ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1"
  });

  const { passwordHash: _, ...safeUser } = user;
  const response = NextResponse.json({ success: true, user: safeUser });
  response.headers.set("Set-Cookie", JwtService.createAuthCookie(token));
  return response;
}
