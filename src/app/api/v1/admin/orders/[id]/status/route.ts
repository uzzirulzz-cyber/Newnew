import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/orders/[id]/status
 *
 * Updates an order's status. Also keeps the linked Payment row in sync when
 * sensible (PAID/COMPLETED → mark payment COMPLETED, REFUNDED → mark payment
 * REFUNDED, CANCELLED → mark payment FAILED).
 *
 * Body: { status: "PENDING" | "PAID" | "COMPLETED" | "REFUNDED" | "CANCELLED" }
 */
const VALID_STATUSES = new Set([
  "PENDING",
  "PAID",
  "COMPLETED",
  "REFUNDED",
  "CANCELLED",
]);

const PAYMENT_BY_ORDER: Record<string, string> = {
  PENDING: "PENDING",
  PAID: "COMPLETED",
  COMPLETED: "COMPLETED",
  REFUNDED: "REFUNDED",
  CANCELLED: "FAILED",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!id) return error("Order ID is required", 422);

  const body = await request.json().catch(() => ({}));
  const status = String(body?.status ?? "").toUpperCase().trim();

  if (!VALID_STATUSES.has(status)) {
    return error(
      `Invalid status. Must be one of: ${Array.from(VALID_STATUSES).join(", ")}`,
      422,
    );
  }

  try {
    // Verify the order exists
    const existing = await db.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, payment: true },
    });
    if (!existing) return error("Order not found", 404);

    // Update order status
    const updated = await db.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } }, payment: true },
    });

    // Sync linked payment when there is one
    let payment = updated.payment;
    if (payment) {
      const paymentStatus = PAYMENT_BY_ORDER[status];
      if (paymentStatus && paymentStatus !== payment.status) {
        payment = await db.payment.update({
          where: { orderId: id },
          data: { status: paymentStatus },
        });
      }
    } else if (status === "PAID" || status === "COMPLETED") {
      // Auto-create a Payment row for orders that didn't have one yet
      payment = await db.payment.create({
        data: {
          orderId: id,
          provider: "MANUAL",
          amount: existing.total,
          currency: existing.currency,
          status: "COMPLETED",
          transactionId: `manual-${Date.now()}`,
        },
      });
    }

    return ok({
      order: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        subtotal: updated.subtotal,
        discount: updated.discount,
        total: updated.total,
        currency: updated.currency,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        createdAt: updated.createdAt,
        paymentStatus: payment?.status ?? null,
        paymentProvider: payment?.provider ?? null,
        itemCount: updated.items.length,
        items: updated.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          title: it.product?.title ?? "Product",
          price: it.price,
          licenseKey: it.licenseKey,
        })),
      },
      message: `Order ${updated.orderNumber} marked ${status}`,
    });
  } catch (e) {
    console.error("[admin/orders/status] error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to update order status",
      500,
    );
  }
}
