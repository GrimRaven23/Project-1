"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/core/domain/types";
import { SEED_USERS } from "@/core/storage/seed-data";
import { RbacGuard, Permission } from "@/core/security/rbac";

interface AuthContextType {
  currentUser: User;
  token: string | null;
  switchUser: (userId: string) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  allUsers: User[];
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]); // Default: Alexandre Martin
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const savedToken = localStorage.getItem("telco_auth_token");
        const savedUserId = localStorage.getItem("telco_active_user_id");

        if (savedToken) {
          setToken(savedToken);
          // Verify with /api/auth/me
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setCurrentUser(data.user);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback to saved local user ID or default
        if (savedUserId) {
          const found = SEED_USERS.find((u) => u.id === savedUserId);
          if (found) setCurrentUser(found);
        }
      } catch {
        // Fallback to default
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const switchUser = (userId: string) => {
    const found = SEED_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem("telco_active_user_id", userId);
      // Auto-refresh token for switched user
      login(found.email, "Password123!");
    }
  };

  const login = async (email: string, password: string = "Password123!") => {
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

      if (data.user && data.token) {
        setCurrentUser(data.user);
        setToken(data.token);
        localStorage.setItem("telco_auth_token", data.token);
        localStorage.setItem("telco_active_user_id", data.user.id);
        return { success: true };
      }

      return { success: false, error: "Invalid response from server" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue client cleanup
    } finally {
      setToken(null);
      localStorage.removeItem("telco_auth_token");
      // Reset to default commercial agent
      setCurrentUser(SEED_USERS[0]);
      localStorage.setItem("telco_active_user_id", SEED_USERS[0].id);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return RbacGuard.hasPermission(currentUser.role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        switchUser,
        login,
        logout,
        hasPermission,
        allUsers: SEED_USERS,
        isLoading
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
