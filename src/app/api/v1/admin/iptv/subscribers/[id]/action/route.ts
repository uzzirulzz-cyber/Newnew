import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/iptv/subscribers/[id]/action
 *
 * Quick action for a single IPTV subscriber.
 *
 * Body: { action: "activate" | "suspend" | "delete" }
 *   - activate: sets status = "active"
 *   - suspend:  sets status = "suspended"
 *   - delete:   deletes the subscriber row
 *
 * Returns:
 *   - For activate/suspend: { subscriber, message }
 *   - For delete:           { success: true, message }
 */
const VALID_ACTIONS = new Set(["activate", "suspend", "delete"]);
const ACTION_TO_STATUS: Record<string, string> = {
  activate: "active",
  suspend: "suspended",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!id) return error("Subscriber ID is required", 422);

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action ?? "").toLowerCase().trim();

  if (!VALID_ACTIONS.has(action)) {
    return error(
      `Invalid action. Must be one of: ${Array.from(VALID_ACTIONS).join(", ")}`,
      422,
    );
  }

  try {
    // Verify the subscriber exists first (give a clean 404 for unknown IDs).
    const existing = await db.iptvSubscriber.findUnique({ where: { id } });
    if (!existing) return error("Subscriber not found", 404);

    if (action === "delete") {
      await db.iptvSubscriber.delete({ where: { id } });
      return ok({
        success: true,
        message: `Subscriber "${existing.name}" deleted`,
      });
    }

    const newStatus = ACTION_TO_STATUS[action];
    const updated = await db.iptvSubscriber.update({
      where: { id },
      data: { status: newStatus },
    });

    return ok({
      subscriber: {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        email: updated.email,
        mac: updated.mac,
        deviceType: updated.deviceType,
        plan: updated.plan,
        expiresAt: updated.expiresAt,
        status: updated.status,
        maxConnections: updated.maxConnections,
        activeConnections: updated.activeConnections,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      message: `Subscriber "${updated.name}" ${action === "activate" ? "activated" : "suspended"}`,
    });
  } catch (e) {
    console.error("[admin/iptv/subscribers/action] error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to perform action",
      500,
    );
  }
}
