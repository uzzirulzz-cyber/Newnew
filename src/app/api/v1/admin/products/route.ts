import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/products
 *
 * Returns ALL products (admin view) with optional filtering.
 *
 * Query params:
 *   ?status=    — filter by status (PUBLISHED, PENDING, DRAFT)
 *   ?search=    — search product title / sku / description
 *   ?page=1     — pagination (default 1)
 *   ?limit=50   — items per page (default 50, max 200)
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim().toUpperCase() || "";
  const search = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));

  try {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: { category: true, vendor: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ok({
      items: products.map((p) => {
        let cover: any = null;
        try {
          cover = p.cover ? JSON.parse(p.cover) : null;
        } catch {
          cover = p.cover;
        }
        let images: string[] = [];
        try {
          images = p.images ? JSON.parse(p.images) : [];
        } catch {
          images = [];
        }
        let tags: string[] = [];
        try {
          tags = p.tags ? JSON.parse(p.tags) : [];
        } catch {
          tags = [];
        }
        const effectivePrice =
          p.discountPrice !== null && p.discountPrice < p.price
            ? p.discountPrice
            : p.price;
        const discountPercent =
          p.discountPrice !== null && p.discountPrice < p.price
            ? Math.round((1 - p.discountPrice / p.price) * 100)
            : 0;
        return {
          id: p.id,
          _id: p.id,
          title: p.title,
          slug: p.slug,
          shortDescription: p.shortDescription,
          description: p.description,
          type: p.type,
          status: p.status,
          price: p.price,
          discountPrice: p.discountPrice,
          effectivePrice,
          discountPercent,
          currency: p.currency,
          sku: p.sku,
          stock: p.stock,
          cover,
          imageUrl: typeof cover === "string" ? cover : cover?.image ?? null,
          images,
          tags,
          licenseType: p.licenseType,
          downloadFile: p.downloadFile,
          fileSize: p.fileSize,
          version: p.version,
          featured: p.featured,
          rating: p.rating,
          reviewCount: p.reviewCount,
          salesCount: p.salesCount,
          category: p.category
            ? {
                id: p.category.id,
                name: p.category.name,
                slug: p.category.slug,
                icon: p.category.icon,
                color: p.category.color,
              }
            : null,
          vendor: p.vendor
            ? {
                id: p.vendor.id,
                storeName: p.vendor.storeName,
                slug: p.vendor.slug,
                verified: p.vendor.verified,
                rating: p.vendor.rating,
              }
            : null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      }),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    console.error("[admin/products] error:", e);
    return ok({
      items: [],
      page,
      limit,
      total: 0,
      totalPages: 1,
    });
  }
}
