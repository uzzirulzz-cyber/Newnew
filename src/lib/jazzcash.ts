import crypto from "crypto";

/**
 * JazzCash Payment Gateway Integration.
 *
 * Supports JazzCash's Hosted Checkout (Web Payment) flow:
 *  1. Merchant creates a transaction with an HMAC-SHA256 signature
 *  2. Customer is redirected to the JazzCash payment page (POST form)
 *  3. After payment, JazzCash redirects back to the Return URL
 *  4. JazzCash sends an IPN (Instant Payment Notification) to the webhook
 *
 * Required env vars:
 *   JAZZCASH_MERCHANT_ID
 *   JAZZCASH_PASSWORD
 *   JAZZCASH_INTEGRITY_SALT   (hash key)
 *   JAZZCASH_RETURN_URL       (e.g. https://playbeat.live/api/v1/payments/jazzcash/return)
 *   JAZZCASH_POSTBACK_URL     (e.g. https://playbeat.live/api/v1/payments/jazzcash/webhook)
 *
 * Set JAZZCASH_SANDBOX=true for sandbox, false for live.
 */

const SANDBOX_URL =
  "https://sandbox.jazzcash.com.pk/CustomerServices/onlinepayment/transaction/Request";
const LIVE_URL =
  "https://seeds.jazzcash.com.pk/CustomerServices/onlinepayment/transaction/Request";

export function isJazzCashConfigured(): boolean {
  return Boolean(
    process.env.JAZZCASH_MERCHANT_ID &&
      process.env.JAZZCASH_PASSWORD &&
      process.env.JAZZCASH_INTEGRITY_SALT,
  );
}

function getGatewayUrl(): string {
  return process.env.JAZZCASH_SANDBOX === "true" ? SANDBOX_URL : LIVE_URL;
}

/** Generate a unique transaction reference number (20 alphanumeric chars). */
export function generateTxnRefNo(): string {
  const ts = Date.now().toString();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ref = `T${ts.slice(-13)}${rand}`;
  return ref.slice(0, 20);
}

/**
 * Compute the HMAC-SHA256 secure hash for JazzCash.
 *
 * JazzCash expects: sort all pp_ parameters alphabetically, join values with
 * `&`, prepend the integrity salt, then HMAC-SHA256 → uppercase hex.
 */
export function computeSecureHash(
  params: Record<string, string>,
  salt: string,
): string {
  // Sort keys alphabetically, exclude pp_SecureHash itself
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== "pp_SecureHash")
    .sort();

  // Build the string: salt&val1&val2&val3...
  const parts = [salt, ...sortedKeys.map((k) => params[k] || "")];
  const data = parts.join("&");

  return crypto
    .createHmac("sha256", salt)
    .update(data, "utf8")
    .digest("hex")
    .toUpperCase();
}

/** Verify the secure hash returned by JazzCash in the IPN/return callback. */
export function verifySecureHash(
  params: Record<string, string>,
  salt: string,
  receivedHash: string,
): boolean {
  const computed = computeSecureHash(params, salt);
  return computed === receivedHash;
}

export interface JazzCashPaymentParams {
  txnRefNo: string;
  amount: number; // in PKR rupees (will be converted to paisa)
  description: string;
  billReference: string;
  customerEmail?: string;
  customerMobile?: string;
}

/** Build the full parameter set for a JazzCash transaction request. */
export function buildTransactionParams(
  payment: JazzCashPaymentParams,
): { params: Record<string, string>; gatewayUrl: string } {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID!;
  const password = process.env.JAZZCASH_PASSWORD!;
  const salt = process.env.JAZZCASH_INTEGRITY_SALT!;
  const returnUrl =
    process.env.JAZZCASH_RETURN_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/v1/payments/jazzcash/return`;

  const now = new Date();
  const txnDateTime = now
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14); // YYYYMMDDHHmmss

  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const txnExpiryDateTime = expiry
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14);

  const params: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_SubMerchantID: "",
    pp_Password: password,
    pp_TxnRefNo: payment.txnRefNo,
    pp_Amount: String(Math.round(payment.amount * 100)), // paisa
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: txnDateTime,
    pp_TxnExpiryDateTime: txnExpiryDateTime,
    pp_BillReference: payment.billReference,
    pp_Description: payment.description,
    pp_MobileNumber: payment.customerMobile || "",
    pp_CNIC: "",
    pp_Email: payment.customerEmail || "",
    pp_ReturnURL: returnUrl,
    ppmpf_1: "",
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  // Compute and append the secure hash
  params.pp_SecureHash = computeSecureHash(params, salt);

  return { params, gatewayUrl: getGatewayUrl() };
}

/** Parse the JazzCash callback (return URL or IPN) and verify the signature. */
export function parseCallback(
  query: Record<string, string>,
): {
  verified: boolean;
  txnRefNo: string;
  status: string;
  amount: number | null;
  message: string;
} {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT || "";
  const receivedHash = query.pp_SecureHash || "";

  // Verify the signature
  const verified = verifySecureHash(query, salt, receivedHash);

  const amountStr = query.pp_Amount;
  const amount = amountStr ? parseInt(amountStr, 10) / 100 : null;

  return {
    verified,
    txnRefNo: query.pp_TxnRefNo || "",
    status: query.pp_ResponseCode || "",
    amount,
    message: query.pp_ResponseMessage || "",
  };
}
