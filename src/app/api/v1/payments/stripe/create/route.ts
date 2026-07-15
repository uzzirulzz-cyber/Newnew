import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { isStripeConfigured, isStripePublishableKey, createCheckoutSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/payments/stripe/create
 *
 * Creates a Stripe Checkout Session and returns the redirect URL.
 * Body: { amount, currency, description, orderReference, customerEmail }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  if (!isStripeConfigured()) {
    // Check if it's a publishable key (client-side checkout)
    if (isStripePublishableKey()) {
      return error(
        "The provided Stripe key is a publishable key (pk_). For server-side checkout, you need the secret key (sk_live_...). Get it from https://dashboard.stripe.com/apikeys",
        503,
      );
    }
    return error("Stripe is not configured. Set STRIPE_SECRET_KEY in .env", 503);
  }

  const body = await request.json().catch(() => ({}));
  const { amount, currency, description, orderReference, customerEmail } = body;

  if (!amount || Number(amount) <= 0) return error("Valid amount required", 422);
  if (!description) return error("Description required", 422);
  if (!orderReference) return error("Order reference required", 422);

  const origin = new URL(request.url).origin;
  const successUrl = `${origin}/?payment=success&order=${encodeURIComponent(orderReference)}`;
  const cancelUrl = `${origin}/?payment=cancelled`;

  try {
    const result = await createCheckoutSession({
      amount: Number(amount),
      currency: currency || "pkr",
      description: String(description),
      orderReference: String(orderReference),
      customerEmail: customerEmail || undefined,
      successUrl,
      cancelUrl,
    });

    return ok({
      url: result.url,
      sessionId: result.sessionId,
      message: "Redirect the customer to the URL to complete payment.",
    });
  } catch (e) {
    console.error("[stripe/create] Error:", e);
    return error(e instanceof Error ? e.message : "Failed to create Stripe checkout", 500);
  }
}
