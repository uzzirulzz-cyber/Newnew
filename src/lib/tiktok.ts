/**
 * TikTok Lead Generation + Conversion API integration.
 *
 * Two flows:
 *  1. Leads IN  — TikTok sends lead data via webhook (real-time) when a user
 *     submits a Lead Generation form. We store it in the TikTokLead collection.
 *     Alternatively, the admin can poll the Lead Generation API.
 *  2. Postback OUT — When a lead converts (places an order / payment confirmed)
 *     we send a Server-to-Server (S2S) event to the TikTok Events API so
 *     TikTok can optimize ad delivery.
 *
 * Credentials are stored in the `tiktok` Settings row (JSON) so the admin can
 * set them from the UI without redeploying. Falls back to env vars.
 *
 * Required credentials (from TikTok For Business → Developer Settings):
 *   accessToken  — long-term access token from TikTok OAuth
 *   advertiserId — the advertiser account ID
 *   pixelCode    — the TikTok Pixel code (for S2S events)
 *   webhookSecret — optional secret for verifying webhook signatures
 *
 * Docs:
 *   Lead Gen:  https://ads.tiktok.com/marketing_api/docs?id=1771105753792513
 *   Events API: https://ads.tiktok.com/marketing_api/docs?id=1771101107512321
 */

import { db } from "@/lib/db";

const TIKTOK_EVENTS_API = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
const TIKTOK_LEAD_API = "https://business-api.tiktok.com/open_api/v1.3/lead/";

export interface TikTokSettings {
  accessToken: string;
  advertiserId: string;
  pixelCode: string;
  webhookSecret?: string;
  // Which event types to auto-postback: Lead, CompleteRegistration, Purchase
  autoPostbackEvents: string[];
  testEventCode?: string;
  updatedAt?: string;
}

const SETTING_KEY = "tiktok";

/** Load TikTok settings from the DB; fall back to env vars. */
export async function getTikTokSettings(): Promise<TikTokSettings | null> {
  try {
    const setting = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (parsed?.accessToken && parsed?.advertiserId) {
          return {
            accessToken: String(parsed.accessToken),
            advertiserId: String(parsed.advertiserId),
            pixelCode: parsed.pixelCode ? String(parsed.pixelCode) : "",
            webhookSecret: parsed.webhookSecret ? String(parsed.webhookSecret) : undefined,
            autoPostbackEvents: Array.isArray(parsed.autoPostbackEvents)
              ? parsed.autoPostbackEvents
              : ["Lead", "CompleteRegistration", "Purchase"],
            testEventCode: parsed.testEventCode ? String(parsed.testEventCode) : undefined,
            updatedAt: parsed.updatedAt,
          };
        }
      } catch {
        // corrupt JSON — fall through
      }
    }
  } catch {
    // DB unavailable
  }
  // Env fallback
  const envToken = process.env.TIKTOK_ACCESS_TOKEN;
  const envAdv = process.env.TIKTOK_ADVERTISER_ID;
  if (envToken && envAdv) {
    return {
      accessToken: envToken,
      advertiserId: envAdv,
      pixelCode: process.env.TIKTOK_PIXEL_CODE || "",
      autoPostbackEvents: ["Lead", "CompleteRegistration", "Purchase"],
    };
  }
  return null;
}

export async function isTikTokConfigured(): Promise<boolean> {
  return Boolean(await getTikTokSettings());
}

/** Save TikTok settings to the DB (upserts the Settings row). */
export async function saveTikTokSettings(input: Partial<TikTokSettings>): Promise<TikTokSettings> {
  const existing = await getTikTokSettings();
  const merged: TikTokSettings = {
    accessToken: input.accessToken ?? existing?.accessToken ?? "",
    advertiserId: input.advertiserId ?? existing?.advertiserId ?? "",
    pixelCode: input.pixelCode ?? existing?.pixelCode ?? "",
    webhookSecret: input.webhookSecret ?? existing?.webhookSecret,
    autoPostbackEvents: input.autoPostbackEvents ?? existing?.autoPostbackEvents ?? ["Lead", "CompleteRegistration", "Purchase"],
    testEventCode: input.testEventCode ?? existing?.testEventCode,
    updatedAt: new Date().toISOString(),
  };
  const value = JSON.stringify(merged);
  const row = await db.settings.findUnique({ where: { key: SETTING_KEY } });
  if (row) {
    await db.settings.update({ where: { key: SETTING_KEY }, data: { value } });
  } else {
    await db.settings.create({ data: { key: SETTING_KEY, value } });
  }
  return merged;
}

/** Clear stored TikTok settings. */
export async function clearTikTokSettings(): Promise<void> {
  try {
    const row = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (row) await db.settings.delete({ where: { key: SETTING_KEY } });
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Leads IN — webhook payload parser
// ---------------------------------------------------------------------------

export interface ParsedTikTokLead {
  leadId: string;
  advertiserId?: string;
  campaignId?: string;
  adgroupId?: string;
  adId?: string;
  formId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  extraFields: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
}

/**
 * Parse a TikTok Lead Generation webhook payload into our normalized shape.
 * TikTok sends different payload structures depending on the form type; this
 * handles the common Instant Form + Smart Form shapes.
 */
export function parseTikTokLeadWebhook(payload: any): ParsedTikTokLead | null {
  try {
    // The webhook envelope: { event: "lead_generated", data: { ... } }
    const data = payload?.data ?? payload?.event_data ?? payload;
    const lead = data?.lead ?? data;
    const leadId = String(lead?.lead_id ?? lead?.leadId ?? payload?.lead_id ?? "");
    if (!leadId) return null;

    const fields = lead?.form_questions ?? lead?.custom_parameters ?? lead?.fields ?? {};
    const extraFields: Record<string, unknown> = {};
    if (fields && typeof fields === "object") {
      for (const [k, v] of Object.entries(fields)) {
        extraFields[k] = v;
      }
    }

    return {
      leadId,
      advertiserId: String(lead?.advertiser_id ?? data?.advertiser_id ?? "") || undefined,
      campaignId: String(lead?.campaign_id ?? data?.campaign_id ?? "") || undefined,
      adgroupId: String(lead?.adgroup_id ?? data?.adgroup_id ?? "") || undefined,
      adId: String(lead?.ad_id ?? data?.ad_id ?? "") || undefined,
      formId: String(lead?.form_id ?? data?.form_id ?? "") || undefined,
      customerName: extractField(fields, ["name", "full_name", "first_name", "customer_name"]) || undefined,
      customerEmail: extractField(fields, ["email", "email_address"]) || undefined,
      customerPhone: extractField(fields, ["phone", "phone_number", "mobile"]) || undefined,
      extraFields,
      rawPayload: payload,
    };
  } catch {
    return null;
  }
}

/** Try multiple possible field names to extract a value from a form fields object. */
function extractField(fields: any, keys: string[]): string | undefined {
  if (!fields || typeof fields !== "object") return undefined;
  for (const k of keys) {
    const v = fields[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    // TikTok sometimes nests as { key: "email", value: "x@y.com" }
    if (Array.isArray(fields)) {
      for (const item of fields) {
        if (item?.key === k || item?.name === k) {
          if (typeof item?.value === "string" && item.value.trim()) return item.value.trim();
        }
      }
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Postback OUT — Server-to-Server Events API
// ---------------------------------------------------------------------------

export interface PostbackEvent {
  type: string; // "Lead" | "CompleteRegistration" | "Purchase" | "Subscribe" | ...
  email?: string;
  phone?: string;
  value?: number; // order value
  currency?: string; // "PKR" | "USD"
  orderId?: string;
  contentId?: string; // product ID
  url?: string;
}

/**
 * Send a conversion event to TikTok via the Server-to-Server Events API.
 * Used for ad optimization — TikTok matches the email/phone to the user who
 * clicked the ad and attributes the conversion.
 *
 * Returns { ok, message, response? }.
 */
export async function sendTikTokPostback(event: PostbackEvent): Promise<{
  ok: boolean;
  message: string;
  response?: any;
}> {
  const settings = await getTikTokSettings();
  if (!settings) {
    return { ok: false, message: "TikTok is not configured — set access token + advertiser ID" };
  }
  if (!settings.pixelCode) {
    return { ok: false, message: "TikTok Pixel Code is not configured" };
  }

  // Check if this event type is enabled for auto-postback
  if (!settings.autoPostbackEvents.includes(event.type)) {
    return { ok: false, message: `Event type "${event.type}" is not in the auto-postback list` };
  }

  // Build the S2S event payload per TikTok's spec.
  const user = {};
  if (event.email) user["email"] = hashValue(event.email);
  if (event.phone) user["phone"] = hashValue(event.phone);

  const body = {
    pixel_code: settings.pixelCode,
    event: event.type,
    event_time: Math.floor(Date.now() / 1000),
    context: {
      ad: {
        callback: event.orderId || undefined,
      },
    },
    user: Object.keys(user).length > 0 ? user : undefined,
    properties: {
      content_id: event.contentId || undefined,
      value: event.value,
      currency: event.currency || "PKR",
      url: event.url || undefined,
    },
    // Test event code — events are validated but not counted when this is set.
    ...(settings.testEventCode ? { test_event_code: settings.testEventCode } : {}),
  };

  try {
    const res = await fetch(TIKTOK_EVENTS_API, {
      method: "POST",
      headers: {
        "Access-Token": settings.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const json: any = await res.json().catch(() => ({}));
    if (res.ok && (json?.code === 0 || json?.message === "OK")) {
      return { ok: true, message: `Postback "${event.type}" sent to TikTok`, response: json };
    }
    return {
      ok: false,
      message: `TikTok API error: ${json?.message || `HTTP ${res.status}`}`,
      response: json,
    };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out contacting TikTok"
        : e instanceof Error ? e.message : "Failed to send postback",
    };
  }
}

/**
 * SHA-256 hash a PII value (email, phone) before sending to TikTok.
 * TikTok accepts hashed or plain values; hashed is recommended for privacy.
 */
function hashValue(value: string): string {
  const normalized = value.trim().toLowerCase();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(normalized).digest("hex");
  } catch {
    return normalized;
  }
}

/**
 * Fetch leads from the TikTok Lead Generation API (polling fallback for when
 * webhooks aren't configured). Returns the raw lead list from TikTok.
 */
export async function fetchTikTokLeads(opts?: {
  formId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ ok: boolean; leads?: any[]; message?: string }> {
  const settings = await getTikTokSettings();
  if (!settings) {
    return { ok: false, message: "TikTok is not configured" };
  }
  try {
    const params = new URLSearchParams({
      advertiser_id: settings.advertiserId,
      page_size: "100",
    });
    if (opts?.formId) params.set("form_id", opts.formId);
    if (opts?.startDate) params.set("start_date", opts.startDate);
    if (opts?.endDate) params.set("end_date", opts.endDate);

    const res = await fetch(`${TIKTOK_LEAD_API}?${params}`, {
      headers: { "Access-Token": settings.accessToken },
      signal: AbortSignal.timeout(15_000),
    });
    const json: any = await res.json().catch(() => ({}));
    if (res.ok && json?.code === 0) {
      return { ok: true, leads: json?.data?.leads ?? [] };
    }
    return { ok: false, message: json?.message || `HTTP ${res.status}` };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out"
        : e instanceof Error ? e.message : "Failed to fetch leads",
    };
  }
}

/**
 * Auto-fire a postback for an order. Called when an order is placed or a
 * payment is confirmed. Looks up the lead by email, marks it as converted,
 * and sends the "Purchase" (or "CompleteRegistration") event to TikTok.
 *
 * This is the "send postback signals from your CRM back to TikTok" half.
 */
export async function autoPostbackForOrder(order: {
  id: string;
  customerEmail: string;
  total: number;
  currency?: string;
  status?: string;
  items?: Array<{ productId?: string }>;
}): Promise<{ ok: boolean; message: string }> {
  const settings = await getTikTokSettings();
  if (!settings) return { ok: false, message: "Not configured" };

  // Determine the event type based on order status.
  const eventType = order.status === "COMPLETED" ? "Purchase" : "CompleteRegistration";

  // Find the matching lead by email.
  if (order.customerEmail) {
    try {
      const lead = await db.tikTokLead.findFirst({
        where: { customerEmail: { equals: order.customerEmail, mode: "insensitive" } },
      });
      if (lead) {
        // Send the postback.
        const result = await sendTikTokPostback({
          type: eventType,
          email: order.customerEmail,
          phone: lead.customerPhone || undefined,
          value: order.total,
          currency: order.currency || "PKR",
          orderId: order.id,
          contentId: order.items?.[0]?.productId,
        });
        if (result.ok) {
          await db.tikTokLead.update({
            where: { id: lead.id },
            data: {
              status: "converted",
              orderId: order.id,
              postbackSent: true,
              postbackType: eventType,
            },
          });
        }
        return result;
      }
    } catch {
      // lead lookup failed — still send the postback
    }
  }

  // No matching lead — still send the postback for attribution.
  return sendTikTokPostback({
    type: eventType,
    email: order.customerEmail,
    value: order.total,
    currency: order.currency || "PKR",
    orderId: order.id,
    contentId: order.items?.[0]?.productId,
  });
}
