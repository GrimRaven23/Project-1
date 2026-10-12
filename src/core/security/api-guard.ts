import { NextRequest, NextResponse } from "next/server";
import { User, UserRole } from "../domain/types";
import { JwtService } from "./jwt";
import { DatabaseRepository } from "../storage/database";
import { RbacGuard, Permission } from "./rbac";

export interface AuthResult {
  user: User | null;
  error?: string;
  statusCode?: number;
}

export class ApiGuard {
  /**
   * Authenticates an incoming NextRequest via JWT cookie, Bearer header, or dev fallback
   */
  static authenticate(request: NextRequest): AuthResult {
    // 1. Check Bearer token in Authorization header
    const authHeader = request.headers.get("authorization");
    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2. Fallback to HttpOnly cookie
    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((c) => {
            const [k, ...v] = c.split("=");
            return [k, v.join("=")];
          })
        );
        token = cookies["telco_token"] || null;
      }
    }

    // If token present, verify it
    if (token) {
      const payload = JwtService.verifyToken(token);
      if (payload) {
        const user = DatabaseRepository.getUserById(payload.id);
        if (user) {
          return { user };
        }
        // If not in database map, construct user object from verified JWT payload
        return {
          user: {
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            department: payload.department
          }
        };
      }
      return { user: null, error: "Invalid or expired session token", statusCode: 401 };
    }

    // 3. Fallback for internal developer requests & testing: x-user-id or x-user-role
    const devUserId = request.headers.get("x-user-id");
    if (devUserId) {
      const user = DatabaseRepository.getUserById(devUserId);
      if (user) return { user };
    }

    const devUserRole = request.headers.get("x-user-role") as UserRole | null;
    if (devUserRole) {
      const users = DatabaseRepository.getUsers();
      const match = users.find((u) => u.role === devUserRole);
      if (match) return { user: match };
      // Fallback synthetic user with role
      return {
        user: {
          id: `DEV-${devUserRole}`,
          name: `Dev ${devUserRole}`,
          email: `${devUserRole.toLowerCase()}@telco-enterprise.fr`,
          role: devUserRole,
          department: "Development & Testing"
        }
      };
    }

    // Default: Return default Commercial Agent for non-strict public routes, or flag unauthenticated
    return { user: null, error: "Authentication required", statusCode: 401 };
  }

  /**
   * Helper that returns a 401/403 NextResponse if unauthorized, or null if allowed
   */
  static verifyAccess(
    request: NextRequest,
    requiredPermission?: Permission
  ): { user: User } | NextResponse {
    const auth = this.authenticate(request);

    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || "Authentication required" },
        { status: auth.statusCode || 401 }
      );
    }

    if (requiredPermission) {
      const allowed = RbacGuard.hasPermission(auth.user.role, requiredPermission);
      if (!allowed) {
        return NextResponse.json(
          {
            error: `Access Denied: Role '${auth.user.role}' lacks permission '${requiredPermission}'`
          },
          { status: 403 }
        );
      }
    }

    return { user: auth.user };
  }
}
