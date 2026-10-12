import { NextRequest, NextResponse } from "next/server";
import { ApiGuard } from "@/core/security/api-guard";
import { ROLE_PERMISSIONS } from "@/core/security/rbac";

export async function GET(request: NextRequest) {
  const auth = ApiGuard.authenticate(request);

  if (!auth.user) {
    return NextResponse.json(
      { error: "Unauthenticated" },
      { status: 401 }
    );
  }

  const permissions = ROLE_PERMISSIONS[auth.user.role] || [];

  return NextResponse.json({
    user: auth.user,
    permissions
  });
}
