import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/coupons/update
 *
 * Updates an existing coupon (toggle active, change value, etc.).
 *
 * Body: {
 *   id: string,
 *   active?: boolean,
 *   value?: number,
 *   minPurchase?: number,
 *   maxUsage?: number,
 *   expiry?: string,
 *   type?: "PERCENT" | "FLAT" | "PERCENTAGE" | "FIXED",
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, active, value, minPurchase, maxUsage, expiry, type } = body;

  if (!id) return error("Coupon ID is required", 422);

  // Build update data — only include fields that are provided
  const updateData: any = {};
  if (active !== undefined) updateData.active = Boolean(active);
  if (value !== undefined) updateData.value = Number(value);
  if (minPurchase !== undefined) updateData.minPurchase = Number(minPurchase);
  if (maxUsage !== undefined) updateData.maxUses = maxUsage ? Number(maxUsage) : null;
  if (expiry !== undefined) updateData.expiresAt = expiry ? new Date(expiry) : null;
  if (type !== undefined) {
    updateData.type =
      type === "PERCENT" || type === "PERCENTAGE" ? "PERCENTAGE" :
      type === "FLAT" || type === "FIXED" ? "FIXED" :
      "PERCENTAGE";
  }

  try {
    const coupon = await db.coupon.update({
      where: { id: String(id) },
      data: updateData,
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
      message: `Coupon ${coupon.code} updated`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update coupon",
      500,
    );
  }
}
