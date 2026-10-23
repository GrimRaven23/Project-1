import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { devOnlyGuard } from "@/lib/dev/dev-guard";

/**
 * GET /api/dev/personas — list the seeded local personas for the dev role switcher.
 *
 * DEVELOPMENT ONLY. Returns a 403 in production (see devOnlyGuard).
 * Only non-secret fields are exposed; password hashes never leave the server.
 */
export async function GET(_request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const personas = DatabaseRepository.getUsers()
    .filter((u) => u.isActive !== false)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department
    }));

  return NextResponse.json({ data: personas });
}
