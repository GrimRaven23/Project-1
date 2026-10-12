import { NextRequest, NextResponse } from "next/server";
import { CatalogService } from "@/core/catalog/catalog-service";
import { ApiGuard } from "@/core/security/api-guard";
import { TelecomDomain } from "@/core/domain/types";
import { RbacGuard } from "@/core/security/rbac";

export async function GET(request: NextRequest) {
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
  const auth = ApiGuard.authenticate(request);
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const canManageCatalog = RbacGuard.hasPermission(user.role, "catalog:manage");
  if (!canManageCatalog) {
    return NextResponse.json(
      { error: "Access Denied: Role lacks 'catalog:manage' permission" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { code, domain, category, name, description, capexPriceEur = 0, opexMonthlyEur = 0, compatibilityTags = [] } = body;

    if (!code || !domain || !category || !name?.fr) {
      return NextResponse.json(
        { error: "code, domain, category, and name are required fields" },
        { status: 400 }
      );
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
    return NextResponse.json({ data: newProduct }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
