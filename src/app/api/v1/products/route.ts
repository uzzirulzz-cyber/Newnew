import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit, paginate } from "@/lib/api";
import { serializeProduct } from "@/lib/serializers";
import { ensureSeeded } from "@/lib/ensure-seed";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 120);
  if (limited) return limited;
  await ensureSeeded();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") ?? 12)));
  const search = searchParams.get("search")?.trim() || "";
  const category = searchParams.get("category") || "";
  const type = searchParams.get("type") || "";
  const sort = searchParams.get("sort") || "popular"; // popular | newest | price_asc | price_desc | rating
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const featured = searchParams.get("featured");

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { shortDescription: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (category) {
    where.category = { slug: category };
  }
  if (type) {
    where.type = type;
  }
  if (featured === "true") {
    where.featured = true;
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as { gte?: number }).gte = Number(minPrice);
    if (maxPrice) (where.price as { lte?: number }).lte = Number(maxPrice);
  }

  let orderBy: Record<string, string> = { salesCount: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };
  else if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "rating") orderBy = { rating: "desc" };

  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      include: { vendor: true, category: true },
    }),
  ]);

  const serialized = items.map(serializeProduct);
  const result = paginate(serialized, page, limit);
  // paginate recomputed total from array length; override with real db count
  return ok({
    items: result.items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
