import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import {
  isJazzCashConfigured,
  buildRefundParams,
  buildMwalletRefundParams,
} from "@/lib/jazzcash";

/**
 * POST /api/v1/payments/jazzcash/api/refund
 *
 * JazzCash API Testing Mode — Refund a previous transaction.
 *
 * Two refund modes are supported:
 *
 * 1. Standard Card / OTC refund (default):
 *    Body: { originalTxnRefNo, refundAmount, billReference, description }
 *    Endpoint: /CustomerPortal/api/2.0/transaction/refund
 *    pp_TxnType: "REFUND"
 *
 * 2. MWALLET refund (JazzCash mobile wallet):
 *    Body: { originalTxnRefNo, refundAmount, billReference, description, mpin, mode: "mwallet" }
 *    Endpoint: /ApplicationAPI/API/Purchase/domwalletrefundtransaction
 *    pp_TxnType: "MWRFD"
 *    Requires: pp_MPIN (4-digit mobile wallet PIN)
 *
 * Amount format: PKR rupees (e.g. 100.00 → pp_Amount = "10000" paisa).
 * The originalTxnRefNo must reference a previously successful transaction.
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
    return error("JazzCash is not configured", 503);
  }

  const body = await request.json().catch(() => ({}));
  const {
    originalTxnRefNo,
    refundAmount,
    billReference,
    description,
    mode, // "mwallet" for MWALLET refund; omit for standard refund
    mpin, // 4-digit MPIN (required for mode="mwallet")
  } = body;

  if (!originalTxnRefNo) return error("Original transaction reference (originalTxnRefNo) is required", 422);
  if (!refundAmount || refundAmount <= 0) return error("A valid refund amount (PKR) is required", 422);
  if (!billReference) return error("Bill reference is required", 422);
  if (!description) return error("Description is required", 422);

  try {
    if (mode === "mwallet") {
      // MWALLET refund — separate endpoint + MPIN required
      if (!mpin) {
        return error("pp_MPIN (4-digit mobile wallet PIN) is required for MWALLET refunds", 422);
      }
      const { params, apiUrl } = buildMwalletRefundParams(
        String(originalTxnRefNo),
        Number(refundAmount),
        String(billReference).slice(0, 24),
        String(description).slice(0, 255),
        String(mpin),
      );

      let response: Record<string, unknown>;
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(params),
        });
        response = await parseResponse(res);
      } catch (fetchErr) {
        response = {
          error: fetchErr instanceof Error ? fetchErr.message : "Network error",
          endpoint: apiUrl,
        };
      }

      return ok({
        mode: "mwallet",
        params,
        apiUrl,
        response,
        sandbox: process.env.JAZZCASH_SANDBOX === "true",
      });
    }

    // Standard refund (Card / OTC)
    const { params, apiUrl } = buildRefundParams(
      String(originalTxnRefNo),
      Number(refundAmount),
      String(billReference).slice(0, 24),
      String(description).slice(0, 255),
    );

    let response: Record<string, unknown>;
    try {
      const res = await fetch(apiUrl + "/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(params),
      });
      response = await parseResponse(res);
    } catch (fetchErr) {
      response = {
        error: fetchErr instanceof Error ? fetchErr.message : "Network error",
        endpoint: apiUrl + "/refund",
      };
    }

    return ok({
      mode: "standard",
      params,
      apiUrl: apiUrl + "/refund",
      response,
      sandbox: process.env.JAZZCASH_SANDBOX === "true",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "JazzCash refund API call failed",
      500,
    );
  }
}
