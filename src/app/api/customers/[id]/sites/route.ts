import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { AuditService } from "@/core/audit/audit-logger";
import { z } from "zod";

/**
 * GET /api/customers/[id]/sites
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "customers:view");
  if (guard instanceof NextResponse) return guard;

  const customer = DatabaseRepository.getCustomerById(id);
  if (!customer || !ApiGuard.canAccessCustomer(guard.user, customer)) {
    return ApiGuard.notFound("Customer");
  }

  const sites = DatabaseRepository.getSitesByCustomerId(customer.id);
  return NextResponse.json({ data: sites, total: sites.length });
}

/**
 * POST /api/customers/[id]/sites
 * Site geometry drives Wi-Fi density sizing and fibre qualification, so the
 * numeric fields are validated rather than trusted.
 */
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

  const parsed = SiteSchema.safeParse(body);
  if (!parsed.success) {
    return ApiGuard.badRequest(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
  }

  const data = parsed.data;

  // Duplicate detection: an identical site name under the same customer is a mistake.
  const existing = DatabaseRepository.getSitesByCustomerId(customer.id);
  if (existing.some((s) => s.siteName.toLowerCase() === data.siteName.toLowerCase())) {
    return NextResponse.json(
      { error: `A site named '${data.siteName}' already exists for this customer` },
      { status: 409 }
    );
  }

  // Cross-field sanity: area and staff counts must be internally consistent.
  if (data.floorsCount < 1) {
    return ApiGuard.badRequest("floorsCount must be at least 1");
  }
  if (data.areaSquareMeters < 1 || data.totalStaffCount < 1) {
    return ApiGuard.badRequest("areaSquareMeters and totalStaffCount must be positive");
  }

  const site = DatabaseRepository.saveSite({
    id: `SITE-${Date.now().toString(36).toUpperCase()}`,
    customerId: customer.id,
    siteName: data.siteName,
    address: data.address,
    postalCode: data.postalCode,
    city: data.city,
    country: data.country,
    buildingType: data.buildingType,
    floorsCount: data.floorsCount,
    areaSquareMeters: data.areaSquareMeters,
    totalStaffCount: data.totalStaffCount,
    areas: data.areas
  });

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CUSTOMER_SITE_ADDED",
    resource: "Site",
    resourceId: site.id,
    newState: { customerId: customer.id, siteName: site.siteName, city: site.city },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ data: site }, { status: 201 });
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
