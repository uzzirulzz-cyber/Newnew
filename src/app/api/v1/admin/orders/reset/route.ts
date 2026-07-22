import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/admin/orders/reset
 *
 * Clears ALL orders + order items + payments.
 * Returns the count of deleted documents per collection.
 *
 * Prisma MongoDB with onDelete: NoAction — children must be deleted manually.
 * Payment → Order is a required relation, so Payment must go FIRST.
 */
export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 5); // strict limit — destructive
  if (limited) return limited;

  try {
    // 1. Delete all OrderItems (children of Orders, no required relation to Payment).
    const orderItems = await db.orderItem.deleteMany({});

    // 2. Delete all Payments FIRST (Payment → Order is required).
    const payments = await db.payment.deleteMany({});

    // 3. Now safe to delete Orders (no more Payments referencing them).
    const orders = await db.order.deleteMany({});

    // 4. Reset product salesCounters so reports start fresh.
    await db.product.updateMany({
      data: { salesCount: 0 },
    });

    const cleared = {
      orders: orders.count,
      orderItems: orderItems.count,
      payments: payments.count,
    };

    console.log("[admin/orders/reset] Cleared:", cleared);

    return ok({
      cleared,
      message: `Cleared ${orders.count} orders, ${orderItems.count} order items, ${payments.count} payments.`,
    });
  } catch (e) {
    console.error("[admin/orders/reset] Failed:", e);
    return error(
      e instanceof Error ? e.message : "Reset failed",
      500,
    );
  }
}
