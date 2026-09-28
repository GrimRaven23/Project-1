"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/auth-context";
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Users,
  ShieldCheck,
  BookOpen,
  History,
  Settings,
  Headphones
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useI18n();
  const { hasPermission } = useAuth();

  const navItems = [
    {
      href: "/",
      label: t.navigation.dashboard,
      icon: LayoutDashboard,
      active: pathname === "/"
    },
    {
      href: "/cases",
      label: t.navigation.cases,
      icon: FolderKanban,
      active: pathname.startsWith("/cases") && pathname !== "/cases/new",
      badge: "3"
    },
    {
      href: "/cases/new",
      label: t.navigation.newCase,
      icon: PlusCircle,
      active: pathname === "/cases/new",
      highlight: true
    },
    {
      href: "/experts",
      label: t.navigation.expertQueue,
      icon: Headphones,
      active: pathname.startsWith("/experts"),
      badge: "1",
      badgeColor: "bg-amber-500 text-white"
    },
    {
      href: "/customers",
      label: t.navigation.customers,
      icon: Users,
      active: pathname.startsWith("/customers")
    },
    {
      href: "/catalog",
      label: t.navigation.catalog,
      icon: BookOpen,
      active: pathname.startsWith("/catalog")
    },
    {
      href: "/audit",
      label: t.navigation.auditLog,
      icon: History,
      active: pathname.startsWith("/audit"),
      permission: "audit:view" as const
    },
    {
      href: "/admin",
      label: t.navigation.admin,
      icon: Settings,
      active: pathname.startsWith("/admin"),
      permission: "admin:system_config" as const
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between p-4 h-[calc(100vh-4rem)] sticky top-16">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Workspaces
        </div>
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                item.active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : item.highlight
                  ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${item.active ? "text-white" : ""}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.badgeColor || (item.active ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300")
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 p-3.5 text-white shadow-sm border border-blue-800/50">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">ASVS 5.x Baseline</span>
        </div>
        <p className="text-[11px] text-blue-200 leading-snug">
          Deterministic Rule Engine & Field-Level Access Control Active.
        </p>
      </div>
    </aside>
  );
};
