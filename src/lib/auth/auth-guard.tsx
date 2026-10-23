"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Client-side session gate for the authenticated shell.
 *
 * This is defense-in-depth, NOT the primary control: every /api/* route enforces
 * authentication and RBAC server-side, so a bypassed guard exposes nothing but
 * an empty UI. Its job is to redirect unauthenticated browsers to /login and to
 * avoid flashing protected content during session resolution.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = pathname === "/login";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isPublic) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isPublic, router]);

  // Resolve session silently before rendering the protected shell.
  if (isLoading && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) {
    return null; // redirect in flight
  }

  return <>{children}</>;
}
