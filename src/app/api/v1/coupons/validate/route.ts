import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit, validate, v } from "@/lib/api";
import { ensureSeeded } from "@/lib/ensure-seed";

// POST /api/v1/coupons/validate  { code, subtotal }
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  await ensureSeeded();

  const body = await request.json().catch(() => ({}));
  const result = validate<{ code: string; subtotal: number }>(body, {
    code: v.required("Coupon code"),
    subtotal: v.number("Subtotal"),
  });
  if (!result.valid) return error("Validation failed", 422, result.errors);

  const { code, subtotal } = result.data;
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });

  if (!coupon || !coupon.active) return error("Invalid or inactive coupon", 404);
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return error("This coupon has expired", 410);
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    return error("This coupon has reached its usage limit", 410);
  if (subtotal < coupon.minPurchase)
    return error(
      `Minimum purchase of $${coupon.minPurchase.toFixed(2)} required`,
      400,
    );

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = (subtotal * coupon.value) / 100;
  } else if (coupon.type === "FIXED") {
    discount = Math.min(coupon.value, subtotal);
  }
  discount = Math.round(discount * 100) / 100;

  return ok({
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
    },
    discount,
    subtotal,
    total: Math.max(0, Math.round((subtotal - discount) * 100) / 100),
  });
}
