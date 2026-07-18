import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { getPaymentTokens, isWooCommerceConfigured } from "@/lib/woocommerce-sdk";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  if (!isWooCommerceConfigured()) {
    return ok({ configured: false, tokens: [] });
  }

  const { searchParams } = new URL(request.url);
  const customerId = Number(searchParams.get("customerId") || 0);

  if (!customerId) {
    return ok({ configured: true, tokens: [], message: "customerId required" });
  }

  const tokens = await getPaymentTokens(customerId);
  return ok({ configured: true, tokens });
}
