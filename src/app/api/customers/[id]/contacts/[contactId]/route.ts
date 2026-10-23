import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";

/**
 * DELETE /api/customers/[id]/contacts/[contactId]
 * A customer must retain at least one contact, and the primary contact can only be
 * removed once a replacement has been promoted.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  const guard = ApiGuard.verifyAccess(request, "customers:update");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const customer = DatabaseRepository.getCustomerById(id);
  if (!customer || !ApiGuard.canAccessCustomer(user, customer)) {
    return ApiGuard.notFound("Customer");
  }

  const contact = DatabaseRepository.getContactById(contactId);
  if (!contact || contact.customerId !== customer.id) {
    return ApiGuard.notFound("Contact");
  }

  const remaining = DatabaseRepository.getContactsByCustomerId(customer.id).filter(
    (c) => c.id !== contact.id
  );
  if (remaining.length === 0) {
    return NextResponse.json(
      { error: "A customer must retain at least one contact. Add a replacement before deleting." },
      { status: 409 }
    );
  }

  DatabaseRepository.deleteContact(contact.id);

  const now = new Date().toISOString();
  if (contact.isPrimary) {
    const nextPrimary = remaining[0];
    DatabaseRepository.saveContact({ ...nextPrimary, isPrimary: true, updatedAt: now });
    DatabaseRepository.saveCustomer({
      ...customer,
      primaryContact: {
        name: nextPrimary.name,
        email: nextPrimary.email,
        phone: nextPrimary.phone,
        position: nextPrimary.position
      },
      updatedAt: now
    });
  }

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CUSTOMER_CONTACT_DELETED",
    resource: "Contact",
    resourceId: contact.id,
    previousState: {
      customerId: customer.id,
      email: contact.email,
      isPrimary: contact.isPrimary
    },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ success: true });
}
