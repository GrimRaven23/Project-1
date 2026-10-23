/**
 * Development-only helpers.
 *
 * The role switcher is a genuinely useful local tool for exercising RBAC paths,
 * but the moment any of this is reachable in production it becomes a privilege
 * escalation vector (switch to SYSTEM_ADMIN with one request). Every helper here
 * therefore hard-refuses when NODE_ENV === "production" — there is no env var an
 * operator can flip to weaken it.
 */

import { NextResponse } from "next/server";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Returns a 403 response in production, or null when the caller may proceed. */
export function devOnlyGuard(): NextResponse | null {
  if (!isProduction()) return null;
  return NextResponse.json(
    { error: "Not available in production" },
    { status: 403 }
  );
}
