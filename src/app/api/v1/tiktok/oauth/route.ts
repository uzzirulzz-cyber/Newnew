import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import {
  getTikTokOAuthConfig,
  saveTikTokOAuthConfig,
  clearTikTokOAuthConfig,
  getTikTokAuthorizeUrl,
} from "@/lib/tiktok-oauth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/oauth
 *   → { configured, appId, redirectUri, authorizeUrl? }
 *
 * POST /api/v1/tiktok/oauth
 *   Body: { appId, appSecret, redirectUri? }
 *   Saves the OAuth app config and returns the authorize URL.
 *
 * DELETE /api/v1/tiktok/oauth
 *   Clears the OAuth app config.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const config = await getTikTokOAuthConfig();
  if (!config) return ok({ configured: false });

  const authorizeUrl = await getTikTokAuthorizeUrl();
  return ok({
    configured: true,
    appId: config.appId,
    redirectUri: config.redirectUri,
    authorizeUrl: authorizeUrl?.url,
  });
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const appId = String(body?.appId ?? "").trim();
  const appSecret = String(body?.appSecret ?? "").trim();
  const redirectUri = body?.redirectUri
    ? String(body.redirectUri)
    : undefined;

  if (!appId) return error("App ID is required", 422);
  if (!appSecret) return error("App Secret is required", 422);

  try {
    await saveTikTokOAuthConfig({
      appId,
      appSecret,
      redirectUri: redirectUri || `${getBaseUrl()}/api/v1/tiktok/callback`,
    });

    const authorizeUrl = await getTikTokAuthorizeUrl();
    return ok({
      configured: true,
      appId,
      redirectUri: redirectUri || `${getBaseUrl()}/api/v1/tiktok/callback`,
      authorizeUrl: authorizeUrl?.url,
      message: "OAuth config saved — click 'Connect with TikTok' to authorize",
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed to save OAuth config", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  await clearTikTokOAuthConfig();
  return ok({ configured: false, message: "OAuth config cleared" });
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://playbeat.digital";
}
