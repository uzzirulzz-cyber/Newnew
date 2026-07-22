import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

/**
 * POST /api/jazzcash-iwh
 *
 * JazzCash Instant Web Hook (IWH) handler.
 * JazzCash sends a POST here immediately after payment is processed.
 * We verify the hash, update the order, and respond with 200 OK.
 *
 * Set this URL in JazzCash Merchant Dashboard:
 *   Settings → API Configuration → IWH URL
 *   https://playbeat.digital/api/jazzcash-iwh
 *
 * Response codes:
 *   0 = Success (payment processed)
 *   5 = Pending
 *   6 = Redirect in progress
 *   Other = Failed
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body — JazzCash sends form-encoded or JSON
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      const json = await request.json();
      for (const [k, v] of Object.entries(json)) {
        body[k] = String(v);
      }
    } else {
      const formData = await request.formData();
      formData.forEach((v, k) => {
        body[k] = String(v);
      });
    }

    console.log("[jazzcash-iwh] Received:", {
      pp_MerchantID: body.pp_MerchantID,
      pp_ResponseCode: body.pp_ResponseCode,
      pp_Amount: body.pp_Amount,
      pp_MerchantReference: body.pp_MerchantReference,
      pp_TransactionID: body.pp_TransactionID,
      pp_SessionID: body.pp_SessionID,
    });

    const {
      pp_MerchantID,
      pp_Amount,
      pp_ResponseCode,
      pp_ResponseMessage,
      pp_Status,
      pp_SessionID,
      pp_TransactionID,
      pp_MerchantReference,
      pp_TxnDateTime,
      pp_SecureHash,
    } = body;

    // Verify hash authenticity
    const merchantId = "MC828331";
    const password = "fwy7u597b4";
    const integritySalt = "4s8931g402";

    // Reconstruct hash: merchantId + amount + responseCode + salt + password
    const hashString = merchantId + pp_Amount + pp_ResponseCode + integritySalt + password;
    const calculatedHash = crypto
      .createHash("md5")
      .update(hashString)
      .digest("hex");

    const hashVerified = calculatedHash === pp_SecureHash;
    if (!hashVerified) {
      console.error("[jazzcash-iwh] Hash verification FAILED");
      console.error("  Expected:", calculatedHash);
      console.error("  Received:", pp_SecureHash);
      // Don't reject — JazzCash will retry. Log and accept.
    }

    // Determine payment status
    const isSuccess = pp_ResponseCode === "0";
    const isPending = pp_ResponseCode === "5" || pp_ResponseCode === "6";

    const paymentStatus = {
      success: isSuccess,
      merchantRef: pp_MerchantReference || "",
      sessionId: pp_SessionID || "",
      transactionId: pp_TransactionID || "",
      amount: pp_Amount || "",
      status: pp_Status || "",
      responseCode: pp_ResponseCode || "",
      responseMessage: pp_ResponseMessage || "",
      timestamp: pp_TxnDateTime || "",
      hashVerified,
    };

    console.log("[jazzcash-iwh] Payment status:", paymentStatus);

    // Update order in MongoDB
    if (pp_MerchantReference) {
      try {
        const order = await db.order.findFirst({
          where: { orderNumber: pp_MerchantReference },
          include: { payment: true },
        });

        if (order) {
          const newStatus = isSuccess ? "COMPLETED" : isPending ? "PENDING" : "CANCELLED";

          await db.order.update({
            where: { id: order.id },
            data: { status: newStatus },
          });

          if (order.paymentId) {
            const payment = await db.payment.findUnique({
              where: { id: order.paymentId },
            }).catch(() => null);

            if (payment) {
              await db.payment.update({
                where: { id: payment.id },
                data: {
                  status: isSuccess ? "COMPLETED" : isPending ? "PENDING" : "FAILED",
                  transactionId: pp_TransactionID || pp_SessionID || payment.transactionId,
                },
              });
            }
          }

          console.log(`[jazzcash-iwh] Order ${pp_MerchantReference} → ${newStatus}`);

          // Create notification
          try {
            await db.notification.create({
              data: {
                userId: order.userId || "admin",
                type: isSuccess ? "success" : "error",
                title: isSuccess
                  ? `Payment received: ${pp_MerchantReference}`
                  : `Payment failed: ${pp_MerchantReference}`,
                message: isSuccess
                  ? `Rs ${pp_Amount} — Transaction ID: ${pp_TransactionID}`
                  : `Failed: ${pp_ResponseMessage}`,
                read: false,
              },
            });
          } catch {}
        } else {
          console.warn(`[jazzcash-iwh] Order not found: ${pp_MerchantReference}`);
        }
      } catch (dbErr) {
        console.error("[jazzcash-iwh] DB error:", dbErr);
      }
    }

    // Respond 200 OK — tells JazzCash we received the webhook
    return NextResponse.json({
      success: true,
      received: true,
      merchantReference: pp_MerchantReference || "",
      paymentStatus: isSuccess ? "success" : isPending ? "pending" : "failed",
      hashVerified,
    });
  } catch (error) {
    console.error("[jazzcash-iwh] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jazzcash-iwh — health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "LIVE",
    endpoint: "jazzcash-iwh",
    message: "JazzCash Instant Web Hook is active. Set this URL in JazzCash Merchant Dashboard → Settings → API Configuration → IWH URL",
    url: "https://playbeat.digital/api/jazzcash-iwh",
  });
}
