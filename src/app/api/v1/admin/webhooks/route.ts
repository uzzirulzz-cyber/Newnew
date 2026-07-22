import { NextRequest } from "next/server";
import crypto from "crypto";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Parse the JSON `events` field on a Webhook into a string[].
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

// ----- GET /api/v1/admin/webhooks — list all webhooks -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const webhooks = await db.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok({ items: webhooks.map(serialize) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list webhooks",
      500,
    );
  }
}

// ----- POST /api/v1/admin/webhooks — create a new webhook -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return error("Name is required", 422);
  if (name.length > 120) return error("Name must be 120 characters or fewer", 422);

  const url =
    typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return error("URL is required", 422);
  try {
    // Validate URL format
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) {
      return error("URL must use http or https protocol", 422);
    }
  } catch {
    return error("Invalid URL format", 422);
  }

  // Normalize events into a string[] (default: ["*"]).
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

  // Auto-generate secret if not provided.
  const secret =
    typeof body.secret === "string" && body.secret.trim()
      ? body.secret.trim()
      : crypto.randomBytes(16).toString("hex");

  try {
    const webhook = await db.webhook.create({
      data: {
        name,
        url,
        events: JSON.stringify(events),
        secret,
        status: "active",
      },
    });
    return ok({ webhook: serialize(webhook) }, 201);
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create webhook",
      500,
    );
  }
}
