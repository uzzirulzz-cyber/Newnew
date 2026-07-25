import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getTikTokSettings, saveTikTokSettings, clearTikTokSettings } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/settings
 *   → { configured, advertiserId, pixelCode, autoPostbackEvents, testEventCode }
 *   (Never returns the access token.)
 *
 * POST /api/v1/tiktok/settings
 *   Body: { accessToken, advertiserId, pixelCode, webhookSecret?, autoPostbackEvents?, testEventCode? }
 *
 * DELETE /api/v1/tiktok/settings
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  const s = await getTikTokSettings();
  if (!s) return ok({ configured: false });
  return ok({
    configured: true,
    advertiserId: s.advertiserId,
    pixelCode: s.pixelCode,
    autoPostbackEvents: s.autoPostbackEvents,
    testEventCode: s.testEventCode,
    updatedAt: s.updatedAt,
  });
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const accessToken = String(body?.accessToken ?? "").trim();
  const advertiserId = String(body?.advertiserId ?? "").trim();
  const pixelCode = String(body?.pixelCode ?? "").trim();
  if (!accessToken) return error("accessToken is required", 422);
  if (!advertiserId) return error("advertiserId is required", 422);
  try {
    const saved = await saveTikTokSettings({
      accessToken,
      advertiserId,
      pixelCode,
      webhookSecret: body?.webhookSecret ? String(body.webhookSecret) : undefined,
      autoPostbackEvents: Array.isArray(body?.autoPostbackEvents) ? body.autoPostbackEvents : undefined,
      testEventCode: body?.testEventCode ? String(body.testEventCode) : undefined,
    });
    return ok({
      configured: true,
      advertiserId: saved.advertiserId,
      pixelCode: saved.pixelCode,
      autoPostbackEvents: saved.autoPostbackEvents,
      message: "TikTok settings saved",
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed to save settings", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  await clearTikTokSettings();
  return ok({ configured: false, message: "TikTok settings cleared" });
}
