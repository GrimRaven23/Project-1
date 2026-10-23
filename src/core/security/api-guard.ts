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

/** Sentinel returned when the caller is not authenticated. Never serialise this. */
export const AUTH_REQUIRED = Symbol("AUTH_REQUIRED");

export class ApiGuard {
  /**
   * Authenticates an incoming NextRequest via HttpOnly JWT cookie or Bearer header.
   *
   * SECURITY: The `x-user-role` / `x-user-id` header fallback was removed. Headers are
   * attacker-controlled and previously allowed any caller to impersonate
   * `SYSTEM_ADMINISTRATOR` by setting a single request header.
   *
   * There is deliberately no unauthenticated development fallback either. Local
   * persona switching goes through POST /api/dev/switch, which issues a real
   * signed JWT through the same path as the login form — so the guard never needs
   * a bypass branch.
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
      if (!payload) {
        return { user: null, error: "Invalid or expired session token", statusCode: 401 };
      }

      // The user MUST still exist in the store. Trusting the signed payload alone
      // would let a token minted for a since-deleted or deactivated account keep
      // working, which defeats any revocation path.
      const user = DatabaseRepository.getUserById(payload.id);
      if (!user) {
        return {
          user: null,
          error: "Session refers to an account that no longer exists",
          statusCode: 401
        };
      }
      if (user.isActive === false) {
        return { user: null, error: "Account is disabled", statusCode: 403 };
      }

      // Authoritative role comes from the store, not a (potentially stale) token.
      return { user };
    }

    // No token provided or token invalid
    return { user: null, error: "Authentication required: Missing or invalid token", statusCode: 401 };
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

  /**
   * IDOR / horizontal-privilege helper.
   *
   * Roles that hold `customers:view_all` / `cases:view_all` may read any record.
   * Everyone else may only touch records tied to them: the customer's
   * `accountManagerId`, or the case's `assignedCommercialId` (commercial side)
   * / an `assignedExpertUserId` on one of its expert requests (expert side).
   * Returns false for anything it cannot positively authorise.
   */
  static canAccessCustomer(
    user: User,
    customer: { id?: string; accountManagerId?: string } | null | undefined
  ): boolean {
    if (!customer) return false;
    if (RbacGuard.hasPermission(user.role, "customers:view_all")) return true;
    if (customer.accountManagerId === user.id) return true;

    // Domain experts hold only `cases:view_assigned`, but they still need the
    // customer record behind a case they are working on.
    if (customer.id) {
      const assigned = DatabaseRepository.getCases({ customerId: customer.id }).some((c) =>
        this.canAccessCase(user, c)
      );
      if (assigned) return true;
    }
    return false;
  }

  static canAccessCase(
    user: User,
    solutionCase: {
      assignedCommercialId?: string;
      expertRequests?: Array<{ assignedExpertUserId?: string }>;
    } | null | undefined
  ): boolean {
    if (!solutionCase) return false;
    if (RbacGuard.hasPermission(user.role, "cases:view_all")) return true;
    if (solutionCase.assignedCommercialId === user.id) return true;
    // Being named on an expert request only widens visibility for specialist
    // roles (holders of `expert_requests:respond`). Without this gate any user
    // listed as an assignee — including a commercial agent on a foreign case —
    // would gain full read access to another team's case.
    if (RbacGuard.hasPermission(user.role, "expert_requests:respond")) {
      if (solutionCase.expertRequests?.some((er) => er.assignedExpertUserId === user.id)) {
        return true;
      }
    }
    return false;
  }

  /** Uniform 404 that does not leak whether the record exists but is out of scope. */
  static notFound(resource: string): NextResponse {
    return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
  }

  /** Uniform 400 for request-body validation failures. */
  static badRequest(error: string): NextResponse {
    return NextResponse.json({ error }, { status: 400 });
  }
}
