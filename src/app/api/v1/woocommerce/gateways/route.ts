import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { getPaymentGateways, isWooCommerceConfigured } from "@/lib/woocommerce-sdk";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  if (!isWooCommerceConfigured()) {
    return ok({ configured: false, gateways: [] });
  }

  const gateways = await getPaymentGateways();
  return ok({ configured: true, gateways });
}
