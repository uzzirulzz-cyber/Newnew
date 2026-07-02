import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { getLemonSqueezyProducts } from "@/lib/lemon-squeezy";
import { ensureSeeded } from "@/lib/ensure-seed";

/**
 * GET /api/v1/products/featured
 *
 * Returns featured Lemon Squeezy products. When LS is not configured, returns
 * an empty list.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const { configured, items } = await getLemonSqueezyProducts();

  if (!configured) {
    return ok({ items: [], configured: false });
  }

  // Show the first 8 LS products as "featured"
  return ok({ items: items.slice(0, 8), configured: true });
}
