import { NextRequest } from "next/server";
import { ok, applyRateLimit, paginate } from "@/lib/api";
import { getLemonSqueezyProducts } from "@/lib/lemon-squeezy";
import { ensureSeeded } from "@/lib/ensure-seed";
import { db } from "@/lib/db";

/**
 * GET /api/v1/products
 *
 * Returns products for the storefront. Sources (in priority order):
 *   1. Lemon Squeezy (if configured) — live LS catalog
 *   2. Database (seeded products) — fallback when LS isn't configured
 *
 * Query params:
 *   page       — 1-based page number (default 1)
 *   limit      — items per page, max 48 (default 12)
 *   search     — full-text search on title/description
 *   sort       — popular | price_asc | price_desc | newest
 *   category   — filter by category slug (e.g. "games", "ai-tools")
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 120);
  if (limited) return limited;
  await ensureSeeded();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") ?? 12)));
  const search = searchParams.get("search")?.trim() || "";
  const sort = searchParams.get("sort") || "popular";
  const category = searchParams.get("category")?.trim() || "";

  // Try Lemon Squeezy first
  const { configured: lsConfigured, items: lsItems } = await getLemonSqueezyProducts();

  // Also fetch DB products (seeded) — merge with LS if both exist
  let dbProducts: any[] = [];
  try {
    dbProducts = await db.product.findMany({
      where: { status: { in: ["PUBLISHED", "APPROVED"] } },
      include: { category: true, vendor: true },
      orderBy: { salesCount: "desc" },
    });
  } catch {
    // DB might be cold-starting — non-fatal
  }

  // Normalize DB products to the same shape as LS products
  const dbNormalized = dbProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription || "",
    description: p.description || "",
    type: p.type,
    status: p.status,
    price: p.discountPrice ?? p.price,
    regularPrice: p.price,
    discountPrice: p.discountPrice,
    currency: p.currency || "PKR",
    sku: p.sku || "",
    cover: p.cover || "",
    images: [],
    videoUrl: "",
    tags: [],
    licenseType: p.licenseType || "",
    downloadFile: p.downloadFile || "",
    fileSize: p.fileSize || 0,
    version: p.version || "",
    changelog: "",
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    featured: p.featured || false,
    rating: p.rating || 0,
    reviewCount: p.reviewCount || 0,
    salesCount: p.salesCount || 0,
    vendor: p.vendor
      ? {
          id: p.vendor.id,
          storeName: p.vendor.storeName,
          slug: p.vendor.slug,
          verified: p.vendor.verified,
        }
      : null,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    effectivePrice: p.discountPrice ?? p.price,
    // Flag so the frontend knows the source
    source: "db" as const,
  }));

  // Merge: prefer LS products if configured, but include DB products too
  // (dedup by title — LS wins if there's a conflict)
  const lsTitles = new Set(lsItems.map((p) => p.title.toLowerCase()));
  const merged = [
    ...lsItems,
    ...dbNormalized.filter((p) => !lsTitles.has(p.title.toLowerCase())),
  ];

  // Apply category filter
  let filtered = merged;
  if (category) {
    filtered = filtered.filter((p) => {
      // LS products: check p.category?.slug
      const pAny = p as any;
      const catSlug = pAny.category?.slug || pAny.categorySlug || "";
      return catSlug === category;
    });
  }

  // Apply search filter
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.shortDescription ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }

  // Apply sort
  if (sort === "price_asc") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else if (sort === "newest") {
    filtered = [...filtered].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }
  // "popular" / "rating" keep default order (salesCount desc)

  const total = filtered.length;
  const result = paginate(filtered, page, limit);

  return ok({
    items: result.items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    configured: lsConfigured || dbNormalized.length > 0,
    source: lsConfigured ? "lemon-squeezy" : dbNormalized.length > 0 ? "database" : "empty",
  });
}
