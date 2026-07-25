import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getTikTokLoginKitAuthorizeUrl } from "@/lib/tiktok-loginkit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/loginkit/connect
 *
 * Returns the TikTok Login Kit authorize URL. The admin clicks this to start
 * "Login with TikTok" — they're redirected to TikTok's login page, authorize
 * the requested scopes, and TikTok redirects back to /api/v1/tiktok/loginkit/callback
 * with a code which we exchange for an access_token.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;

  const result = await getTikTokLoginKitAuthorizeUrl();
  if (!result) {
    return error(
      "TikTok Login Kit not configured. Enter your Client Key and Client Secret first (from developers.tiktok.com).",
      422,
    );
  }

  return ok({ authorizeUrl: result.url, state: result.state });
}
