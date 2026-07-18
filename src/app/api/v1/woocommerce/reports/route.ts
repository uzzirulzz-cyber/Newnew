import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { getSalesReport, isWooCommerceConfigured } from "@/lib/woocommerce-sdk";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  if (!isWooCommerceConfigured()) {
    return ok({ configured: false, report: null });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month";

  const report = await getSalesReport(period);
  return ok({ configured: true, report });
}
