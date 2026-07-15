/**
 * Easypaisa Payment Gateway Integration.
 *
 * Ported from github.com/zfhassaan/easypaisa (PHP/Laravel) to TypeScript.
 *
 * Two checkout modes:
 *   1. Hosted Checkout — redirect customer to Easypaisa's payment page
 *   2. Direct Checkout — REST API call (MA = Mobile Account)
 *
 * Required env vars:
 *   EASYPAISA_STORE_ID       — store ID from Easypaisa merchant portal
 *   EASYPAISA_HASH_KEY       — hash key for AES-128-ECB encryption
 *   EASYPAISA_USERNAME       — API username (direct checkout)
 *   EASYPAISA_PASSWORD       — API password (direct checkout)
 *   EASYPAISA_MODE           — "sandbox" or "production"
 *   EASYPAISA_CALLBACK_URL   — URL Easypaisa sends postback to after payment
 *
 * Easypaisa API URLs:
 *   Sandbox:  https://easypaisa-stg.easypaisa.com.pk/easypaisa/merchant-api/v1
 *   Production: https://easypaisa.easypaisa.com.pk/easypaisa/merchant-api/v1
 *   Hosted checkout (sandbox): https://easypaisa-stg.easypaisa.com.pk/easypaisa/txnservice/checkout/checkout-form
 *   Hosted checkout (production): https://easypaisa.easypaisa.com.pk/easypaisa/txnservice/checkout/checkout-form
 */

import crypto from "crypto";

const SANDBOX_API_URL = "https://easypaisa-stg.easypaisa.com.pk/easypaisa/merchant-api/v1";
const PRODUCTION_API_URL = "https://easypaisa.easypaisa.com.pk/easypaisa/merchant-api/v1";
const SANDBOX_CHECKOUT_URL = "https://easypaisa-stg.easypaisa.com.pk/easypaisa/txnservice/checkout/checkout-form";
const PRODUCTION_CHECKOUT_URL = "https://easypaisa.easypaisa.com.pk/easypaisa/txnservice/checkout/checkout-form";

// === Env accessors ===
export function getEasypaisaStoreId(): string {
  return process.env.EASYPAISA_STORE_ID || "";
}
export function getEasypaisaHashKey(): string {
  return process.env.EASYPAISA_HASH_KEY || "";
}
export function getEasypaisaUsername(): string {
  return process.env.EASYPAISA_USERNAME || "";
}
export function getEasypaisaPassword(): string {
  return process.env.EASYPAISA_PASSWORD || "";
}
export function getEasypaisaMode(): "sandbox" | "production" {
  return process.env.EASYPAISA_MODE === "production" ? "production" : "sandbox";
}
export function getEasypaisaCallbackUrl(): string {
  return process.env.EASYPAISA_CALLBACK_URL || "https://playbeat.digital/api/v1/payments/easypaisa/callback";
}
export function isEasypaisaConfigured(): boolean {
  return Boolean(getEasypaisaStoreId() && getEasypaisaHashKey());
}

function getApiUrl(): string {
  return getEasypaisaMode() === "production" ? PRODUCTION_API_URL : SANDBOX_API_URL;
}
function getCheckoutUrl(): string {
  return getEasypaisaMode() === "production" ? PRODUCTION_CHECKOUT_URL : SANDBOX_CHECKOUT_URL;
}

/**
 * Generate the encrypted hash request for hosted checkout.
 * Uses AES-128-ECB encryption (same as the PHP package).
 *
 * The query string format:
 *   amount=X&orderRefNum=Y&paymentMethod=InitialRequest&postBackURL=Z&storeId=W&timeStamp=T
 */
function getEncryptedHashRequest(params: {
  amount: string;
  orderRefNum: string;
  postBackURL: string;
  storeId: string;
  timeStamp: string;
}): string {
  const query = `amount=${params.amount}&orderRefNum=${params.orderRefNum}&paymentMethod=InitialRequest&postBackURL=${params.postBackURL}&storeId=${params.storeId}&timeStamp=${params.timeStamp}`;

  const hashKey = getEasypaisaHashKey();
  // AES-128-ECB encryption
  const cipher = crypto.createCipheriv("aes-128-ecb", Buffer.from(hashKey, "utf8"), null);
  cipher.setAutoPadding(true);
  const encrypted = Buffer.concat([cipher.update(query, "utf8"), cipher.final()]);
  return encrypted.toString("base64");
}

/**
 * Get current timestamp in Asia/Karachi timezone.
 * Format: YYYY-MM-DDTHH:mm:ss
 */
function getTimestamp(): string {
  const now = new Date();
  // Convert to PKT (UTC+5)
  const pkt = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const year = pkt.getUTCFullYear();
  const month = String(pkt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(pkt.getUTCDate()).padStart(2, "0");
  const hours = String(pkt.getUTCHours()).padStart(2, "0");
  const minutes = String(pkt.getUTCMinutes()).padStart(2, "0");
  const seconds = String(pkt.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export interface EasypaisaHostedParams {
  amount: number; // PKR
  orderRefNum: string; // order number
}

/**
 * Build the hosted checkout URL for Easypaisa.
 * Customer is redirected to this URL to complete payment.
 *
 * Returns the full checkout URL with encrypted hash.
 */
export function createHostedCheckout(
  payment: EasypaisaHostedParams,
): { checkoutUrl: string } {
  const storeId = getEasypaisaStoreId();
  const callbackUrl = getEasypaisaCallbackUrl();
  const timeStamp = getTimestamp();

  const encryptedHash = getEncryptedHashRequest({
    amount: String(payment.amount),
    orderRefNum: payment.orderRefNum,
    postBackURL: callbackUrl,
    storeId,
    timeStamp,
  });

  // Build the checkout URL with query params
  const params = new URLSearchParams({
    storeId,
    orderId: payment.orderRefNum,
    transactionAmount: String(payment.amount),
    mobileAccountNo: "",
    emailAddress: "",
    transactionType: "InitialRequest",
    tokenExpiry: "",
    bankIdentificationNumber: "",
    encryptedHashRequest: encodeURIComponent(encryptedHash),
    merchantPaymentMethod: "",
    postBackURL: callbackUrl,
    signature: "",
  });

  const checkoutUrl = `${getCheckoutUrl()}?${params.toString()}`;
  return { checkoutUrl };
}

export interface EasypaisaDirectParams {
  amount: number; // PKR
  orderId: string;
  mobileAccountNo: string; // customer's Easypaisa mobile number (03XXXXXXXXX)
  emailAddress: string;
}

/**
 * Send a direct checkout request to Easypaisa REST API.
 * This charges the customer's Easypaisa mobile account directly.
 *
 * Returns the API response.
 */
export async function sendDirectRequest(
  payment: EasypaisaDirectParams,
): Promise<any> {
  const storeId = getEasypaisaStoreId();
  const username = getEasypaisaUsername();
  const password = getEasypaisaPassword();

  // Base64 encoded credentials: username:password
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  const data = {
    orderId: payment.orderId,
    storeId,
    transactionAmount: String(payment.amount),
    transactionType: "MA", // Mobile Account
    mobileAccountNo: payment.mobileAccountNo,
    emailAddress: payment.emailAddress,
  };

  const res = await fetch(getApiUrl(), {
    method: "POST",
    headers: {
      credentials,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

/**
 * Parse the postback callback from Easypaisa.
 * Easypaisa sends payment result to the callback URL.
 */
export function parseCallback(params: Record<string, string>): {
  success: boolean;
  orderId: string;
  transactionId: string;
  amount: string;
  message: string;
} {
  const responseCode = params.responseCode || params.ResponseCode || "";
  const orderId = params.orderId || params.OrderId || "";
  const transactionId = params.transactionId || params.TransactionId || "";
  const amount = params.transactionAmount || params.Amount || "";
  const message = params.responseDesc || params.ResponseDesc || "";

  return {
    success: responseCode === "0000",
    orderId,
    transactionId,
    amount,
    message,
  };
}
