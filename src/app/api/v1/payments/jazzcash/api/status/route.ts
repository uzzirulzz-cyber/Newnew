import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { isJazzCashConfigured, buildStatusInquiryParams } from "@/lib/jazzcash";

/**
 * POST /api/v1/payments/jazzcash/api/status
 *
 * JazzCash API Testing Mode — Transaction Status Inquiry.
 * Checks the status of a previously created transaction.
 *
 * Body: { txnRefNo: string }
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
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  if (!isJazzCashConfigured()) {
    return error("JazzCash is not configured", 503);
  }

  const body = await request.json().catch(() => ({}));
  const { txnRefNo } = body;

  if (!txnRefNo) return error("Transaction reference number is required", 422);

  const { params, apiUrl } = buildStatusInquiryParams(String(txnRefNo));
  const fullUrl = apiUrl + "/status";

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
    params,
    apiUrl: fullUrl,
    response,
    sandbox: process.env.JAZZCASH_SANDBOX === "true",
  });
}
