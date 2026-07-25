import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getPixelList, getPixelEventStats } from "@/lib/tiktok-marketing";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/ads/pixels
 *   ?pixelCode=  (if set, returns event stats for that pixel)
 *   ?startDate=&endDate=
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const pixelCode = searchParams.get("pixelCode");
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const startDate = searchParams.get("startDate") || weekAgo;
  const endDate = searchParams.get("endDate") || today;

  try {
    if (pixelCode) {
      const result = await getPixelEventStats({ pixelCode, startDate, endDate });
      if (result.ok) return ok(result.data);
      return error(result.message || "Failed", 502);
    }
    const result = await getPixelList();
    if (result.ok) return ok(result.data);
    return error(result.message || "Failed", 502);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Request failed", 500);
  }
}
