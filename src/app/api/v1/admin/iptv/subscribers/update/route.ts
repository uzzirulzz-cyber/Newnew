import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/iptv/subscribers/update
 *
 * Updates the status of an IPTV subscriber.
 *
 * Body: {
 *   id: string,
 *   status: "active" | "expired" | "suspended",
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, status } = body;

  if (!id) return error("Subscriber id is required", 422);
  if (!status) return error("status is required", 422);

  try {
    const subscriber = await db.iptvSubscriber.update({
      where: { id: String(id) },
      data: { status: String(status) },
    });

    return ok({
      subscriber: {
        id: subscriber.id,
        name: subscriber.name,
        email: subscriber.email,
        status: subscriber.status,
        updatedAt: subscriber.updatedAt,
      },
      message: `Subscriber "${subscriber.name}" updated to "${subscriber.status}"`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update subscriber",
      500,
    );
  }
}
