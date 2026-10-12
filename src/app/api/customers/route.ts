import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { Customer } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;

  const customers = DatabaseRepository.getCustomers(search);
  return NextResponse.json({
    data: customers,
    total: customers.length
  });
}

export async function POST(request: NextRequest) {
  const auth = ApiGuard.authenticate(request);
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { companyName, sirenOrVat, segment = "PME", primaryContact, sites = [] } = body;

    if (!companyName || !sirenOrVat) {
      return NextResponse.json(
        { error: "companyName and sirenOrVat are required fields" },
        { status: 400 }
      );
    }

    const newCustomer: Customer = {
      id: `CUST-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      companyName,
      sirenOrVat,
      industrySegment: (segment as any) || "PME",
      accountManagerId: user.id,
      accountManagerName: user.name,
      primaryContact: {
        name: primaryContact?.name || "Contact Principal",
        email: primaryContact?.email || `contact@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.fr`,
        phone: primaryContact?.phone || "+33 1 00 00 00 00",
        position: primaryContact?.position || primaryContact?.role || "Directeur"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = DatabaseRepository.saveCustomer(newCustomer);

    AuditService.logEvent({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "CUSTOMER_CREATED",
      resource: "Customer",
      resourceId: saved.id,
      newState: { companyName: saved.companyName, siren: saved.sirenOrVat }
    });

    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
