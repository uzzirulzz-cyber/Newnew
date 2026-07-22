import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/admin/reports/reset
 *
 * Reports are generated from orders/payments, so clearing those clears
 * all underlying report data. Deletes all orders + payments.
 *
 * Returns the count of deleted documents per collection.
 */
export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 5); // strict limit — destructive
  if (limited) return limited;

  try {
    // 1. Delete OrderItems (children of Orders).
    const orderItems = await db.orderItem.deleteMany({});

    // 2. Delete Payments FIRST (Payment → Order is required).
    const payments = await db.payment.deleteMany({});

    // 3. Delete Orders.
    const orders = await db.order.deleteMany({});

    // 4. Reset product counters.
    await db.product.updateMany({
      data: { salesCount: 0 },
    });

    const cleared = {
      orders: orders.count,
      orderItems: orderItems.count,
      payments: payments.count,
    };

    console.log("[admin/reports/reset] Cleared:", cleared);

    return ok({
      cleared,
      message: `Cleared ${orders.count} orders, ${payments.count} payments. All report data reset.`,
    });
  } catch (e) {
    console.error("[admin/reports/reset] Failed:", e);
    return error(
      e instanceof Error ? e.message : "Reset failed",
      500,
    );
  }
}
