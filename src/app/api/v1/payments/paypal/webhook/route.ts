import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/payments/paypal/webhook
 *
 * PayPal sends webhook events for payment status changes.
 * We listen for CHECKOUT.ORDER.APPROVED and PAYMENT.CAPTURE.COMPLETED.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  try {
    const event = await request.json();
    const eventType = event.event_type;

    console.log("[paypal/webhook] Event:", eventType);

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = event.resource;
      const orderId = resource?.supplementary_data?.related_ids?.order_id;
      const captureId = resource?.id;
      const amount = resource?.amount?.value;
      const currency = resource?.amount?.currency_code;

      if (orderId) {
        // Find the order by PayPal order ID in the payment record
        try {
          const payment = await db.payment.findFirst({
            where: { paymentId: orderId },
          });
          if (payment) {
            await db.payment.update({
              where: { id: payment.id },
              data: { status: "COMPLETED", provider: "PAYPAL", paymentId: captureId },
            });
            if (payment.orderId) {
              await db.order.update({
                where: { id: payment.orderId },
                data: { status: "COMPLETED" },
              });
            }
          }
        } catch (dbErr) {
          console.error("[paypal/webhook] DB update failed:", dbErr);
        }
      }
    }

    return ok({ received: true });
  } catch (e) {
    console.error("[paypal/webhook] Error:", e);
    return ok({ received: true }); // Always return 200 to prevent PayPal retries
  }
}
