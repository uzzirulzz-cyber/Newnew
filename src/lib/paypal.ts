/**
 * PayPal Payment Gateway Integration.
 *
 * Uses PayPal REST API v2 (Checkout Orders) — the customer is redirected
 * to PayPal to approve the payment, then we capture it.
 *
 * Credentials are EMBEDDED as fallback (same pattern as jazzcash.ts + db.ts)
 * so the gateway always works even if .env is missing.
 *
 * LIVE credentials — PRODUCTION mode.
 */

// PayPal API base URLs
const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

// === EMBEDDED LIVE CREDENTIALS (fallback when env vars not set) ===
const EMBEDDED_PAYPAL_CLIENT_ID =
  "AbqQ1geIbV60QcMwuUKXV3webajuQdeSs7W5wxjapr3JPk7vDKPzgAEcKYdiijVSztsmPn6gAfP3ALg7";
const EMBEDDED_PAYPAL_SECRET =
  "EGtpHQEWSRl1MeQIYDaD3Dg6QwaJQRsnow1VYbrCzOegm49pxM1UnRwEhLAEOmbCPeCrZwmnBJmOfraw";
const EMBEDDED_PAYPAL_SANDBOX = "true"; // Sandbox mode — switch to "false" when you have LIVE credentials

// === Env var accessors with embedded fallback ===
export function getPayPalClientId(): string {
  return process.env.PAYPAL_CLIENT_ID || EMBEDDED_PAYPAL_CLIENT_ID;
}
export function getPayPalSecret(): string {
  return process.env.PAYPAL_CLIENT_SECRET || EMBEDDED_PAYPAL_SECRET;
}
export function getPayPalSandbox(): boolean {
  return (process.env.PAYPAL_SANDBOX || EMBEDDED_PAYPAL_SANDBOX) === "true";
}
export function getPayPalBaseUrl(): string {
  return getPayPalSandbox() ? SANDBOX_BASE : LIVE_BASE;
}

export function isPayPalConfigured(): boolean {
  // Always configured — embedded fallback credentials are always present
  return Boolean(getPayPalClientId() && getPayPalSecret());
}

/**
 * Get an OAuth2 access token from PayPal.
 * POST /v1/oauth2/token with Basic auth (client_id:secret)
 */
export async function getPayPalAccessToken(): Promise<string> {
  const baseUrl = getPayPalBaseUrl();
  const clientId = getPayPalClientId();
  const secret = getPayPalSecret();
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

export interface PayPalOrderParams {
  amount: number; // in PKR (or USD — see currency)
  currency: string; // "PKR" or "USD"
  description: string;
  billReference: string; // order number
  customerEmail?: string;
  returnUrl: string; // URL to redirect after approval
  cancelUrl: string; // URL to redirect if cancelled
}

/**
 * Create a PayPal checkout order.
 * POST /v2/checkout/orders
 * Returns { id, approveUrl } — customer must be redirected to approveUrl.
 */
export async function createPayPalOrder(
  payment: PayPalOrderParams,
): Promise<{ id: string; approveUrl: string }> {
  const baseUrl = getPayPalBaseUrl();
  const token = await getPayPalAccessToken();

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: payment.billReference,
        description: payment.description.slice(0, 127),
        amount: {
          currency_code: payment.currency,
          value: payment.amount.toFixed(2),
        },
      },
    ],
    application_context: {
      return_url: payment.returnUrl,
      cancel_url: payment.cancelUrl,
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
    },
  };

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal order creation failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  const approveUrl =
    data.links?.find((l: any) => l.rel === "approve")?.href || "";

  return { id: data.id, approveUrl };
}

/**
 * Capture an approved PayPal order.
 * POST /v2/checkout/orders/{id}/capture
 * Called after the customer approves the payment on PayPal.
 */
export async function capturePayPalOrder(
  orderId: string,
): Promise<{ captured: boolean; transactionId?: string; amount?: string; currency?: string }> {
  const baseUrl = getPayPalBaseUrl();
  const token = await getPayPalAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  const purchaseUnit = data.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];

  return {
    captured: capture?.status === "COMPLETED",
    transactionId: capture?.id,
    amount: capture?.amount?.value,
    currency: capture?.amount?.currency_code,
  };
}

/**
 * Get order details (to verify status).
 * GET /v2/checkout/orders/{id}
 */
export async function getPayPalOrder(orderId: string): Promise<any> {
  const baseUrl = getPayPalBaseUrl();
  const token = await getPayPalAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal get order failed (${res.status}): ${err}`);
  }

  return res.json();
}
