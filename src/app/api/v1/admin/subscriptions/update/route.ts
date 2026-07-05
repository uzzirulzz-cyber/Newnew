import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/subscriptions/update
 *
 * Updates the status of a subscription. If the new status is "cancelled",
 * the `cancelledAt` field is set to the current ISO timestamp.
 *
 * Body: {
 *   id: string,
 *   status: "active" | "cancelled" | "past_due" | "trial",
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, status } = body;

  if (!id) return error("Subscription id is required", 422);
  if (!status) return error("status is required", 422);

  try {
    const updateData: any = { status: String(status) };
    if (String(status) === "cancelled") {
      updateData.cancelledAt = new Date().toISOString();
    }

    const subscription = await db.subscription.update({
      where: { id: String(id) },
      data: updateData,
    });

    return ok({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelledAt: subscription.cancelledAt,
        updatedAt: subscription.updatedAt,
      },
      message: `Subscription updated to "${subscription.status}"`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update subscription",
      500,
    );
  }
}
