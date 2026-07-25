import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getAdvertiserInfo } from "@/lib/tiktok-marketing";

export const dynamic = "force-dynamic";

/** GET /api/v1/tiktok/ads/advertiser — get account-level advertiser details. */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  try {
    const result = await getAdvertiserInfo();
    if (result.ok) return ok(result.data);
    return error(result.message || "Failed", 502);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Request failed", 500);
  }
}
