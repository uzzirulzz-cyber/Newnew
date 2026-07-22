import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payment-webhook
 *
 * Receives webhook notifications from JazzCash or Zapier integration.
 * Updates order status automatically.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => {
      return Object.fromEntries(new URLSearchParams(request.url.split("?")[1] || ""));
    });

    const {
      amount, order_reference, customer_email, customer_mobile,
      pp_ResponseCode, pp_TxnRefNo, pp_ResponseMessage,
      status, transaction_id,
    } = body;

    console.log("[payment-webhook] received:", { order_reference, status, pp_ResponseCode, amount });

    // Try to find and update the order
    const orderRef = order_reference || body.pp_BillReference || "";
    const isSuccess = (pp_ResponseCode === "000") || (status === "success") || (status === "COMPLETED");
    const txnRef = pp_TxnRefNo || transaction_id || "";

    if (orderRef) {
      try {
        const { db } = await import("@/lib/db");
        const order = await db.order.findFirst({ where: { orderNumber: orderRef } });
        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { status: isSuccess ? "COMPLETED" : "CANCELLED" },
          });
          const payment = await db.payment.findUnique({ where: { orderId: order.id } }).catch(() => null);
          if (payment) {
            await db.payment.update({
              where: { id: payment.id },
              data: { status: isSuccess ? "COMPLETED" : "FAILED", transactionId: txnRef },
            });
          }
          console.log(`[payment-webhook] order ${orderRef} → ${isSuccess ? "COMPLETED" : "CANCELLED"}`);
        }
      } catch (dbErr) {
        console.error("[payment-webhook] DB error:", dbErr);
      }
    }

    return NextResponse.json({
      status: "ok",
      received: true,
      order_reference: orderRef,
      payment_status: isSuccess ? "success" : "failed",
      message: "Webhook processed successfully",
    });
  } catch (e) {
    console.error("[payment-webhook] error:", e);
    return NextResponse.json({ status: "error", message: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    endpoint: "payment-webhook",
    message: "JazzCash payment webhook is active.",
  });
}
