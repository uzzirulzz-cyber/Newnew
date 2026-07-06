import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { orderNumber, txHash, walletAddress } = body;

  if (!orderNumber) return error("Order number is required", 422);

  try {
    const order = await db.order.findFirst({
      where: { orderNumber: String(orderNumber) },
      include: { payment: true, items: { include: { product: true } } },
    });

    if (!order) return error("Order not found", 404);

    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED" },
    });

    if (order.paymentId) {
      const payment = await db.payment.findUnique({ where: { id: order.paymentId } }).catch(() => null);
      if (payment) {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED", transactionId: txHash || `crypto_${order.orderNumber}` },
        });
      }
    }

    return ok({
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: "COMPLETED",
        total: updatedOrder.total,
        currency: updatedOrder.currency,
        items: order.items.map((it) => ({
          id: it.id,
          title: it.product?.title || "Product",
          licenseKey: it.licenseKey,
        })),
      },
      message: "Payment confirmed. License keys are ready.",
      redirectUrl: `/?payment=success&ref=${updatedOrder.orderNumber}`,
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed to confirm payment", 500);
  }
}
