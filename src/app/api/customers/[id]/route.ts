import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";
import { z } from "zod";

/**
 * GET /api/customers/[id] — full customer detail incl. contacts and sites.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "customers:view");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const customer = DatabaseRepository.getCustomerById(id);
  if (!customer) return ApiGuard.notFound("Customer");
  if (!ApiGuard.canAccessCustomer(user, customer)) {
    // 404 rather than 403: do not confirm the record exists to an out-of-scope caller.
    return ApiGuard.notFound("Customer");
  }

  return NextResponse.json({
    data: {
      ...customer,
      contacts: DatabaseRepository.getContactsByCustomerId(customer.id),
      sites: DatabaseRepository.getSitesByCustomerId(customer.id)
    }
  });
}

/**
 * PUT /api/customers/[id] — update company profile (name, segment, primary contact).
 * `accountManagerId` / `sirenOrVat` are deliberately immutable here: reassigning an
 * account or changing its legal identifier is an admin action with audit impact.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "customers:update");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const customer = DatabaseRepository.getCustomerById(id);
  if (!customer) return ApiGuard.notFound("Customer");
  if (!ApiGuard.canAccessCustomer(user, customer)) return ApiGuard.notFound("Customer");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const parsed = CustomerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return ApiGuard.badRequest(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const updated = DatabaseRepository.saveCustomer({
    ...customer,
    ...parsed.data,
    updatedAt: new Date().toISOString()
  });

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CUSTOMER_UPDATED",
    resource: "Customer",
    resourceId: updated.id,
    previousState: { companyName: customer.companyName, industrySegment: customer.industrySegment },
    newState: { companyName: updated.companyName, industrySegment: updated.industrySegment },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ data: updated });
}

const CustomerUpdateSchema = z
  .object({
    companyName: z.string().trim().min(2).max(200),
    industrySegment: z.enum(["SMB", "PME", "PMI", "ENTERPRISE", "PUBLIC_SECTOR"]),
    primaryContact: z.object({
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(200),
      phone: z.string().trim().min(5).max(40),
      position: z.string().trim().min(1).max(120)
    })
  })
  .partial();
