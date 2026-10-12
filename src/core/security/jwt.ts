import jwt from "jsonwebtoken";
import { User, UserRole } from "../domain/types";

const JWT_SECRET = process.env.JWT_SECRET || "telcoqualify-enterprise-secure-jwt-secret-key-32chars";
const JWT_EXPIRES_IN = "24h";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
}

export class JwtService {
  /**
   * Signs a JWT for an authenticated user
   */
  static signToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: "HS256"
    });
  }

  /**
   * Verifies and decodes a JWT token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ["HS256"]
      }) as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Creates Set-Cookie header string for the auth token
   */
  static createAuthCookie(token: string): string {
    const isProd = process.env.NODE_ENV === "production";
    const secureFlag = isProd ? "; Secure" : "";
    return `telco_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secureFlag}`;
  }

  /**
   * Clears the auth cookie
   */
  static clearAuthCookie(): string {
    return `telco_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}
