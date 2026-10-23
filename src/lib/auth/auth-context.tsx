"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/core/domain/types";
import { RbacGuard, Permission } from "@/core/security/rbac";

/**
 * Cookie-based authentication context.
 *
 * SECURITY NOTES:
 * - The session lives in an HttpOnly cookie set by /api/auth/login. It is never
 *   written to localStorage, where any XSS could read it.
 * - `currentUser` starts as null. There is no default/demo persona baked into the
 *   client bundle; the user is whoever /api/auth/me says they are, or nobody.
 * - Demo personas are only fetched in development, from a dev-only endpoint.
 */

interface AuthContextType {
  /** null while unauthenticated (including during initial load). */
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  /** Dev-only persona list; empty array in production. */
  allUsers: User[];
  /** Dev-only persona switch; no-op in production. */
  switchUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const refreshSession = useCallback(async () => {
    try {
      // `credentials: "include"` is implicit for same-origin, stated for clarity.
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          return data.user as User;
        }
      }
    } catch {
      // Network failure: treat as unauthenticated rather than guessing.
    }
    setCurrentUser(null);
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        const user = await refreshSession();
        if (cancelled) return;

        // Personas are only ever loaded outside production.
        if (process.env.NODE_ENV !== "production") {
          try {
            const res = await fetch("/api/dev/personas");
            if (res.ok) {
              const data = await res.json();
              if (!cancelled) setAllUsers(data.data || []);
            }
          } catch {
            // Dev convenience only — ignore.
          }
        }

        // Unauthenticated users belong on the login page.
        if (!user) {
          const path = typeof window !== "undefined" ? window.location.pathname : "/";
          if (path !== "/login") router.replace("/login");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [refreshSession, router]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      if (data.user) {
        setCurrentUser(data.user);
        return { success: true };
      }
      return { success: false, error: "Invalid response from server" };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue client cleanup regardless.
    } finally {
      setCurrentUser(null);
      setAllUsers([]);
      router.replace("/login");
    }
  };

  const switchUser = async (userId: string) => {
    if (process.env.NODE_ENV === "production") return; // hard no-op
    try {
      const res = await fetch("/api/dev/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setCurrentUser(data.user);
      }
    } catch {
      // Dev convenience only — ignore.
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    return RbacGuard.hasPermission(currentUser.role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: currentUser !== null,
        login,
        logout,
        hasPermission,
        allUsers,
        switchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
