import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";
import { z } from "zod";

/** Shared access check for any /api/customers/[id]/... sub-resource. */
function resolveScopedCustomer(request: NextRequest, customerId: string) {
  const guard = ApiGuard.verifyAccess(request, "customers:view");
  if (guard instanceof NextResponse) return { error: guard };

  const customer = DatabaseRepository.getCustomerById(customerId);
  // Out-of-scope => 404, so we never confirm existence to an unauthorised caller.
  if (!customer || !ApiGuard.canAccessCustomer(guard.user, customer)) {
    return { error: ApiGuard.notFound("Customer") };
  }
  return { user: guard.user, customer };
}

/** GET /api/customers/[id]/contacts */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = resolveScopedCustomer(request, id);
  if (scope.error) return scope.error;

  const contacts = DatabaseRepository.getContactsByCustomerId(id);
  return NextResponse.json({ data: contacts, total: contacts.length });
}

/** POST /api/customers/[id]/contacts */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "customers:update");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const customer = DatabaseRepository.getCustomerById(id);
  if (!customer || !ApiGuard.canAccessCustomer(user, customer)) {
    return ApiGuard.notFound("Customer");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return ApiGuard.badRequest(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  // Duplicate detection within the customer's address book (same email).
  const existing = DatabaseRepository.getContactsByCustomerId(customer.id);
  if (existing.some((c) => c.email.toLowerCase() === parsed.data.email.toLowerCase())) {
    return NextResponse.json(
      { error: `A contact with email '${parsed.data.email}' already exists for this customer` },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const isPrimary = parsed.data.isPrimary === true || existing.length === 0;

  // Only one primary per customer: demote the previous primary if we are promoting a new one.
  if (isPrimary) {
    for (const c of existing.filter((c) => c.isPrimary)) {
      DatabaseRepository.saveContact({ ...c, isPrimary: false, updatedAt: now });
    }
  }

  const contact = DatabaseRepository.saveContact({
    id: `CON-${Date.now().toString(36).toUpperCase()}`,
    customerId: customer.id,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    position: parsed.data.position,
    isPrimary,
    createdAt: now,
    updatedAt: now
  });

  // Keep the denormalised primaryContact in sync so legacy readers stay correct.
  if (isPrimary) {
    DatabaseRepository.saveCustomer({
      ...customer,
      primaryContact: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        position: contact.position
      },
      updatedAt: now
    });
  }

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CUSTOMER_CONTACT_ADDED",
    resource: "Contact",
    resourceId: contact.id,
    newState: { customerId: customer.id, email: contact.email, isPrimary: contact.isPrimary },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ data: contact }, { status: 201 });
}

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(5).max(40),
  position: z.string().trim().min(1).max(120),
  isPrimary: z.boolean().optional()
});
