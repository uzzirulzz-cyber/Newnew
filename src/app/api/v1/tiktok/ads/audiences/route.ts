import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getCustomAudiences } from "@/lib/tiktok-marketing";

export const dynamic = "force-dynamic";

/** GET /api/v1/tiktok/ads/audiences — list custom audiences. */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  try {
    const result = await getCustomAudiences();
    if (result.ok) return ok(result.data);
    return error(result.message || "Failed", 502);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Request failed", 500);
  }
}
