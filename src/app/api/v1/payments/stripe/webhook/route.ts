import { NextRequest } from "next/server";
import { ok } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/payments/stripe/webhook
 *
 * Stripe sends webhook events for payment status.
 * We listen for checkout.session.completed.
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderRef = session.client_reference_id;

      if (orderRef) {
        const order = await db.order.findFirst({ where: { orderNumber: orderRef } });
        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { status: "COMPLETED" },
          });
          if (order.paymentId) {
            await db.payment.update({
              where: { id: order.paymentId },
              data: { status: "COMPLETED", provider: "STRIPE", paymentId: session.payment_intent },
            }).catch(() => {});
          }
        }
      }
    }

    return ok({ received: true });
  } catch (e) {
    console.error("[stripe/webhook] Error:", e);
    return ok({ received: true });
  }
}
