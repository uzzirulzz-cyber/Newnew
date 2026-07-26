import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getCampaignPerformance, getAdGroupPerformance, getAdPerformance, getAudienceBreakdown } from "@/lib/tiktok-marketing";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/ads/performance
 *   ?level=CAMPAIGN|ADGROUP|AD
 *   ?startDate=YYYY-MM-DD  (default: 7 days ago)
 *   ?endDate=YYYY-MM-DD    (default: today)
 *   ?dimension=age|gender|country|...  (optional — if set, runs audience breakdown)
 *
 * Pulls performance metrics from the TikTok Marketing API report endpoint.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const level = (searchParams.get("level") || "CAMPAIGN") as "CAMPAIGN" | "ADGROUP" | "AD";
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const startDate = searchParams.get("startDate") || weekAgo;
  const endDate = searchParams.get("endDate") || today;
  const dimension = searchParams.get("dimension");

  try {
    let result;
    if (dimension) {
      result = await getAudienceBreakdown({ level, dimension: dimension as any, startDate, endDate });
    } else if (level === "ADGROUP") {
      result = await getAdGroupPerformance(startDate, endDate);
    } else if (level === "AD") {
      result = await getAdPerformance(startDate, endDate);
    } else {
      result = await getCampaignPerformance(startDate, endDate);
    }

    if (result.ok) return ok(result.data);
    return error(result.message || "Failed to fetch performance", 502);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Request failed", 500);
  }
}
