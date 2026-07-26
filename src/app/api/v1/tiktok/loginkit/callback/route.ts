import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokLoginKitCode } from "@/lib/tiktok-loginkit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/loginkit/callback
 *
 * Login Kit OAuth callback — TikTok redirects here after the user authorizes.
 * URL contains ?code=...&state=... (or ?error=... if denied).
 *
 * We exchange the code for an access_token + refresh_token + open_id, store
 * them, then redirect the admin back to the TikTok admin module.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error") || searchParams.get("error_description");

  const adminUrl = "/wp-admin?tiktok=tiktok";

  if (error) {
    return NextResponse.redirect(
      new URL(`${adminUrl}&tiktok_loginkit_error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`${adminUrl}&tiktok_loginkit_error=${encodeURIComponent("No authorization code received")}`, request.url),
    );
  }

  const result = await exchangeTikTokLoginKitCode(code);

  if (result.ok) {
    return NextResponse.redirect(
      new URL(`${adminUrl}&tiktok_loginkit_success=${encodeURIComponent(result.message)}`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(`${adminUrl}&tiktok_loginkit_error=${encodeURIComponent(result.message)}`, request.url),
  );
}
