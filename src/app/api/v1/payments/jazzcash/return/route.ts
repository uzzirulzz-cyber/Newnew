import { NextRequest, NextResponse } from "next/server";
import { parseCallback } from "@/lib/jazzcash";

/**
 * GET/POST /api/v1/payments/jazzcash/return
 *
 * The customer is redirected here after completing (or cancelling) payment
 * on the JazzCash payment page. We read the callback params, verify the
 * signature, and redirect to the storefront with a success/failure status.
 *
 * The redirect URL is built from the REQUEST's origin (the server that
 * received the callback) — NOT from pp_ReturnURL or a hardcoded domain.
 * This ensures the customer is always sent back to the correct storefront.
 */
function handleReturn(params: Record<string, string>, requestUrl: string) {
  const result = parseCallback(params);

  // JazzCash response codes: 000 = success, others = failure
  const isSuccess = result.verified && result.status === "000";

  const statusParam = isSuccess ? "success" : "failed";
  const msgParam = encodeURIComponent(result.message || "Payment processed");

  // Build redirect URL from the request's own origin — NOT pp_ReturnURL
  // (pp_ReturnURL might be set to a different domain in .env, or a
  // placeholder. The customer should go back to THIS server's storefront.)
  const origin = new URL(requestUrl).origin;
  const redirectUrl = new URL(`/?payment=${statusParam}&ref=${result.txnRefNo}&msg=${msgParam}`, origin);

  // Add extended response fields if available
  if (result.retrievalReferenceNo) {
    redirectUrl.searchParams.set("rrn", result.retrievalReferenceNo);
  }
  if (result.amount) {
    redirectUrl.searchParams.set("amount", String(result.amount));
  }
  if (result.currency) {
    redirectUrl.searchParams.set("currency", result.currency);
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}

export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((v, k) => {
    params[k] = String(v);
  });
  return handleReturn(params, request.url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((v, k) => {
    params[k] = String(v);
  });
  return handleReturn(params, request.url);
}
