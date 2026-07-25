import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { wastedSpendAudit } from "@/lib/tiktok-marketing";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/ads/audit
 *   ?startDate=YYYY-MM-DD  (default: 30 days ago)
 *   ?endDate=YYYY-MM-DD    (default: today)
 *
 * Runs a read-only wasted-spend audit — flags campaigns with high spend
 * but zero conversions.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const startDate = searchParams.get("startDate") || monthAgo;
  const endDate = searchParams.get("endDate") || today;

  try {
    const result = await wastedSpendAudit(startDate, endDate);
    if (result.ok) return ok(result.data);
    return error(result.message || "Audit failed", 502);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Request failed", 500);
  }
}
