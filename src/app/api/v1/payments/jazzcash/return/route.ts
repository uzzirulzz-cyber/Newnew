import { NextRequest, NextResponse } from "next/server";
import { parseCallback } from "@/lib/jazzcash";

/**
 * GET/POST /api/v1/payments/jazzcash/return
 *
 * The customer is redirected here after completing (or cancelling) payment
 * on the JazzCash payment page. We read the callback params, verify the
 * signature, and redirect to the storefront with a success/failure status.
 */
function handleReturn(params: Record<string, string>) {
  const result = parseCallback(params);

  // JazzCash response codes: 000 = success, others = failure
  const isSuccess = result.verified && result.status === "000";

  const statusParam = isSuccess ? "success" : "failed";
  const msgParam = encodeURIComponent(result.message || "Payment processed");

  return NextResponse.redirect(
    new URL(`/?payment=${statusParam}&ref=${result.txnRefNo}&msg=${msgParam}`, params.pp_ReturnURL || "https://playbeat.live"),
    { status: 302 },
  );
}

export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  return handleReturn(params);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((v, k) => {
    params[k] = String(v);
  });
  return handleReturn(params);
}
