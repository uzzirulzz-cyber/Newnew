/**
 * TikTok Marketing API client — implements the same capabilities as the
 * TikTok for Business MCP server tools, but natively in TypeScript so
 * PlayBeat can manage and report on TikTok advertising without a Python
 * MCP server.
 *
 * Tools implemented (mapped to MCP server tools):
 *   - tiktok_ads_get_campaigns         → getCampaigns()
 *   - tiktok_ads_get_campaign_details  → getCampaignDetails()
 *   - tiktok_ads_get_adgroups          → getAdGroups()
 *   - tiktok_ads_get_adgroup_details   → getAdGroupDetails()
 *   - tiktok_ads_get_ads               → getAds()
 *   - tiktok_ads_get_ad_details        → getAdDetails()
 *   - tiktok_ads_get_campaign_performance  → getCampaignPerformance()
 *   - tiktok_ads_get_adgroup_performance   → getAdGroupPerformance()
 *   - tiktok_ads_get_ad_performance        → getAdPerformance()
 *   - tiktok_ads_get_audience_breakdown    → getAudienceBreakdown()
 *   - tiktok_ads_wasted_spend_audit        → wastedSpendAudit()
 *   - tiktok_ads_get_custom_audiences      → getCustomAudiences()
 *   - tiktok_ads_get_advertiser_info       → getAdvertiserInfo()
 *   - tiktok_ads_get_pixel_list            → getPixelList()
 *   - tiktok_ads_get_pixel_event_stats     → getPixelEventStats()
 *
 * All calls use the access token + advertiser ID stored in the `tiktok`
 * Settings row (shared with the lead-gen integration in src/lib/tiktok.ts).
 *
 * Base URL: https://business-api.tiktok.com/open_api/v1.3/
 */

import { getTikTokSettings } from "./tiktok";

const BASE = "https://business-api.tiktok.com/open_api/v1.3";

/** Generic API caller — adds auth header, handles errors. */
async function tiktokGet<T = any>(path: string, params?: Record<string, string>): Promise<{
  ok: boolean;
  data?: T;
  message?: string;
}> {
  const settings = await getTikTokSettings();
  if (!settings) return { ok: false, message: "TikTok is not configured" };

  const url = new URL(`${BASE}/${path.replace(/^\//, "")}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
  }
  // advertiser_id is required for most endpoints
  if (!params?.advertiser_id) {
    url.searchParams.set("advertiser_id", settings.advertiserId);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { "Access-Token": settings.accessToken },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.code === 0 || json?.message === "OK") {
      return { ok: true, data: json?.data as T };
    }
    return { ok: false, message: json?.message || `TikTok API error (HTTP ${res.status})` };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out contacting TikTok"
        : e instanceof Error ? e.message : "Request failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Campaign Management
// ---------------------------------------------------------------------------

export async function getCampaigns(opts?: { pageSize?: number; page?: number; campaignIds?: string[] }) {
  return tiktokGet("campaign/get/", {
    page_size: String(opts?.pageSize ?? 50),
    page: String(opts?.page ?? 1),
    ...(opts?.campaignIds?.length ? { campaign_ids: JSON.stringify(opts.campaignIds) } : {}),
  });
}

export async function getCampaignDetails(campaignId: string) {
  return tiktokGet("campaign/get/", { campaign_ids: JSON.stringify([campaignId]) });
}

export async function getAdGroups(campaignId: string, opts?: { pageSize?: number; page?: number }) {
  return tiktokGet("adgroup/get/", {
    campaign_id: campaignId,
    page_size: String(opts?.pageSize ?? 50),
    page: String(opts?.page ?? 1),
  });
}

export async function getAdGroupDetails(adgroupId: string) {
  return tiktokGet("adgroup/get/", { adgroup_ids: JSON.stringify([adgroupId]) });
}

export async function getAds(opts?: { campaignId?: string; adgroupId?: string; adIds?: string[]; pageSize?: number; page?: number }) {
  const params: Record<string, string> = {
    page_size: String(opts?.pageSize ?? 50),
    page: String(opts?.page ?? 1),
  };
  if (opts?.campaignId) params.campaign_id = opts.campaignId;
  if (opts?.adgroupId) params.adgroup_id = opts.adgroupId;
  if (opts?.adIds?.length) params.ad_ids = JSON.stringify(opts.adIds);
  return tiktokGet("ad/get/", params);
}

export async function getAdDetails(adId: string) {
  return tiktokGet("ad/get/", { ad_ids: JSON.stringify([adId]) });
}

// ---------------------------------------------------------------------------
// Performance & Analytics (report/integrated/get/)
// ---------------------------------------------------------------------------

export interface PerformanceReport {
  ok: boolean;
  data?: {
    list?: Array<{
      campaign_id?: string;
      adgroup_id?: string;
      ad_id?: string;
      stat?: {
        spend?: string;
        impressions?: string;
        clicks?: string;
        conversion?: string;
        cost_per_conversion?: string;
        ctr?: string;
        cpc?: string;
        cpm?: string;
        reach?: string;
        video_play_actions?: string;
        // ...TikTok returns many more fields depending on data_level
        [k: string]: any;
      };
      dimensions?: Record<string, string>;
    }>;
    page_info?: { page: number; page_size: number; total_number: number; };
  };
  message?: string;
}

/**
 * Get performance metrics at campaign, adgroup, or ad level.
 * Maps to: tiktok_ads_get_campaign_performance / adgroup_performance / ad_performance
 */
export async function getPerformance(opts: {
  level: "CAMPAIGN" | "ADGROUP" | "AD";
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  campaignIds?: string[];
  adgroupIds?: string[];
  adIds?: string[];
  pageSize?: number;
  page?: number;
}): Promise<PerformanceReport> {
  const settings = await getTikTokSettings();
  if (!settings) return { ok: false, message: "TikTok is not configured" };

  const body: any = {
    advertiser_id: settings.advertiserId,
    report_type: "BASIC",
    data_level: opts.level === "AD" ? "AD_DATA" : opts.level === "ADGROUP" ? "ADGROUP_DATA" : "CAMPAIGN_DATA",
    dimensions: JSON.stringify(opts.level === "CAMPAIGN" ? ["campaign_id"] : opts.level === "ADGROUP" ? ["adgroup_id"] : ["ad_id"]),
    metrics: JSON.stringify(["spend", "impressions", "clicks", "ctr", "cpc", "cpm", "conversion", "cost_per_conversion", "reach"]),
    start_date: opts.startDate,
    end_date: opts.endDate,
    page: opts.page ?? 1,
    page_size: opts.pageSize ?? 50,
  };
  if (opts.campaignIds?.length) body.filtering = JSON.stringify({ campaign_ids: opts.campaignIds });
  if (opts.adgroupIds?.length) body.filtering = JSON.stringify({ adgroup_ids: opts.adgroupIds });
  if (opts.adIds?.length) body.filtering = JSON.stringify({ ad_ids: opts.adIds });

  try {
    const res = await fetch(`${BASE}/report/integrated/get/`, {
      method: "POST",
      headers: {
        "Access-Token": settings.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.code === 0) return { ok: true, data: json?.data };
    return { ok: false, message: json?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, message: e?.name === "TimeoutError" ? "Timed out" : e instanceof Error ? e.message : "Failed" };
  }
}

/** Convenience wrappers for each level (matching MCP tool names). */
export const getCampaignPerformance = (startDate: string, endDate: string, campaignIds?: string[]) =>
  getPerformance({ level: "CAMPAIGN", startDate, endDate, campaignIds });

export const getAdGroupPerformance = (startDate: string, endDate: string, adgroupIds?: string[]) =>
  getPerformance({ level: "ADGROUP", startDate, endDate, adgroupIds });

export const getAdPerformance = (startDate: string, endDate: string, adIds?: string[]) =>
  getPerformance({ level: "AD", startDate, endDate, adIds });

/**
 * Break down performance by audience dimension (age, gender, country, etc.).
 * Maps to: tiktok_ads_get_audience_breakdown
 */
export async function getAudienceBreakdown(opts: {
  level: "CAMPAIGN" | "ADGROUP" | "AD";
  dimension: "age" | "gender" | "country" | "placement" | "device";
  startDate: string;
  endDate: string;
  campaignIds?: string[];
}): Promise<PerformanceReport> {
  const settings = await getTikTokSettings();
  if (!settings) return { ok: false, message: "TikTok is not configured" };

  const body = {
    advertiser_id: settings.advertiserId,
    report_type: "AUDIENCE",
    data_level: opts.level === "AD" ? "AD_DATA" : opts.level === "ADGROUP" ? "ADGROUP_DATA" : "CAMPAIGN_DATA",
    dimensions: JSON.stringify([opts.dimension]),
    metrics: JSON.stringify(["spend", "impressions", "clicks", "ctr", "conversion"]),
    start_date: opts.startDate,
    end_date: opts.endDate,
    page: 1,
    page_size: 100,
    ...(opts.campaignIds?.length ? { filtering: JSON.stringify({ campaign_ids: opts.campaignIds }) } : {}),
  };

  try {
    const res = await fetch(`${BASE}/report/integrated/get/`, {
      method: "POST",
      headers: { "Access-Token": settings.accessToken, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.code === 0) return { ok: true, data: json?.data };
    return { ok: false, message: json?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, message: e?.name === "TimeoutError" ? "Timed out" : e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Read-only audit for spend without conversion signal.
 * Maps to: tiktok_ads_wasted_spend_audit
 *
 * Pulls all campaigns + their performance, flags those with high spend but
 * zero or very low conversions as "wasted spend".
 */
export async function wastedSpendAudit(startDate: string, endDate: string): Promise<{
  ok: boolean;
  data?: {
    totalSpend: number;
    totalConversions: number;
    wastedCampaigns: Array<{ campaignId: string; campaignName?: string; spend: number; conversions: number }>;
  };
  message?: string;
}> {
  const camps = await getCampaigns({ pageSize: 100 });
  if (!camps.ok || !camps.data?.list) {
    return { ok: false, message: camps.message || "Failed to fetch campaigns" };
  }

  const perf = await getCampaignPerformance(startDate, endDate);
  if (!perf.ok) {
    return { ok: false, message: perf.message || "Failed to fetch performance" };
  }

  const campaignNames: Record<string, string> = {};
  for (const c of camps.data.list) {
    campaignNames[c.campaign_id] = c.campaign_name;
  }

  let totalSpend = 0;
  let totalConversions = 0;
  const wasted: Array<{ campaignId: string; campaignName?: string; spend: number; conversions: number }> = [];

  for (const row of perf.data?.list ?? []) {
    const spend = Number(row?.stat?.spend ?? 0);
    const conversions = Number(row?.stat?.conversion ?? 0);
    totalSpend += spend;
    totalConversions += conversions;
    // Flag: spent more than $5 with 0 conversions
    if (spend > 5 && conversions === 0) {
      wasted.push({
        campaignId: row?.campaign_id || "",
        campaignName: campaignNames[row?.campaign_id || ""],
        spend,
        conversions,
      });
    }
  }

  return {
    ok: true,
    data: {
      totalSpend,
      totalConversions,
      wastedCampaigns: wasted.sort((a, b) => b.spend - a.spend),
    },
  };
}

// ---------------------------------------------------------------------------
// Creative & Audience
// ---------------------------------------------------------------------------

/** Maps to: tiktok_ads_get_custom_audiences */
export async function getCustomAudiences() {
  return tiktokGet("dmp/custom_audience/list/");
}

/** Maps to: tiktok_ads_get_advertiser_info */
export async function getAdvertiserInfo() {
  return tiktokGet("advertiser/info/");
}

/** Maps to: tiktok_ads_get_location_info */
export async function getLocationInfo(opts?: { locationNames?: string[] }) {
  const params: Record<string, string> = {};
  if (opts?.locationNames?.length) params.location_names = JSON.stringify(opts.locationNames);
  return tiktokGet("tool/targeting/info/", params);
}

/** Maps to: tiktok_ads_get_pixel_list */
export async function getPixelList() {
  return tiktokGet("pixel/list/");
}

/** Maps to: tiktok_ads_get_pixel_event_stats */
export async function getPixelEventStats(opts: { pixelCode: string; startDate: string; endDate: string }) {
  const settings = await getTikTokSettings();
  if (!settings) return { ok: false, message: "TikTok is not configured" };

  try {
    const res = await fetch(`${BASE}/pixel/event/stats/?advertiser_id=${settings.advertiserId}&pixel_code=${encodeURIComponent(opts.pixelCode)}&start_date=${opts.startDate}&end_date=${opts.endDate}`, {
      headers: { "Access-Token": settings.accessToken },
      signal: AbortSignal.timeout(15_000),
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.code === 0) return { ok: true, data: json?.data };
    return { ok: false, message: json?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed" };
  }
}
