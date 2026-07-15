import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { capturePayPalOrder } from "@/lib/paypal";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/payments/paypal/capture?token=ORDER_ID&orderRef=PB-XXXX
 *
 * PayPal redirects here after customer approves the payment.
 * The `token` query param is the PayPal order ID.
 * We capture the payment, update the order in DB, and redirect to the storefront.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const paypalOrderId = searchParams.get("token");
  const orderRef = searchParams.get("orderRef");

  if (!paypalOrderId) {
    return NextResponse.redirect(new URL("/?payment=cancelled", request.url));
  }

  try {
    // Capture the payment
    const result = await capturePayPalOrder(paypalOrderId);

    if (!result.captured) {
      console.error("[paypal/capture] Payment not captured:", result);
      return NextResponse.redirect(new URL("/?payment=failed", request.url));
    }

    // Update the order in DB
    if (orderRef) {
      try {
        const order = await db.order.findFirst({ where: { orderNumber: orderRef } });
        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { status: "COMPLETED" },
          });
          if (order.paymentId) {
            await db.payment.update({
              where: { id: order.paymentId },
              data: { status: "COMPLETED", provider: "PAYPAL", paymentId: result.transactionId },
            }).catch(() => {});
          }
        }
      } catch (dbErr) {
        console.error("[paypal/capture] DB update failed:", dbErr);
      }
    }

    // Redirect to storefront with success + order reference
    const successUrl = new URL("/?payment=success", request.url);
    if (orderRef) successUrl.searchParams.set("order", orderRef);
    return NextResponse.redirect(successUrl);
  } catch (e) {
    console.error("[paypal/capture] Error:", e);
    return NextResponse.redirect(new URL("/?payment=failed", request.url));
  }
}
