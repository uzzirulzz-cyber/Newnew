/**
 * TikTok OAuth 2.0 flow for the Marketing API.
 *
 * Implements the "TikTok account holder redirect URL configuration" flow
 * documented at:
 *   https://business-api.tiktok.com/portal/docs/tiktok-account-holder-redirect-url-configuration/v1.3
 *
 * Flow:
 *   1. Admin clicks "Connect with TikTok" → we redirect to TikTok's authorize URL.
 *   2. User logs in + authorizes on TikTok → TikTok redirects back to our
 *      callback URL with an auth_code.
 *   3. We exchange the auth_code for an access_token + advertiser ID.
 *   4. The token is stored in the `tiktok` Settings row and used for all
 *      subsequent API calls (lead sync, postbacks, MCP console, etc.).
 *
 * Required credentials (stored in the `tiktok_oauth` Settings row):
 *   appId       — TikTok developer app ID
 *   appSecret   — TikTok developer app secret
 *   redirectUri — must match the "Redirect URL" configured in the TikTok
 *                 developer portal. Defaults to https://playbeat.digital/api/v1/tiktok/callback
 */

import { db } from "@/lib/db";
import { saveTikTokSettings } from "./tiktok";

const AUTHORIZE_URL = "https://business-api.tiktok.com/portal/auth";
const TOKEN_URL = "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/";
const REFRESH_URL = "https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/";

export interface TikTokOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface TikTokTokenInfo {
  accessToken: string;
  advertiserId: string;
  expiresAt: string; // ISO date
  refreshToken?: string;
}

const OAUTH_SETTING_KEY = "tiktok_oauth";

/** Load the OAuth app config from the DB; fall back to env vars. */
export async function getTikTokOAuthConfig(): Promise<TikTokOAuthConfig | null> {
  try {
    const setting = await db.settings.findUnique({ where: { key: OAUTH_SETTING_KEY } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (parsed?.appId && parsed?.appSecret) {
        return {
          appId: String(parsed.appId),
          appSecret: String(parsed.appSecret),
          redirectUri: parsed.redirectUri || `${getBaseUrl()}/api/v1/tiktok/callback`,
        };
      }
    }
  } catch {
    // fall through
  }
  const envAppId = process.env.TIKTOK_APP_ID;
  const envSecret = process.env.TIKTOK_APP_SECRET;
  if (envAppId && envSecret) {
    return {
      appId: envAppId,
      appSecret: envSecret,
      redirectUri: process.env.TIKTOK_REDIRECT_URI || `${getBaseUrl()}/api/v1/tiktok/callback`,
    };
  }
  return null;
}

/** Save the OAuth app config (appId, secret, redirectUri) to the DB. */
export async function saveTikTokOAuthConfig(config: TikTokOAuthConfig): Promise<void> {
  const value = JSON.stringify({ ...config, updatedAt: new Date().toISOString() });
  const existing = await db.settings.findUnique({ where: { key: OAUTH_SETTING_KEY } });
  if (existing) {
    await db.settings.update({ where: { key: OAUTH_SETTING_KEY }, data: { value } });
  } else {
    await db.settings.create({ data: { key: OAUTH_SETTING_KEY, value } });
  }
}

/** Clear the OAuth app config. */
export async function clearTikTokOAuthConfig(): Promise<void> {
  try {
    const existing = await db.settings.findUnique({ where: { key: OAUTH_SETTING_KEY } });
    if (existing) await db.settings.delete({ where: { key: OAUTH_SETTING_KEY } });
  } catch {
    // best-effort
  }
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://playbeat.digital";
}

/**
 * Build the TikTok OAuth authorize URL. The admin is redirected here when
 * they click "Connect with TikTok". After login + approval, TikTok redirects
 * back to redirectUri with ?auth_code=...
 *
 * Scopes: we request the full Marketing API scope set so the resulting token
 * can be used for campaigns, reports, audiences, pixels, lead gen, and events.
 */
export async function getTikTokAuthorizeUrl(state?: string): Promise<{
  url: string;
  state: string;
} | null> {
  const config = await getTikTokOAuthConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    app_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    state: state || Math.random().toString(36).slice(2),
  });

  return {
    url: `${AUTHORIZE_URL}?${params.toString()}`,
    state: params.get("state")!,
  };
}

/**
 * Exchange the auth_code (received at the callback) for an access token.
 * TikTok returns { access_token, advertiser_id, expires_in, refresh_token }.
 *
 * Stores the token in the `tiktok` Settings row so it's immediately usable
 * by all the other TikTok functions (lead sync, postback, MCP console).
 */
export async function exchangeTikTokAuthCode(authCode: string): Promise<{
  ok: boolean;
  message: string;
  tokenInfo?: TikTokTokenInfo;
}> {
  const config = await getTikTokOAuthConfig();
  if (!config) {
    return { ok: false, message: "TikTok OAuth app config not set — enter App ID + Secret first" };
  }

  try {
    const body = new URLSearchParams({
      app_id: config.appId,
      secret: config.appSecret,
      auth_code: authCode,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(20_000),
    });
    const json: any = await res.json().catch(() => ({}));

    if (json?.code !== 0 && json?.message !== "OK") {
      return { ok: false, message: json?.message || `Token exchange failed (HTTP ${res.status})` };
    }

    const data = json?.data || {};
    const accessToken = String(data.access_token || "");
    const advertiserId = Array.isArray(data.advertiser_ids) && data.advertiser_ids[0]
      ? String(data.advertiser_ids[0].advertiser_id || data.advertiser_ids[0])
      : String(data.advertiser_id || "");
    const expiresIn = Number(data.expires_in) || 86400; // seconds
    const refreshToken = data.refresh_token ? String(data.refresh_token) : undefined;

    if (!accessToken) {
      return { ok: false, message: "No access_token in TikTok response" };
    }

    const tokenInfo: TikTokTokenInfo = {
      accessToken,
      advertiserId,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      refreshToken,
    };

    // Persist to the shared tiktok Settings row so all TikTok functions work.
    await saveTikTokSettings({
      accessToken,
      advertiserId,
      // pixelCode is preserved if already set (saveTikTokSettings merges)
    });

    return { ok: true, message: "TikTok connected successfully", tokenInfo };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out contacting TikTok"
        : e instanceof Error ? e.message : "Token exchange failed",
    };
  }
}

/**
 * Refresh an expired access token using the refresh_token. Called
 * automatically when the token is within 1 hour of expiry.
 */
export async function refreshTikTokAccessToken(): Promise<{
  ok: boolean;
  message: string;
}> {
  const config = await getTikTokOAuthConfig();
  if (!config) return { ok: false, message: "OAuth config not set" };

  // We need the refresh token from the oauth settings row.
  try {
    const setting = await db.settings.findUnique({ where: { key: OAUTH_SETTING_KEY } });
    const refreshToken = setting?.value ? JSON.parse(setting.value)?.refreshToken : null;
    if (!refreshToken) return { ok: false, message: "No refresh token stored" };

    const body = new URLSearchParams({
      app_id: config.appId,
      secret: config.appSecret,
      refresh_token: refreshToken,
    });

    const res = await fetch(REFRESH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(20_000),
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.code !== 0) {
      return { ok: false, message: json?.message || "Refresh failed" };
    }

    const data = json?.data || {};
    await saveTikTokSettings({
      accessToken: String(data.access_token || ""),
    });
    return { ok: true, message: "Token refreshed" };
  } catch (e: any) {
    return { ok: false, message: e instanceof Error ? e.message : "Refresh failed" };
  }
}
