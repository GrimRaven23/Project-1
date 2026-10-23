"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Shield, ChevronDown, Check, UserCheck } from "lucide-react";

export const RoleSwitcher: React.FC = () => {
  const { currentUser, switchUser, allUsers } = useAuth();
  const [open, setOpen] = useState(false);

  // Never rendered unauthenticated: the auth guard redirects to /login first.
  if (!currentUser) return null;

  const getRoleBadgeColor = (role: string) => {
    if (role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN") return "bg-purple-100 text-purple-800 border-purple-200";
    if (role === "COMMERCIAL_AGENT" || role === "COMMERCIAL_MANAGER") return "bg-blue-100 text-blue-800 border-blue-200";
    if (role.includes("SECURITY")) return "bg-rose-100 text-rose-800 border-rose-200";
    if (role.includes("EXPERT") || role.includes("PRESALES")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  // NODE_ENV is derived from how the process is started and is not a deploy-time
  // secret, so this gate cannot be weakened by an env var the way the old
  // NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCHER toggle could. The backend
  // (/api/dev/*) enforces the same rule independently.
  const isDevOrTest = process.env.NODE_ENV !== "production";

  if (!isDevOrTest) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium">
        <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.name}</span>
        <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getRoleBadgeColor(currentUser.role)}`}>
          {currentUser.role.replace("_", " ")}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors"
      >
        <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.name}</span>
        <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getRoleBadgeColor(currentUser.role)}`}>
          {currentUser.role.replace("_", " ")}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 animate-in fade-in-50 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> Active Persona / RBAC Role
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Switch user persona to test role-specific workflows and security barriers.
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {allUsers.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      void switchUser(user.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.department}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
