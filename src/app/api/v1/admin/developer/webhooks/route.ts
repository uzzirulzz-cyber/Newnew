import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/developer/webhooks
 *
 * Returns all webhook endpoints. The `events` JSON-string column is parsed
 * back into an array of strings.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const webhooks = await db.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: webhooks.map((w) => ({
        id: w.id,
        name: w.name,
        url: w.url,
        events: safeParseArray(w.events),
        secret: w.secret,
        status: w.status,
        lastTriggeredAt: w.lastTriggeredAt,
        successCount: w.successCount,
        failureCount: w.failureCount,
        createdAt: w.createdAt,
      })),
    });
  } catch (e) {
    console.error("[admin/developer/webhooks] error:", e);
    return ok({ items: [] });
  }
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
