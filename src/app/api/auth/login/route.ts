import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { DatabaseRepository } from "@/core/storage/database";
import { JwtService } from "@/core/security/jwt";
import { AuditService } from "@/core/audit/audit-logger";

/**
 * In-memory sliding-window rate limiter for failed login attempts.
 *
 * NOTE: this is per-process, which is the honest limit of a single-node in-memory
 * deployment. If the app is scaled horizontally, move this to a shared store
 * (Redis/DB). It exists to blunt credential-stuffing and password-guessing, which
 * otherwise have no throttle at all here.
 */
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const failedAttempts = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (failedAttempts.get(key) || []).filter((t) => now - t < WINDOW_MS);
  failedAttempts.set(key, recent);
  return recent.length >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const recent = (failedAttempts.get(key) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  failedAttempts.set(key, recent);
}

function clearFailures(key: string) {
  failedAttempts.delete(key);
}

/** Best-effort client identifier for throttling. */
function clientKey(request: NextRequest, email: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${ip}|${email.toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const { email, password } = body as { email?: string; password?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const key = clientKey(request, email);
    if (isRateLimited(key)) {
      AuditService.logEvent({
        actorId: "ANONYMOUS",
        actorName: email,
        actorRole: "COMMERCIAL_AGENT",
        action: "AUTH_LOGIN_RATE_LIMITED",
        resource: "UserAuth",
        resourceId: email,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1"
      });
      return NextResponse.json(
        { error: "Too many failed attempts. Please wait 15 minutes and try again." },
        { status: 429 }
      );
    }

    const users = DatabaseRepository.getUsers();
    const targetUser = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!targetUser) {
      recordFailure(key);
      AuditService.logEvent({
        actorId: "ANONYMOUS",
        actorName: email,
        actorRole: "COMMERCIAL_AGENT",
        action: "AUTH_LOGIN_FAILED",
        resource: "UserAuth",
        resourceId: email,
        newState: { reason: "User not found" },
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1"
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (targetUser.isActive === false) {
      return NextResponse.json({ error: "Account is disabled. Contact your administrator." }, { status: 403 });
    }

    let isValidPassword = false;
    if (targetUser.passwordHash) {
      isValidPassword = bcrypt.compareSync(password, targetUser.passwordHash);
    }

    if (!isValidPassword) {
      recordFailure(key);
      AuditService.logEvent({
        actorId: targetUser.id,
        actorName: targetUser.name,
        actorRole: targetUser.role,
        action: "AUTH_LOGIN_FAILED",
        resource: "UserAuth",
        resourceId: targetUser.id,
        newState: { reason: "Invalid credentials" },
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1"
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    clearFailures(key);

    // Sign JWT
    const token = JwtService.signToken(targetUser);

    // Audit log success
    AuditService.logEvent({
      actorId: targetUser.id,
      actorName: targetUser.name,
      actorRole: targetUser.role,
      action: "AUTH_LOGIN_SUCCESS",
      resource: "UserAuth",
      resourceId: targetUser.id,
      newState: { role: targetUser.role },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1"
    });

    const { passwordHash: _, ...safeUser } = targetUser;

    // The token is delivered ONLY via the HttpOnly cookie. Returning it in the
    // response body invites the client to persist it in localStorage, where any
    // XSS can read it. The cookie is not reachable from JS by design.
    const response = NextResponse.json({
      success: true,
      user: safeUser
    });

    response.headers.set("Set-Cookie", JwtService.createAuthCookie(token));

    return response;
  } catch {
    // Do not echo internal error details to the client.
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}
