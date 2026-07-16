/**
 * Stripe Payment Gateway Integration.
 *
 * Uses Stripe Checkout (hosted payment page).
 * Customer is redirected to Stripe to pay, then back to the storefront.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY  — sk_live_... (secret key, NOT publishable key)
 *   STRIPE_WEBHOOK_SECRET — whsec_... (for webhook verification)
 *
 * NOTE: The key provided (pk_live_...) is a PUBLISHABLE key.
 * For server-side checkout creation, you need the SECRET key (sk_live_...).
 * Get it from: https://dashboard.stripe.com/apikeys
 */

const STRIPE_API = "https://api.stripe.com/v1";

export function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY || "";
}

export function isStripeConfigured(): boolean {
  const key = getStripeSecretKey();
  return Boolean(key && key.startsWith("sk_"));
}

export function isStripePublishableKey(): boolean {
  // If only a pk_ key is provided, we can use Stripe.js client-side checkout
  const key = getStripeSecretKey();
  return Boolean(key && key.startsWith("pk_"));
}

export interface StripeCheckoutParams {
  amount: number; // in PKR (will be converted to cents/paisa)
  currency: string; // "pkr" or "usd"
  description: string;
  orderReference: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout Session.
 * POST /v1/checkout/sessions
 *
 * Returns { url } — redirect the customer to this URL.
 */
export async function createCheckoutSession(
  payment: StripeCheckoutParams,
): Promise<{ url: string; sessionId: string }> {
  const key = getStripeSecretKey();

  // Stripe expects amount in smallest currency unit (paisa for PKR, cents for USD)
  const amountInSmallestUnit = Math.round(payment.amount * 100);

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("payment_method_types[0]", "card");
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", payment.currency.toLowerCase());
  params.append("line_items[0][price_data][product_data][name]", payment.description.slice(0, 200));
  params.append("line_items[0][price_data][unit_amount]", String(amountInSmallestUnit));
  params.append("success_url", payment.successUrl);
  params.append("cancel_url", payment.cancelUrl);
  params.append("client_reference_id", payment.orderReference);
  if (payment.customerEmail) {
    params.append("customer_email", payment.customerEmail);
  }

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe checkout creation failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { url: data.url, sessionId: data.id };
}
