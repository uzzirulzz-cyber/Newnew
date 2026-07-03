import { NextRequest, NextResponse } from "next/server";
import { parseCallback } from "@/lib/jazzcash";
import { db } from "@/lib/db";

/**
 * POST /api/v1/payments/jazzcash/webhook
 *
 * JazzCash IPN (Instant Payment Notification). JazzCash sends a server-to-
 * server POST with the payment result. We verify the signature and update
 * the order status in the database.
 *
 * Response code 000 = success.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((v, k) => {
      params[k] = String(v);
    });

    const result = parseCallback(params);

    if (!result.verified) {
      console.error("[jazzcash-ipn] signature verification failed", {
        txnRefNo: result.txnRefNo,
      });
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 400 });
    }

    const isSuccess = result.status === "000";

    // Update the order if we can find it by bill reference
    const billRef = params.pp_BillReference;
    if (billRef) {
      try {
        const order = await db.order.findFirst({
          where: { orderNumber: billRef },
        });
        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: isSuccess ? "COMPLETED" : "CANCELLED",
            },
          });
          if (order.paymentId) {
            await db.payment.update({
              where: { id: order.paymentId },
              data: {
                status: isSuccess ? "COMPLETED" : "FAILED",
                transactionId: result.txnRefNo,
              },
            });
          }
          console.log(`[jazzcash-ipn] order ${billRef} → ${isSuccess ? "COMPLETED" : "CANCELLED"}`);
        }
      } catch (dbErr) {
        // DB might be cold-starting — don't fail the webhook
        console.error("[jazzcash-ipn] DB update failed (non-fatal):", dbErr);
      }
    }

    // JazzCash expects a 200 OK to acknowledge receipt
    return NextResponse.json({
      status: "ok",
      txnRefNo: result.txnRefNo,
      paymentStatus: isSuccess ? "success" : "failed",
      amount: result.amount,
      message: result.message,
    });
  } catch (e) {
    console.error("[jazzcash-ipn] error:", e);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
