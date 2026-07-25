import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getTikTokAuthorizeUrl } from "@/lib/tiktok-oauth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/connect
 *
 * Returns the TikTok OAuth authorize URL. The admin clicks this to start
 * the "Connect with TikTok" flow — they're redirected to TikTok's login
 * page, authorize the app, and TikTok redirects back to /api/v1/tiktok/callback
 * with an auth_code which we exchange for an access token.
 *
 * If the OAuth app config isn't set yet, returns 422 with instructions.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;

  const result = await getTikTokAuthorizeUrl();
  if (!result) {
    return error(
      "TikTok OAuth app not configured. Enter your App ID and App Secret first (from TikTok For Business → My Apps).",
      422,
    );
  }

  return ok({ authorizeUrl: result.url, state: result.state });
}
