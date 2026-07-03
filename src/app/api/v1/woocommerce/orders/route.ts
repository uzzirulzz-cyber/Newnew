import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { getWooCommerceOrders } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  const result = await getWooCommerceOrders();
  return ok(result);
}
