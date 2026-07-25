import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import {
  getTikTokLoginKitConfig,
  saveTikTokLoginKitConfig,
  clearTikTokLoginKitConfig,
  getTikTokLoginKitToken,
} from "@/lib/tiktok-loginkit";

export const dynamic = "force-dynamic";

const DEFAULT_SCOPES = [
  "user.info.basic",
  "user.info.profile",
  "user.info.stats",
  "video.list",
];

/**
 * GET /api/v1/tiktok/loginkit/config
 *   → { configured, clientKey, redirectUri, scopes, connected, token? }
 *
 * POST /api/v1/tiktok/loginkit/config
 *   Body: { clientKey, clientSecret, redirectUri?, scopes? }
 *
 * DELETE /api/v1/tiktok/loginkit/config
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const config = await getTikTokLoginKitConfig();
  const token = await getTikTokLoginKitToken();

  if (!config) return ok({ configured: false, connected: false });
  return ok({
    configured: true,
    connected: Boolean(token),
    clientKey: config.clientKey,
    redirectUri: config.redirectUri,
    scopes: config.scopes,
    token: token ? {
      openId: token.openId,
      scope: token.scope,
      expiresAt: token.expiresAt,
      refreshExpiresAt: token.refreshExpiresAt,
    } : null,
  });
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const clientKey = String(body?.clientKey ?? "").trim();
  const clientSecret = String(body?.clientSecret ?? "").trim();
  const redirectUri = body?.redirectUri
    ? String(body.redirectUri)
    : undefined;
  const scopes = Array.isArray(body?.scopes) && body.scopes.length > 0
    ? body.scopes.map(String)
    : DEFAULT_SCOPES;

  if (!clientKey) return error("Client Key is required", 422);
  if (!clientSecret) return error("Client Secret is required", 422);

  try {
    await saveTikTokLoginKitConfig({
      clientKey,
      clientSecret,
      redirectUri: redirectUri || `${getBaseUrl()}/api/v1/tiktok/loginkit/callback`,
      scopes,
    });
    return ok({
      configured: true,
      clientKey,
      redirectUri: redirectUri || `${getBaseUrl()}/api/v1/tiktok/loginkit/callback`,
      scopes,
      message: "Login Kit config saved — click 'Login with TikTok' to authorize",
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed to save config", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  await clearTikTokLoginKitConfig();
  return ok({ configured: false, message: "Login Kit config + token cleared" });
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://playbeat.digital";
}
