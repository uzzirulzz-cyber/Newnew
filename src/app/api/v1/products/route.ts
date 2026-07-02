import { NextRequest } from "next/server";
import { ok, applyRateLimit, paginate } from "@/lib/api";
import { getLemonSqueezyProducts } from "@/lib/lemon-squeezy";
import { ensureSeeded } from "@/lib/ensure-seed";

/**
 * GET /api/v1/products
 *
 * The storefront shows ONLY products listed in your Lemon Squeezy store.
 * When LEMONSQUEEZY_API_KEY + LEMONSQUEEZY_STORE_ID are configured, this
 * returns the live LS catalog. When not configured, returns an empty list
 * (the UI shows a "connect Lemon Squeezy" state).
 *
 * No random/seeded products are returned — only what you list in Lemon
 * Squeezy.
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

  const { configured, items } = await getLemonSqueezyProducts();

  if (!configured) {
    return ok({
      items: [],
      page,
      limit,
      total: 0,
      totalPages: 1,
      configured: false,
      message:
        "Lemon Squeezy is not connected. Set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID to show your products.",
    });
  }

  // Apply search filter
  let filtered = items;
  if (search) {
    const q = search.toLowerCase();
    filtered = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.shortDescription ?? "").toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
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
  // "popular" / "rating" keep LS order

  const total = filtered.length;
  const result = paginate(filtered, page, limit);

  return ok({
    items: result.items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    configured: true,
  });
}
