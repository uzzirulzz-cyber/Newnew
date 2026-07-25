import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getCampaigns, getAdGroups, getAds } from "@/lib/tiktok-marketing";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/ads/campaigns
 *   ?type=campaigns|adgroups|ads
 *   ?campaignId=  (for adgroups)
 *   ?page=&pageSize=
 *
 * Lists campaigns, ad groups, or ads from the TikTok Marketing API.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "campaigns";
  const campaignId = searchParams.get("campaignId") || undefined;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 50;

  try {
    let result;
    if (type === "adgroups" && campaignId) {
      result = await getAdGroups(campaignId, { page, pageSize });
    } else if (type === "ads") {
      result = await getAds({ campaignId, page, pageSize });
    } else {
      result = await getCampaigns({ page, pageSize });
    }

    if (result.ok) return ok(result.data);
    return error(result.message || "Failed to fetch from TikTok", 502);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Request failed", 500);
  }
}
