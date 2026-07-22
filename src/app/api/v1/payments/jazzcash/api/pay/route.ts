import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import {
  isJazzCashConfigured,
  generateTxnRefNo,
  buildApiPayParams,
} from "@/lib/jazzcash";

/**
 * POST /api/v1/payments/jazzcash/api/pay
 *
 * JazzCash API Testing Mode — Direct API Pay request.
 * Sends a JSON POST to the JazzCash API endpoint (no browser redirect).
 * Supports Card (MPAY), Mobile Wallet (MWALLET), and OTC transaction types.
 *
 * Body: {
 *   amount: number,         // PKR rupees
 *   description: string,
 *   billReference: string,
 *   txnType?: "MPAY" | "MWALLET" | "OTC",  // default MPAY
 *   customerEmail?: string,
 *   customerMobile?: string,
 *   cardNumber?: string,    // for Card payments
 *   cardExpiry?: string,    // MMYY format
 *   cardCvv?: string,
 *   cnic?: string,
 * }
 */
async function parseResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: res.status, statusText: res.statusText };
  }
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  if (!isJazzCashConfigured()) {
    return error(
      "JazzCash is not configured. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT in .env",
      503,
    );
  }

  const body = await request.json().catch(() => ({}));
  const { amount, description, billReference, txnType, customerEmail, customerMobile, cardNumber, cardExpiry, cardCvv, cnic } = body;

  if (!amount || amount <= 0) return error("A valid amount (PKR) is required", 422);
  if (!description) return error("Description is required", 422);
  if (!billReference) return error("Bill reference is required", 422);

  const txnRefNo = generateTxnRefNo();
  const { params, apiUrl } = buildApiPayParams({
    txnRefNo,
    amount: Number(amount),
    description: String(description).slice(0, 255),
    billReference: String(billReference).slice(0, 24),
    customerEmail,
    customerMobile,
    txnType,
    cardNumber,
    cardExpiry,
    cardCvv,
    cnic,
  });

  const fullUrl = apiUrl + "/pay";
  let response: Record<string, unknown>;
  try {
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(params),
    });
    response = await parseResponse(res);
  } catch (fetchErr) {
    response = {
      error: fetchErr instanceof Error ? fetchErr.message : "Network error",
      endpoint: fullUrl,
    };
  }

  return ok({
    txnRefNo,
    apiUrl: fullUrl,
    params,
    response,
    sandbox: process.env.JAZZCASH_SANDBOX === "true",
  });
}
