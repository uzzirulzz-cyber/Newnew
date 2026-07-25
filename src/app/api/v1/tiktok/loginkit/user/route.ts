import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getTikTokUserInfo, getTikTokLoginKitToken } from "@/lib/tiktok-loginkit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/loginkit/user
 *
 * Returns the authenticated TikTok user's profile info (display name, username,
 * avatar, follower/following/likes counts, email if available).
 *
 * Uses the stored Login Kit access token. If the token is expired, returns
 * a 401 so the client can trigger a refresh or re-auth.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const token = await getTikTokLoginKitToken();
  if (!token) {
    return error("Not connected — authorize with TikTok Login Kit first", 401);
  }

  // Check if the access token is expired.
  const now = Date.now();
  const expiresAt = new Date(token.expiresAt).getTime();
  if (expiresAt <= now) {
    return error("Access token expired — refresh or re-authorize", 401);
  }

  const result = await getTikTokUserInfo();
  if (result.ok) return ok({ user: result.user, openId: token.openId });
  return error(result.message || "Failed to fetch user info", 502);
}
