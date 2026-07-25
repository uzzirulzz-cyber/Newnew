/**
 * TikTok Login Kit OAuth — "Login with TikTok" for user content APIs.
 *
 * Implements the OAuth User Access Token Management flow documented at:
 *   https://developers.tiktok.com/doc/oauth-user-access-token-management
 *
 * This is SEPARATE from the Marketing API OAuth (tiktok-oauth.ts). The Login
 * Kit uses different endpoints and credentials:
 *
 *   Login Kit (this file):
 *     Authorize:  https://www.tiktok.com/v2/auth/authorize/
 *     Token:      POST https://open.tiktokapis.com/v2/oauth/token/
 *     User info:  GET  https://open.tiktokapis.com/v2/user/info/
 *     Credentials: client_key + client_secret (from developers.tiktok.com)
 *     Returns:     access_token (24h), refresh_token (365d), open_id, scope
 *
 *   Marketing API (tiktok-oauth.ts):
 *     Authorize:  https://business-api.tiktok.com/portal/auth
 *     Token:      POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/
 *     Credentials: app_id + app_secret (from ads.tiktok.com)
 *     Returns:     access_token, advertiser_ids
 *
 * Scopes available (Login Kit):
 *   user.info.basic, user.info.profile, user.info.stats, video.list,
 *   video.publish, video.upload, comment.list, etc.
 */

import { db } from "@/lib/db";

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";

export interface TikTokLoginKitConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[]; // e.g. ["user.info.basic", "video.list"]
}

export interface TikTokLoginKitToken {
  accessToken: string;
  refreshToken: string;
  openId: string;
  scope: string;
  expiresAt: string;     // ISO date — access_token valid 24h
  refreshExpiresAt: string; // ISO date — refresh_token valid 365d
  tokenType: string;     // "Bearer"
}

const SETTING_KEY = "tiktok_loginkit";

/** Default scopes — user info + video list (most common for a storefront). */
const DEFAULT_SCOPES = [
  "user.info.basic",
  "user.info.profile",
  "user.info.stats",
  "video.list",
];

/** Load the Login Kit config from the DB; fall back to env vars. */
export async function getTikTokLoginKitConfig(): Promise<TikTokLoginKitConfig | null> {
  try {
    const setting = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (parsed?.clientKey && parsed?.clientSecret) {
        return {
          clientKey: String(parsed.clientKey),
          clientSecret: String(parsed.clientSecret),
          redirectUri: parsed.redirectUri || `${getBaseUrl()}/api/v1/tiktok/loginkit/callback`,
          scopes: Array.isArray(parsed.scopes) && parsed.scopes.length > 0
            ? parsed.scopes
            : DEFAULT_SCOPES,
        };
      }
    }
  } catch {
    // fall through
  }
  const envKey = process.env.TIKTOK_LOGINKIT_CLIENT_KEY;
  const envSecret = process.env.TIKTOK_LOGINKIT_CLIENT_SECRET;
  if (envKey && envSecret) {
    return {
      clientKey: envKey,
      clientSecret: envSecret,
      redirectUri: process.env.TIKTOK_LOGINKIT_REDIRECT_URI || `${getBaseUrl()}/api/v1/tiktok/loginkit/callback`,
      scopes: DEFAULT_SCOPES,
    };
  }
  return null;
}

/** Save the Login Kit config to the DB. */
export async function saveTikTokLoginKitConfig(config: TikTokLoginKitConfig): Promise<void> {
  const value = JSON.stringify({ ...config, updatedAt: new Date().toISOString() });
  const existing = await db.settings.findUnique({ where: { key: SETTING_KEY } });
  if (existing) {
    await db.settings.update({ where: { key: SETTING_KEY }, data: { value } });
  } else {
    await db.settings.create({ data: { key: SETTING_KEY, value } });
  }
}

/** Clear the Login Kit config + token. */
export async function clearTikTokLoginKitConfig(): Promise<void> {
  try {
    const existing = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (existing) await db.settings.delete({ where: { key: SETTING_KEY } });
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
 * Build the TikTok Login Kit authorize URL.
 *
 *   https://www.tiktok.com/v2/auth/authorize/?client_key=...&scope=...&response_type=code&redirect_uri=...&state=...
 *
 * The user is redirected here → logs in with TikTok → authorizes the scopes
 * → TikTok redirects back to redirectUri with ?code=...&state=...
 */
export async function getTikTokLoginKitAuthorizeUrl(state?: string): Promise<{
  url: string;
  state: string;
} | null> {
  const config = await getTikTokLoginKitConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    client_key: config.clientKey,
    scope: config.scopes.join(","),
    response_type: "code",
    redirect_uri: config.redirectUri,
    state: state || Math.random().toString(36).slice(2),
  });

  return {
    url: `${AUTHORIZE_URL}?${params.toString()}`,
    state: params.get("state")!,
  };
}

/**
 * Exchange the authorization code for an access token.
 *
 * POST https://open.tiktokapis.com/v2/oauth/token/
 * Body: client_key, client_secret, code, grant_type=authorization_code, redirect_uri
 *
 * Returns: access_token, refresh_token, open_id, scope, expires_in (24h),
 *          refresh_expires_in (365d), token_type
 */
export async function exchangeTikTokLoginKitCode(code: string): Promise<{
  ok: boolean;
  message: string;
  token?: TikTokLoginKitToken;
}> {
  const config = await getTikTokLoginKitConfig();
  if (!config) {
    return { ok: false, message: "Login Kit config not set — enter Client Key + Secret first" };
  }

  try {
    const body = new URLSearchParams({
      client_key: config.clientKey,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(20_000),
    });
    const json: any = await res.json().catch(() => ({}));

    if (json?.error) {
      return {
        ok: false,
        message: json.error_description || json.error || `Token exchange failed (HTTP ${res.status})`,
      };
    }

    const accessToken = String(json?.access_token || "");
    if (!accessToken) {
      return { ok: false, message: "No access_token in TikTok response" };
    }

    const expiresIn = Number(json?.expires_in) || 86400; // 24h
    const refreshExpiresIn = Number(json?.refresh_expires_in) || 31536000; // 365d

    const token: TikTokLoginKitToken = {
      accessToken,
      refreshToken: String(json?.refresh_token || ""),
      openId: String(json?.open_id || ""),
      scope: String(json?.scope || ""),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      refreshExpiresAt: new Date(Date.now() + refreshExpiresIn * 1000).toISOString(),
      tokenType: String(json?.token_type || "Bearer"),
    };

    // Persist the token alongside the config.
    const existing = await getTikTokLoginKitConfig();
    if (existing) {
      await saveTikTokLoginKitConfig({ ...existing });
    }
    // Store the token in a separate key for easy retrieval.
    const tokenValue = JSON.stringify({ ...token, storedAt: new Date().toISOString() });
    const tokenRow = await db.settings.findUnique({ where: { key: `${SETTING_KEY}_token` } });
    if (tokenRow) {
      await db.settings.update({ where: { key: `${SETTING_KEY}_token` }, data: { value: tokenValue } });
    } else {
      await db.settings.create({ data: { key: `${SETTING_KEY}_token`, value: tokenValue } });
    }

    return { ok: true, message: "TikTok Login Kit connected successfully", token };
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
 * Refresh an expired access token using the refresh_token.
 *
 * POST https://open.tiktokapis.com/v2/oauth/token/
 * Body: client_key, client_secret, grant_type=refresh_token, refresh_token
 */
export async function refreshTikTokLoginKitToken(): Promise<{
  ok: boolean;
  message: string;
}> {
  const config = await getTikTokLoginKitConfig();
  if (!config) return { ok: false, message: "Config not set" };

  try {
    const tokenRow = await db.settings.findUnique({ where: { key: `${SETTING_KEY}_token` } });
    const stored = tokenRow?.value ? JSON.parse(tokenRow.value) : null;
    if (!stored?.refreshToken) return { ok: false, message: "No refresh token stored" };

    const body = new URLSearchParams({
      client_key: config.clientKey,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: stored.refreshToken,
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
      body: body.toString(),
      signal: AbortSignal.timeout(20_000),
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.error) {
      return { ok: false, message: json.error_description || json.error };
    }

    const newToken: TikTokLoginKitToken = {
      accessToken: String(json?.access_token || ""),
      refreshToken: String(json?.refresh_token || stored.refreshToken),
      openId: String(json?.open_id || stored.openId),
      scope: String(json?.scope || stored.scope),
      expiresAt: new Date(Date.now() + (Number(json?.expires_in) || 86400) * 1000).toISOString(),
      refreshExpiresAt: new Date(Date.now() + (Number(json?.refresh_expires_in) || 31536000) * 1000).toISOString(),
      tokenType: String(json?.token_type || "Bearer"),
    };
    const tokenValue = JSON.stringify({ ...newToken, storedAt: new Date().toISOString() });
    await db.settings.update({
      where: { key: `${SETTING_KEY}_token` },
      data: { value: tokenValue },
    });
    return { ok: true, message: "Token refreshed" };
  } catch (e: any) {
    return { ok: false, message: e instanceof Error ? e.message : "Refresh failed" };
  }
}

/** Get the stored Login Kit token (if any). */
export async function getTikTokLoginKitToken(): Promise<TikTokLoginKitToken | null> {
  try {
    const tokenRow = await db.settings.findUnique({ where: { key: `${SETTING_KEY}_token` } });
    if (tokenRow?.value) {
      return JSON.parse(tokenRow.value);
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Fetch the authenticated user's profile info.
 *
 * GET https://open.tiktokapis.com/v2/user/info/
 * Authorization: Bearer {access_token}
 * Fields: open_id, union_id, avatar_url, display_name, bio, profile_deep_link,
 *         username, email, follower_count, following_count, likes_count
 */
export async function getTikTokUserInfo(): Promise<{
  ok: boolean;
  message?: string;
  user?: any;
}> {
  const token = await getTikTokLoginKitToken();
  if (!token) return { ok: false, message: "Not connected — authorize first" };

  try {
    const fields = [
      "open_id", "union_id", "avatar_url", "display_name", "bio",
      "profile_deep_link", "username", "email",
      "follower_count", "following_count", "likes_count",
    ].join(",");
    const res = await fetch(`${USER_INFO_URL}?fields=${encodeURIComponent(fields)}`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      signal: AbortSignal.timeout(15_000),
    });
    const json: any = await res.json().catch(() => ({}));
    if (json?.error) {
      return { ok: false, message: json.error_description || json.error };
    }
    return { ok: true, user: json?.data?.user || json?.data };
  } catch (e: any) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed to fetch user info" };
  }
}
