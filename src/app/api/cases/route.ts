import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { DataMaskingService } from "@/core/security/data-masking";
import { UserRole } from "@/core/domain/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const state = searchParams.get("state") || undefined;
  const role = (request.headers.get("x-user-role") as UserRole) || "COMMERCIAL_AGENT";

  const cases = DatabaseRepository.getCases({ search, state });
  const maskedCases = cases.map((c) => DataMaskingService.maskCase(c, role));

  return NextResponse.json({
    data: maskedCases,
    total: maskedCases.length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = (request.headers.get("x-user-role") as UserRole) || "COMMERCIAL_AGENT";

    const saved = DatabaseRepository.saveCase(body);
    const masked = DataMaskingService.maskCase(saved, role);

    return NextResponse.json({ data: masked }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
