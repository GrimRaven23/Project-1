import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { RbacGuard } from "@/core/security/rbac";
import { Customer } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";
import { z } from "zod";

/**
 * POST /api/customers — create a customer.
 * Guarded by `customers:create` (SUPER_ADMIN, PLATFORM_ADMIN, COMMERCIAL_*).
 */
export async function POST(request: NextRequest) {
  const guard = ApiGuard.verifyAccess(request, "customers:create");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const parsed = CustomerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return ApiGuard.badRequest(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const { companyName, sirenOrVat, industrySegment, primaryContact } = parsed.data;

  // Duplicate detection: same legal identifier (SIREN/VAT) blocks a second record.
  const existing = DatabaseRepository.getCustomers().find(
    (c) => c.sirenOrVat.toLowerCase() === sirenOrVat.toLowerCase()
  );
  if (existing) {
    return NextResponse.json(
      { error: `A customer with SIREN/VAT '${sirenOrVat}' already exists (${existing.companyName})` },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const customer: Customer = {
    id: `CUST-${Date.now().toString(36).toUpperCase()}`,
    companyName,
    sirenOrVat,
    industrySegment,
    // Ownership always derives from the authenticated actor — never from the body.
    accountManagerId: user.id,
    accountManagerName: user.name,
    primaryContact,
    createdAt: now,
    updatedAt: now
  };

  DatabaseRepository.saveCustomer(customer);

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CUSTOMER_CREATED",
    resource: "Customer",
    resourceId: customer.id,
    newState: { companyName: customer.companyName, sirenOrVat: customer.sirenOrVat },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ data: customer }, { status: 201 });
}

/**
 * GET /api/customers — list customers.
 * Commercial agents only see accounts they manage; roles with `customers:view_all`
 * see every account.
 */
export async function GET(request: NextRequest) {
  const guard = ApiGuard.verifyAccess(request, "customers:view");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;

  let customers = DatabaseRepository.getCustomers(search);

  // Scope to the caller's own accounts unless they hold customers:view_all.
  // (canAccessCustomer also grants experts access to customers behind their cases.)
  if (!RbacGuard.hasPermission(user.role, "customers:view_all")) {
    customers = customers.filter((c) => ApiGuard.canAccessCustomer(user, c));
  }

  return NextResponse.json({
    data: customers,
    total: customers.length
  });
}

/**
 * Shared request-body schema. Explicitly whitelists fields so a client cannot
 * mass-assign `id`, `accountManagerId`, `createdAt`, etc.
 */
const CustomerCreateSchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  sirenOrVat: z
    .string()
    .trim()
    .min(5)
    .max(40)
    .regex(/^[A-Za-z0-9\s-]+$/, "SIREN/VAT may only contain letters, digits, spaces and dashes"),
  industrySegment: z
    .enum(["SMB", "PME", "PMI", "ENTERPRISE", "PUBLIC_SECTOR"])
    .optional()
    .default("PME"),
  primaryContact: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(5).max(40),
    position: z.string().trim().min(1).max(120)
  })
});
