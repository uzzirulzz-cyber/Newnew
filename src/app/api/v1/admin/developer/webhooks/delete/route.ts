import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/developer/webhooks/delete
 *
 * Permanently deletes a webhook endpoint.
 *
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id } = body;

  if (!id) return error("Webhook id is required", 422);

  try {
    const webhook = await db.webhook.delete({
      where: { id: String(id) },
    });

    return ok({
      deleted: true,
      id: webhook.id,
      name: webhook.name,
      message: `Webhook "${webhook.name}" deleted`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete webhook",
      500,
    );
  }
}
