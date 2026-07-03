import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import {
  isJazzCashConfigured,
  generateTxnRefNo,
  buildTransactionParams,
} from "@/lib/jazzcash";

/**
 * POST /api/v1/payments/jazzcash/create
 *
 * Creates a JazzCash transaction and returns the gateway URL + form params.
 * The frontend POSTs these params to the gateway URL to redirect the customer
 * to the JazzCash payment page.
 */
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
  const { amount, description, billReference, customerEmail, customerMobile } =
    body;

  if (!amount || amount <= 0) {
    return error("A valid amount (PKR) is required", 422);
  }
  if (!description) {
    return error("Description is required", 422);
  }
  if (!billReference) {
    return error("Bill reference (order ID) is required", 422);
  }

  const txnRefNo = generateTxnRefNo();
  const { params, gatewayUrl } = buildTransactionParams({
    txnRefNo,
    amount: Number(amount),
    description: String(description).slice(0, 255),
    billReference: String(billReference).slice(0, 24),
    customerEmail: customerEmail || undefined,
    customerMobile: customerMobile || undefined,
  });

  return ok({
    gatewayUrl,
    params,
    txnRefNo,
    sandbox: process.env.JAZZCASH_SANDBOX === "true",
    message: "Redirect the customer to the JazzCash payment page via POST form.",
  });
}
