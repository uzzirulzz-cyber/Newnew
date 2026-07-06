import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/developer/webhooks/toggle
 *
 * Updates a webhook's status.
 *
 * Body: { id: string, status: "active" | "inactive" }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, status } = body;

  if (!id) return error("Webhook id is required", 422);
  if (status !== "active" && status !== "inactive") {
    return error("status must be 'active' or 'inactive'", 422);
  }

  try {
    const webhook = await db.webhook.update({
      where: { id: String(id) },
      data: { status: String(status) },
    });

    return ok({
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        status: webhook.status,
      },
      message: `Webhook "${webhook.name}" ${status}`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update webhook",
      500,
    );
  }
}
