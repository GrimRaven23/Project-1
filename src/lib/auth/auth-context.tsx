"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/core/domain/types";
import { SEED_USERS } from "@/core/storage/seed-data";
import { RbacGuard, Permission } from "@/core/security/rbac";

interface AuthContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  hasPermission: (permission: Permission) => boolean;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]); // Default: Alexandre Martin (Commercial Agent)

  useEffect(() => {
    const savedUserId = localStorage.getItem("telco_active_user_id");
    if (savedUserId) {
      const found = SEED_USERS.find((u) => u.id === savedUserId);
      if (found) setCurrentUser(found);
    }
  }, []);

  const switchUser = (userId: string) => {
    const found = SEED_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem("telco_active_user_id", userId);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return RbacGuard.hasPermission(currentUser.role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        hasPermission,
        allUsers: SEED_USERS
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
