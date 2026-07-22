import { NextRequest } from "next/server";
import crypto from "crypto";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function parseEvents(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((e): e is string => typeof e === "string");
    }
  } catch {
    // ignore
  }
  return [];
}

function serialize(w: any) {
  return {
    id: w.id,
    name: w.name,
    url: w.url,
    events: parseEvents(w.events),
    secret: w.secret ?? null,
    status: w.status,
    lastTriggeredAt: w.lastTriggeredAt ?? null,
    successCount: w.successCount ?? 0,
    failureCount: w.failureCount ?? 0,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt ?? w.createdAt,
  };
}

// ----- GET /api/v1/admin/webhooks/[id] -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid webhook id", 422);
  }

  try {
    const webhook = await db.webhook.findUnique({ where: { id } });
    if (!webhook) return error("Webhook not found", 404);
    return ok({ webhook: serialize(webhook) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to fetch webhook",
      500,
    );
  }
}

// ----- PATCH /api/v1/admin/webhooks/[id] -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid webhook id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.webhook.findUnique({ where: { id } });
  if (!existing) return error("Webhook not found", 404);

  const data: any = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return error("Name cannot be empty", 422);
    if (name.length > 120) return error("Name must be 120 characters or fewer", 422);
    data.name = name;
  }

  if (body.url !== undefined) {
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) return error("URL cannot be empty", 422);
    try {
      const u = new URL(url);
      if (!["http:", "https:"].includes(u.protocol)) {
        return error("URL must use http or https protocol", 422);
      }
    } catch {
      return error("Invalid URL format", 422);
    }
    data.url = url;
  }

  if (body.events !== undefined) {
    let events: string[] = ["*"];
    if (Array.isArray(body.events)) {
      events = body.events
        .filter((e: unknown) => typeof e === "string" && e.trim())
        .map((e: string) => e.trim());
      if (events.length === 0) events = ["*"];
    } else if (typeof body.events === "string" && body.events.trim()) {
      events = body.events
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
    }
    data.events = JSON.stringify(events);
  }

  if (body.status !== undefined) {
    const status = typeof body.status === "string" ? body.status.trim() : "";
    if (!["active", "inactive", "paused"].includes(status)) {
      return error("Status must be one of: active, inactive, paused", 422);
    }
    data.status = status;
  }

  // Allow caller to rotate the secret.
  if (body.rotateSecret === true) {
    data.secret = crypto.randomBytes(16).toString("hex");
  }

  try {
    const updated = await db.webhook.update({ where: { id }, data });
    return ok({ webhook: serialize(updated) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update webhook",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/webhooks/[id] -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid webhook id", 422);
  }

  const existing = await db.webhook.findUnique({ where: { id } });
  if (!existing) return error("Webhook not found", 404);

  try {
    await db.webhook.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete webhook",
      500,
    );
  }
}

// ----- POST /api/v1/admin/webhooks/[id]?test=1 — send a test event -----

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid webhook id", 422);
  }

  const webhook = await db.webhook.findUnique({ where: { id } });
  if (!webhook) return error("Webhook not found", 404);

  const payload = {
    event: "test",
    timestamp: new Date().toISOString(),
    data: {
      webhookId: webhook.id,
      webhookName: webhook.name,
      message: "This is a test event from PlayBeat Admin",
    },
  };

  // Compute HMAC-SHA256 signature using the webhook secret (if present) so the
  // receiver can verify authenticity.
  let signature: string | null = null;
  if (webhook.secret) {
    signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(JSON.stringify(payload))
      .digest("hex");
  }

  const nowIso = new Date().toISOString();
  let success = false;
  let message = "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PlayBeat-Event": "test",
        ...(signature ? { "X-PlayBeat-Signature": signature } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    success = res.status >= 200 && res.status < 300;
    message = success
      ? `Delivered (HTTP ${res.status})`
      : `Recipient responded with HTTP ${res.status}`;
  } catch (e) {
    success = false;
    message =
      e instanceof Error
        ? `Delivery failed: ${e.message}`
        : "Delivery failed: network error";
  }

  try {
    await db.webhook.update({
      where: { id },
      data: {
        lastTriggeredAt: nowIso,
        successCount: (webhook.successCount ?? 0) + (success ? 1 : 0),
        failureCount: (webhook.failureCount ?? 0) + (success ? 0 : 1),
      },
    });
  } catch {
    // ignore — delivery result still returned to caller
  }

  return ok({ success, message, deliveredAt: nowIso });
}
