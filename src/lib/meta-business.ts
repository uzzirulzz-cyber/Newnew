/**
 * Meta (Facebook) Business integration.
 *
 * Uses the Facebook Graph API to manage ad accounts, campaigns, and insights.
 * The user access token (with ads_read + business_management permissions) is
 * stored in the database and used for all API calls.
 *
 * Graph API base: https://graph.facebook.com/v21.0/
 *
 * Permissions on the stored token:
 *   - ads_read: read ad accounts, campaigns, insights
 *   - business_management: manage business portfolios
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/
 */

import { db } from "@/lib/db";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";
const APP_ID = "1768887737439036";

const SETTING_KEY = "meta_business";

export interface MetaBusinessConfig {
  accessToken: string;
  appId: string;
  updatedAt?: string;
}

/** Load Meta Business config from the DB. */
export async function getMetaBusinessConfig(): Promise<MetaBusinessConfig | null> {
  try {
    const setting = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (parsed?.accessToken) {
        return {
          accessToken: String(parsed.accessToken),
          appId: String(parsed.appId || APP_ID),
          updatedAt: parsed.updatedAt,
        };
      }
    }
  } catch {
    // fall through
  }
  // Env fallback
  const envToken = process.env.META_ACCESS_TOKEN;
  if (envToken) {
    return { accessToken: envToken, appId: APP_ID };
  }
  return null;
}

export async function isMetaBusinessConfigured(): Promise<boolean> {
  return Boolean(await getMetaBusinessConfig());
}

/** Save the Meta Business access token to the DB. */
export async function saveMetaBusinessConfig(accessToken: string): Promise<void> {
  const value = JSON.stringify({
    accessToken,
    appId: APP_ID,
    updatedAt: new Date().toISOString(),
  });
  const existing = await db.settings.findUnique({ where: { key: SETTING_KEY } });
  if (existing) {
    await db.settings.update({ where: { key: SETTING_KEY }, data: { value } });
  } else {
    await db.settings.create({ data: { key: SETTING_KEY, value } });
  }
}

/** Clear the stored Meta Business config. */
export async function clearMetaBusinessConfig(): Promise<void> {
  try {
    const existing = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (existing) await db.settings.delete({ where: { key: SETTING_KEY } });
  } catch {
    // best-effort
  }
}

/** Generic Graph API GET caller. */
async function graphGet<T = any>(path: string, params?: Record<string, string>): Promise<{
  ok: boolean;
  data?: T;
  message?: string;
}> {
  const config = await getMetaBusinessConfig();
  if (!config) return { ok: false, message: "Meta Business is not configured" };

  const url = new URL(`${GRAPH_API_BASE}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", config.accessToken);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
  }

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.error) {
      return { ok: false, message: json.error.message || `Graph API error (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out"
        : e instanceof Error ? e.message : "Request failed",
    };
  }
}

/**
 * Get the current user's info (name, ID) — verifies the token works.
 * GET /me
 */
export async function getMetaUserInfo() {
  return graphGet("me", { fields: "id,name,email" });
}

/**
 * List all ad accounts the user has access to.
 * GET /me/adaccounts
 */
export async function getMetaAdAccounts() {
  return graphGet("me/adaccounts", {
    fields: "id,name,account_id,account_status,currency,timezone_name,amount_spent,balance,spend_cap",
    limit: "50",
  });
}

/**
 * List campaigns for a specific ad account.
 * GET /{ad_account_id}/campaigns
 */
export async function getMetaCampaigns(adAccountId: string) {
  return graphGet(`${adAccountId}/campaigns`, {
    fields: "id,name,status,objective,budget_remaining,daily_budget,lifetime_budget,buying_type,created_time,start_time,stop_time",
    limit: "50",
  });
}

/**
 * Get campaign insights (performance metrics) for a date range.
 * GET /{ad_account_id}/insights
 */
export async function getMetaInsights(adAccountId: string, opts?: {
  level?: "account" | "campaign" | "adset" | "ad";
  datePreset?: string; // "last_7d", "last_30d", "maximum", etc.
  timeRange?: { since: string; until: string }; // YYYY-MM-DD
}) {
  const config = await getMetaBusinessConfig();
  if (!config) return { ok: false, message: "Not configured" };

  const url = new URL(`${GRAPH_API_BASE}/${adAccountId}/insights`);
  url.searchParams.set("access_token", config.accessToken);
  url.searchParams.set("level", opts?.level || "campaign");
  url.searchParams.set("fields", "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,purchase_roas,conversions,conversion_values,cost_per_action_type");

  if (opts?.timeRange) {
    url.searchParams.set("time_range", JSON.stringify(opts.timeRange));
  } else {
    url.searchParams.set("date_preset", opts?.datePreset || "last_7d");
  }

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.error) {
      return { ok: false, message: json.error.message };
    }
    return { ok: true, data: json };
  } catch (e: any) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Verify the token is valid and get its expiry info.
 * GET /debug_token
 */
export async function verifyMetaToken() {
  const config = await getMetaBusinessConfig();
  if (!config) return { ok: false, message: "Not configured" };

  try {
    const res = await fetch(
      `${GRAPH_API_BASE}/debug_token?input_token=${config.accessToken}&access_token=${config.accessToken}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    const json: any = await res.json().catch(() => ({}));
    if (json?.error) return { ok: false, message: json.error.message };
    return { ok: true, data: json?.data };
  } catch (e: any) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed" };
  }
}
