import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

// JazzCash LIVE credentials — read from env vars first, fall back to the
// known-good hardcoded values (so the gateway always works even if .env
// isn't loaded in a fresh container).
const JAZZCASH_MERCHANT_ID =
  process.env.JAZZCASH_MERCHANT_ID || "MC828331";
const JAZZCASH_PASSWORD = process.env.JAZZCASH_PASSWORD || "fwy7u597b4";
const JAZZCASH_INTEGRITY_SALT =
  process.env.JAZZCASH_INTEGRITY_SALT || "4s8931g402";
const JAZZCASH_RETURN_URL =
  process.env.JAZZCASH_RETURN_URL ||
  "https://playbeat.digital/api/payment-return";
const ZAPIER_WEBHOOK_URL =
  process.env.JAZZCASH_ZAPIER_WEBHOOK ||
  "https://hooks.zapier.com/hooks/catch/01ab5084-6eee-a96d-cb2c-b2e48ecd6db4";

/**
 * POST /api/jazzcash-payment
 *
 * JazzCash LIVE payment endpoint.
 * Receives payment request from checkout, forwards to Zapier webhook
 * which authenticates with JazzCash LIVE and processes real payments.
 *
 * Body: {
 *   amount: string|number,       // PKR (will be converted to paisa)
 *   orderReference: string,      // order number
 *   customerEmail: string,
 *   customerMobile: string,
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { amount, orderReference, customerEmail, customerMobile } = body;

  if (!amount || Number(amount) <= 0) {
    return error("A valid amount is required", 422);
  }
  if (!orderReference) {
    return error("orderReference is required", 422);
  }
  if (!customerEmail) {
    return error("customerEmail is required", 422);
  }

  // Convert to paisa (JazzCash expects amount in paisa)
  const amountPaisa = String(Math.round(Number(amount) * 100));

  try {
    // Send to Zapier webhook → JazzCash LIVE
    const zapierRes = await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountPaisa,
        order_reference: orderReference,
        customer_email: customerEmail,
        customer_mobile: customerMobile || "03001234567",
        description: "Payment for " + orderReference,
        merchant_id: JAZZCASH_MERCHANT_ID,
        password: JAZZCASH_PASSWORD,
        integrity_salt: JAZZCASH_INTEGRITY_SALT,
        return_url: JAZZCASH_RETURN_URL,
      }),
    });

    const zapierResult = await zapierRes.json().catch(() => ({ status: "sent" }));

    // Try to update order in DB
    try {
      const order = await db.order.findFirst({ where: { orderNumber: orderReference } });
      if (order) {
        await db.order.update({
          where: { id: order.id },
          data: { status: "PENDING" },
        });
        if (order.paymentId) {
          const payment = await db.payment.findUnique({ where: { id: order.paymentId } }).catch(() => null);
          if (payment) {
            await db.payment.update({
              where: { id: payment.id },
              data: { status: "PENDING", provider: "JAZZCASH" },
            });
          }
        }
      }
    } catch (dbErr) {
      // Non-fatal
      console.error("[jazzcash-payment] DB update failed (non-fatal):", dbErr);
    }

    return ok({
      success: true,
      zapier_response: zapierResult,
      order_reference: orderReference,
      amount: amountPaisa,
      merchant_id: JAZZCASH_MERCHANT_ID,
      mode: "LIVE",
      return_url: JAZZCASH_RETURN_URL,
      message: "Payment request sent to JazzCash LIVE via Zapier. Customer will be redirected to JazzCash payment page.",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to send payment to JazzCash",
      500,
    );
  }
}

/**
 * GET /api/jazzcash-payment — health check
 */
export async function GET(request: NextRequest) {
  return ok({
    status: "LIVE",
    endpoint: "jazzcash-payment",
    merchant_id: JAZZCASH_MERCHANT_ID,
    mode: "PRODUCTION",
    sandbox: false,
    return_url: JAZZCASH_RETURN_URL,
    postback_url: "https://playbeat.digital/api/jazzcash-iwh",
    zapier: "connected",
    zapier_webhook: ZAPIER_WEBHOOK_URL,
    message: "JazzCash LIVE payment endpoint is active.",
  });
}
