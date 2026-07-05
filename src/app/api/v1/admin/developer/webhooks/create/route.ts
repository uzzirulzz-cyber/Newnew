import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/developer/webhooks/create
 *
 * Registers a new webhook endpoint.
 *
 * Body: {
 *   name: string,
 *   url: string,
 *   events: string[],            // e.g. ["order.created","payment.refunded"]
 * }
 *
 * Auto-set fields:
 *   status        = "active"
 *   successCount  = 0
 *   failureCount  = 0
 *   events stored as JSON.stringify(events)
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { name, url, events } = body;

  if (!name) return error("name is required", 422);
  if (!url) return error("url is required", 422);
  if (!Array.isArray(events)) {
    return error("events must be an array", 422);
  }

  try {
    const webhook = await db.webhook.create({
      data: {
        name: String(name),
        url: String(url),
        events: JSON.stringify(events),
        status: "active",
        successCount: 0,
        failureCount: 0,
      },
    });

    return ok(
      {
        webhook: {
          id: webhook.id,
          name: webhook.name,
          url: webhook.url,
          events,
          status: webhook.status,
          successCount: webhook.successCount,
          failureCount: webhook.failureCount,
          createdAt: webhook.createdAt,
        },
        message: `Webhook "${webhook.name}" created`,
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create webhook",
      500,
    );
  }
}
