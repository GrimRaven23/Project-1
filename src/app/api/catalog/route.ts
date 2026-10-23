import { NextRequest, NextResponse } from "next/server";
import { CatalogService } from "@/core/catalog/catalog-service";
import { ApiGuard } from "@/core/security/api-guard";
import { TelecomDomain } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";

export async function GET(request: NextRequest) {
  // Catalog contains commercial pricing — require an authenticated viewer.
  const guard = ApiGuard.verifyAccess(request, "catalog:view");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const domain = (searchParams.get("domain") as TelecomDomain) || undefined;
  const search = searchParams.get("search") || undefined;
  const state = searchParams.get("state") || undefined;

  let products = domain
    ? CatalogService.getProductsByDomain(domain)
    : CatalogService.getAllProducts();

  if (state) {
    products = products.filter((p) => p.lifecycleState === state);
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.en.toLowerCase().includes(q) ||
        p.name.fr.toLowerCase().includes(q) ||
        p.description.en.toLowerCase().includes(q) ||
        p.description.fr.toLowerCase().includes(q) ||
        p.compatibilityTags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    data: products,
    total: products.length
  });
}

export async function POST(request: NextRequest) {
  const guard = ApiGuard.verifyAccess(request, "catalog:manage");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const { code, domain, category, name, description, capexPriceEur = 0, opexMonthlyEur = 0, compatibilityTags = [] } = body as any;

  if (!code || !domain || !category || !name?.fr) {
    return NextResponse.json(
      { error: "code, domain, category, and name are required fields" },
      { status: 400 }
    );
  }

  // Reject non-numeric pricing rather than coercing it into the catalog.
  if (typeof capexPriceEur !== "number" || capexPriceEur < 0 || typeof opexMonthlyEur !== "number" || opexMonthlyEur < 0) {
    return ApiGuard.badRequest("capexPriceEur and opexMonthlyEur must be non-negative numbers");
  }

  const newProduct = {
    id: `CAT-${Date.now()}`,
    code,
    domain,
    category,
    name: {
      en: name.en || name.fr,
      fr: name.fr
    },
    description: {
      en: description?.en || description?.fr || "",
      fr: description?.fr || description?.en || ""
    },
    lifecycleState: "ACTIVE" as const,
    version: "1.0",
    capexPriceEur,
    opexMonthlyEur,
    compatibilityTags,
    requiresProfessionalInstall: category === "HARDWARE" || category === "SERVICE_INSTALL"
  };

  CatalogService.addProduct(newProduct);

  AuditService.logEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "CATALOG_ITEM_CREATED",
    resource: "CatalogItem",
    resourceId: newProduct.id,
    newState: { code: newProduct.code, capexPriceEur, opexMonthlyEur },
    ipAddress: request.headers.get("x-forwarded-for") || undefined
  });

  return NextResponse.json({ data: newProduct }, { status: 201 });
}
