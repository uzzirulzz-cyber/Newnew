import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/coupons/list
 *
 * Returns all coupons for the admin panel. Not rate-limited heavily
 * because it's an admin-only endpoint (in production, add auth check).
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type, // PERCENTAGE | FIXED
        value: c.value,
        minPurchase: c.minPurchase,
        maxUsage: c.maxUses,
        usage: c.usedCount,
        expiry: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : "",
        active: c.active,
        createdAt: c.createdAt,
      })),
    });
  } catch (e) {
    return ok({ items: [] }); // don't fail the admin panel
  }
}
