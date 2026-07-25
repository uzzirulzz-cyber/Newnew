import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokAuthCode } from "@/lib/tiktok-oauth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/callback
 *
 * OAuth callback — TikTok redirects here after the user authorizes the app.
 * The URL contains ?auth_code=... (and state=...).
 *
 * We exchange the auth_code for an access_token, store it, then redirect
 * the admin back to the TikTok admin module with a success/error message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authCode = searchParams.get("auth_code") || searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error") || searchParams.get("error_description");

  const adminUrl = "/wp-admin?tiktok=tiktok";

  // TikTok reported an error (e.g. user denied access)
  if (error) {
    return NextResponse.redirect(
      new URL(`${adminUrl}&tiktok_error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!authCode) {
    return NextResponse.redirect(
      new URL(`${adminUrl}&tiktok_error=${encodeURIComponent("No auth_code received from TikTok")}`, request.url),
    );
  }

  const result = await exchangeTikTokAuthCode(authCode);

  if (result.ok) {
    return NextResponse.redirect(
      new URL(`${adminUrl}&tiktok_success=${encodeURIComponent(result.message)}`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(`${adminUrl}&tiktok_error=${encodeURIComponent(result.message)}`, request.url),
  );
}
