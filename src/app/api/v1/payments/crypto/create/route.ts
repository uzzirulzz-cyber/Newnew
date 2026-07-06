import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { amount, description, orderNumber, customerEmail } = body;

  if (!amount || amount <= 0) return error("A valid amount is required", 422);
  if (!description) return error("Description is required", 422);
  if (!orderNumber) return error("Order number is required", 422);

  // Build the crypto payment page URL — the page itself generates QR codes
  const origin = new URL(request.url).origin;
  const paymentPageUrl = `${origin}/api/v1/payments/crypto/page?amount=${amount}&order=${encodeURIComponent(orderNumber)}&desc=${encodeURIComponent(description)}&email=${encodeURIComponent(customerEmail || "")}`;

  return ok({
    checkoutUrl: paymentPageUrl,
    prepayId: orderNumber,
    qrCode: null,
    qrCodeLink: null,
    deeplink: null,
    merchantId: "PlayBeat Digital",
    message: "Crypto payment page generated.",
  });
}
