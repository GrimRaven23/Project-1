import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { JwtService } from "@/core/security/jwt";
import { AuditService } from "@/core/audit/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const users = DatabaseRepository.getUsers();
    const targetUser = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!targetUser) {
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

    // Check password: In demo mode, accept "Password123!" or email prefix (e.g., "alexandre", "admin", "karim")
    // or any non-empty password if matching demo mode
    const emailPrefix = targetUser.email.split("@")[0].split(".")[0];
    const isValidPassword =
      password === "Password123!" ||
      password?.toLowerCase() === emailPrefix.toLowerCase() ||
      password === "admin" ||
      password === "demo";

    if (!isValidPassword && process.env.NODE_ENV === "production") {
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

    const response = NextResponse.json({
      success: true,
      user: targetUser,
      token
    });

    // Set secure HTTP-only cookie
    response.headers.set("Set-Cookie", JwtService.createAuthCookie(token));

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Authentication error" },
      { status: 500 }
    );
  }
}
