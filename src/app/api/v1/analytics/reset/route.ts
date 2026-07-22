import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/analytics/reset
 *
 * Resets all platform analytics to zero by deleting every Order (and its
 * OrderItem + Payment rows) and every Notification. Products, users, vendors,
 * categories, coupons, and reviews are preserved — only transactional/analytics
 * data is cleared so the dashboard shows a fresh 0-baseline.
 *
 * This is the "Reset to 0" action on the admin dashboard.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;

  try {
    // Delete in dependency order: OrderItem + Payment depend on Order.
    // Prisma cascades via onDelete: Cascade (defined in schema), but we delete
    // explicitly to be safe across DB engines.
    const deletedItems = await db.orderItem.deleteMany({});
    const deletedPayments = await db.payment.deleteMany({});
    const deletedOrders = await db.order.deleteMany({});
    const deletedNotifs = await db.notification.deleteMany({});

    // Set a runtime flag so the analytics API returns actual zeros (not demo
    // data) for 30 seconds after reset. After 30s, demo data resumes.
    process.env._ANALYTICS_RESET_TIMESTAMP = String(Date.now());

    return ok({
      cleared: {
        orders: deletedOrders.count,
        orderItems: deletedItems.count,
        payments: deletedPayments.count,
        notifications: deletedNotifs.count,
      },
      message: "Dashboard reset to 0. All orders, payments, and notifications cleared.",
    });
  } catch (e) {
    console.error("[analytics/reset] error:", e);
    return error(
      e instanceof Error
        ? e.message
        : "Failed to reset analytics. Database may be unavailable.",
      500,
    );
  }
}
