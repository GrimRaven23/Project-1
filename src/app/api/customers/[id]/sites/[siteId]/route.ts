import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";
import { z } from "zod";

/**
 * PUT /api/customers/[id]/sites/[siteId] — update site geometry/profile.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  const { id, siteId } = await params;
  const guard = ApiGuard.verifyAccess(request, "customers:update");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const customer = DatabaseRepository.getCustomerById(id);
  if (!customer || !ApiGuard.canAccessCustomer(user, customer)) {
    return ApiGuard.notFound("Customer");
  }

  const site = DatabaseRepository.getSiteById(siteId);
  if (!site || site.customerId !== customer.id) return ApiGuard.notFound("Site");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const parsed = SiteSchema.partial().safeParse(body);
  if (!parsed.success) {
    return ApiGuard.badRequest(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const updated = DatabaseRepository.saveSite({ ...site, ...parsed.data });

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CUSTOMER_SITE_UPDATED",
    resource: "Site",
    resourceId: updated.id,
    previousState: { siteName: site.siteName, areaSquareMeters: site.areaSquareMeters },
    newState: { siteName: updated.siteName, areaSquareMeters: updated.areaSquareMeters },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/customers/[id]/sites/[siteId]
 * Blocked while any case still references the site — deleting premises out from
 * under an open qualification would silently corrupt its Wi-Fi/fibre sizing.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  const { id, siteId } = await params;
  const guard = ApiGuard.verifyAccess(request, "customers:update");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const customer = DatabaseRepository.getCustomerById(id);
  if (!customer || !ApiGuard.canAccessCustomer(user, customer)) {
    return ApiGuard.notFound("Customer");
  }

  const site = DatabaseRepository.getSiteById(siteId);
  if (!site || site.customerId !== customer.id) return ApiGuard.notFound("Site");

  const referencingCases = DatabaseRepository.getCases({ customerId: customer.id }).filter(
    (c) => c.sites?.some((s) => s.id === site.id)
  );
  if (referencingCases.length > 0) {
    return NextResponse.json(
      {
        error: `Site '${site.siteName}' is referenced by ${referencingCases.length} case(s) and cannot be deleted.`
      },
      { status: 409 }
    );
  }

  DatabaseRepository.deleteSite(site.id);

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CUSTOMER_SITE_DELETED",
    resource: "Site",
    resourceId: site.id,
    previousState: { customerId: customer.id, siteName: site.siteName },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ success: true });
}

const SiteSchema = z.object({
  siteName: z.string().trim().min(1).max(160),
  address: z.string().trim().min(1).max(300),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(2).max(80),
  buildingType: z.enum(["OFFICE_HQ", "BRANCH_OFFICE", "WAREHOUSE", "RETAIL_STORE", "DATA_CENTER"]),
  floorsCount: z.number().int().min(1).max(200),
  areaSquareMeters: z.number().positive().max(1_000_000),
  totalStaffCount: z.number().int().min(1).max(1_000_000),
  areas: z.object({
    smallOfficesCount: z.number().int().min(0).max(10_000),
    corridorsLinearMeters: z.number().min(0).max(100_000),
    meetingRoomsCount: z.number().int().min(0).max(10_000),
    largeOpenSpacesCount: z.number().int().min(0).max(10_000)
  })
});
