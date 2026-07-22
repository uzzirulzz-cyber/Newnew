import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/coupons/create
 *
 * Creates a new coupon in the database so it can be validated at checkout.
 *
 * Body: {
 *   code: string,         // uppercase
 *   type: "PERCENTAGE" | "FIXED",  // admin UI sends "PERCENT" | "FLAT" — we normalize
 *   value: number,
 *   minPurchase?: number,
 *   maxUsage?: number,
 *   expiry?: string,      // ISO date or YYYY-MM-DD
 *   active?: boolean,
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { code, type, value, minPurchase, maxUsage, expiry, active } = body;

  if (!code) return error("Coupon code is required", 422);
  if (!type) return error("Coupon type is required", 422);
  if (value === undefined || value < 0) return error("A valid value is required", 422);

  // Normalize type: admin UI uses PERCENT/FLAT, DB uses PERCENTAGE/FIXED
  const normalizedType =
    type === "PERCENT" || type === "PERCENTAGE" ? "PERCENTAGE" :
    type === "FLAT" || type === "FIXED" ? "FIXED" :
    "PERCENTAGE";

  try {
    const coupon = await db.coupon.create({
      data: {
        code: String(code).toUpperCase().trim(),
        type: normalizedType,
        value: Number(value),
        minPurchase: Number(minPurchase) || 0,
        maxUses: maxUsage ? Number(maxUsage) : null,
        expiresAt: expiry ? new Date(expiry) : null,
        active: active !== false,
      },
    });

    return ok({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase,
        maxUsage: coupon.maxUses,
        usage: coupon.usedCount,
        expiry: coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : "",
        active: coupon.active,
      },
      message: `Coupon ${coupon.code} created`,
    }, 201);
  } catch (e: any) {
    // P2002 = unique constraint violation (code already exists)
    if (e?.code === "P2002") {
      return error("Coupon code already exists. Use a different code.", 409);
    }
    return error(
      e instanceof Error ? e.message : "Failed to create coupon",
      500,
    );
  }
}
