"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/lib/auth/auth-guard";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

/**
 * Chooses between the bare auth pages and the guarded application shell.
 *
 * `/login` must not be wrapped by AuthGuard (it would redirect the very user
 * trying to authenticate) and must not render the authenticated Navbar/Sidebar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
