import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/01ab5084-6eee-a96d-cb2c-b2e48ecd6db4";

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { amount, order_reference, customer_email, customer_mobile, description } = body;

  if (!amount || amount <= 0) return error("A valid amount is required", 422);
  if (!order_reference) return error("Order reference is required", 422);

  try {
    const res = await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: String(Math.round(Number(amount) * 100)),
        order_reference,
        customer_email: customer_email || "",
        customer_mobile: customer_mobile || "",
        description: description || "Payment for " + order_reference,
        merchant_id: "MC828331",
        password: "fwy7u597b4",
        integrity_salt: "4s8931g402",
        return_url: "https://playbeat.digital/jazzcash/return",
      }),
    });

    const result = await res.json().catch(() => ({ status: "sent" }));

    return ok({
      zapier_response: result,
      webhook_url: ZAPIER_WEBHOOK_URL,
      order_reference,
      amount,
      message: "Payment request sent to JazzCash via Zapier.",
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed to send payment to Zapier", 500);
  }
}
