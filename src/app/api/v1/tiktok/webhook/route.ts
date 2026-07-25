import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTikTokLeadWebhook, getTikTokSettings } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/tiktok/webhook
 *
 * Receives real-time lead data from TikTok's Lead Generation webhook.
 * TikTok sends a POST when a user submits a Lead Gen form. We parse the
 * payload, store the lead, and (optionally) auto-fire a "Lead" postback.
 *
 * The webhook URL is configured in TikTok Events Manager → Webhooks.
 * If a webhookSecret is set, TikTok includes it as a header or query param
 * for verification.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    // Optional secret verification
    const settings = await getTikTokSettings();
    if (settings?.webhookSecret) {
      const provided =
        request.headers.get("x-tiktok-secret") ||
        new URL(request.url).searchParams.get("secret") ||
        "";
      if (provided !== settings.webhookSecret) {
        return NextResponse.json({ success: false, error: "Invalid secret" }, { status: 401 });
      }
    }

    // Parse the lead from the webhook payload.
    const parsed = parseTikTokLeadWebhook(body);
    if (!parsed) {
      // Not a recognizable lead payload — acknowledge so TikTok doesn't retry.
      return NextResponse.json({ success: true, message: "No lead data found in payload" });
    }

    // Upsert: if the lead_id already exists, skip (TikTok may retry webhooks).
    const existing = await db.tikTokLead.findUnique({ where: { leadId: parsed.leadId } });
    if (existing) {
      return NextResponse.json({ success: true, message: "Lead already exists", leadId: parsed.leadId });
    }

    const lead = await db.tikTokLead.create({
      data: {
        leadId: parsed.leadId,
        advertiserId: parsed.advertiserId || null,
        campaignId: parsed.campaignId || null,
        adgroupId: parsed.adgroupId || null,
        adId: parsed.adId || null,
        formId: parsed.formId || null,
        customerName: parsed.customerName || null,
        customerEmail: parsed.customerEmail || null,
        customerPhone: parsed.customerPhone || null,
        extraFields: JSON.stringify(parsed.extraFields),
        rawPayload: JSON.stringify(parsed.rawPayload),
        status: "new",
        postbackSent: false,
      },
    });

    return NextResponse.json({
      success: true,
      leadId: lead.leadId,
      message: "Lead received",
    });
  } catch (e) {
    console.error("[tiktok/webhook] error:", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Webhook failed" },
      { status: 500 },
    );
  }
}

/** TikTok may verify the webhook endpoint with a GET challenge. */
export async function GET(request: NextRequest) {
  const challenge = new URL(request.url).searchParams.get("challenge");
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  return NextResponse.json({ success: true, message: "TikTok webhook endpoint is live" });
}
