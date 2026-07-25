import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { sendTikTokPostback, getTikTokSettings } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/tiktok/postback
 *
 * Manually send a postback event to TikTok (for testing or ad-hoc sends).
 *
 * Body: {
 *   type: "Lead" | "CompleteRegistration" | "Purchase" | "Subscribe" | ...,
 *   email?, phone?, value?, currency?, orderId?, contentId?
 * }
 *
 * Returns { ok, message, response? }.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const type = String(body?.type ?? "").trim();
  if (!type) return error("type is required (e.g. Lead, Purchase)", 422);

  if (!(await getTikTokSettings())) {
    return error("TikTok is not configured — set access token + advertiser ID first", 401);
  }

  const result = await sendTikTokPostback({
    type,
    email: body?.email ? String(body.email) : undefined,
    phone: body?.phone ? String(body.phone) : undefined,
    value: body?.value != null ? Number(body.value) : undefined,
    currency: body?.currency ? String(body.currency) : undefined,
    orderId: body?.orderId ? String(body.orderId) : undefined,
    contentId: body?.contentId ? String(body.contentId) : undefined,
  });

  if (result.ok) return ok(result);
  return error(result.message, 502);
}
