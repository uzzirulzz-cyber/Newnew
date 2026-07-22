import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/coupons/delete
 *
 * Deletes a coupon by ID.
 *
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id } = body;

  if (!id) return error("Coupon ID is required", 422);

  try {
    const coupon = await db.coupon.delete({
      where: { id: String(id) },
    });

    return ok({
      deleted: true,
      code: coupon.code,
      message: `Coupon ${coupon.code} deleted`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete coupon",
      500,
    );
  }
}
