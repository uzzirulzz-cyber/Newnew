import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { isEasypaisaConfigured, createHostedCheckout } from "@/lib/easypaisa";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/payments/easypaisa/create
 *
 * Creates a hosted checkout URL for Easypaisa.
 * The frontend redirects the customer to the returned checkoutUrl.
 *
 * Body: {
 *   amount: number,        // in PKR
 *   orderRefNum: string,   // order number
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  if (!isEasypaisaConfigured()) {
    return error("Easypaisa is not configured. Set EASYPAISA_STORE_ID and EASYPAISA_HASH_KEY in .env", 503);
  }

  const body = await request.json().catch(() => ({}));
  const { amount, orderRefNum } = body;

  if (!amount || Number(amount) <= 0) {
    return error("A valid amount (PKR) is required", 422);
  }
  if (!orderRefNum) {
    return error("Order reference number is required", 422);
  }

  try {
    const result = createHostedCheckout({
      amount: Number(amount),
      orderRefNum: String(orderRefNum),
    });

    return ok({
      checkoutUrl: result.checkoutUrl,
      sandbox: process.env.EASYPAISA_MODE !== "production",
      message: "Redirect the customer to the checkoutUrl to complete payment.",
    });
  } catch (e) {
    console.error("[easypaisa/create] Error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to create Easypaisa checkout",
      500,
    );
  }
}
