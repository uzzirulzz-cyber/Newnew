import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { isPayPalConfigured, getPayPalSandbox, createPayPalOrder } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/payments/paypal/create
 *
 * Creates a PayPal order and returns the approval URL.
 * The frontend redirects the customer to the approveUrl.
 *
 * Body: {
 *   amount: number,        // in PKR
 *   currency?: string,     // default "USD" (PayPal doesn't support PKR for all accounts)
 *   description: string,
 *   billReference: string, // order number
 *   customerEmail?: string,
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  if (!isPayPalConfigured()) {
    return error("PayPal is not configured", 503);
  }

  const body = await request.json().catch(() => ({}));
  const { amount, currency, description, billReference, customerEmail } = body;

  if (!amount || Number(amount) <= 0) {
    return error("A valid amount is required", 422);
  }
  if (!description) {
    return error("Description is required", 422);
  }
  if (!billReference) {
    return error("Bill reference (order ID) is required", 422);
  }

  // Build return/cancel URLs from request origin
  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/api/v1/payments/paypal/capture?orderRef=${encodeURIComponent(billReference)}`;
  const cancelUrl = `${origin}/`;

  try {
    const result = await createPayPalOrder({
      amount: Number(amount),
      currency: currency || "USD",
      description: String(description),
      billReference: String(billReference),
      customerEmail: customerEmail || undefined,
      returnUrl,
      cancelUrl,
    });

    return ok({
      orderId: result.id,
      approveUrl: result.approveUrl,
      sandbox: getPayPalSandbox(),
      message: "Redirect the customer to the approveUrl to complete payment.",
    });
  } catch (e) {
    console.error("[paypal/create] Error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to create PayPal order",
      500,
    );
  }
}
