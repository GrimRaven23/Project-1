"use client";

import React from "react";
import { ROLE_PERMISSIONS } from "@/core/security/rbac";
import { SEED_USERS } from "@/core/storage/seed-data";
import { UserRole } from "@/core/domain/types";
import { useI18n } from "@/lib/i18n/context";
import { Settings, Shield, Users, Check, Lock } from "lucide-react";

export default function AdminPage() {
  const { t } = useI18n();

  const roles: UserRole[] = [
    "SUPER_ADMIN",
    "PLATFORM_ADMIN",
    "COMMERCIAL_AGENT",
    "COMMERCIAL_MANAGER",
    "PRESALES_ENGINEER",
    "NETWORK_EXPERT",
    "TELEPHONY_EXPERT",
    "SECURITY_EXPERT",
    "AUDITOR_COMPLIANCE"
  ];

  const samplePermissions = [
    "customers:view",
    "customers:create",
    "cases:create",
    "cases:transition_state",
    "qualification:run",
    "expert_requests:respond",
    "expert_notes:view_confidential",
    "bom:edit",
    "offers:approve",
    "audit:view",
    "admin:system_config"
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          {t.navigation.admin}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-Based Access Control matrix, user directory, and security policy configuration.
        </p>
      </div>

      {/* User Directory */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" /> Enterprise User Directory ({SEED_USERS.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SEED_USERS.map((u) => (
            <div
              key={u.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {u.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{u.email}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{u.department}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-600" /> Active RBAC Permission Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Resource Permission</th>
                {roles.map((r) => (
                  <th key={r} className="py-2.5 px-2 text-center text-[10px]">
                    {r.replace("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {samplePermissions.map((perm) => (
                <tr key={perm} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{perm}</td>
                  {roles.map((r) => {
                    const has = (ROLE_PERMISSIONS[r] || []).includes(perm as any);
                    return (
                      <td key={r} className="py-2 px-2 text-center">
                        {has ? (
                          <span className="inline-flex p-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
