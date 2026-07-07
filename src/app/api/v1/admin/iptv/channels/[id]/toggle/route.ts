import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/iptv/channels/[id]/toggle
 *
 * Toggles a channel's status between "active" and "inactive".
 * Any non-"active" status (inactive, error, etc.) becomes "active".
 *
 * No body required — the toggle is purely state-driven.
 *
 * Returns: { channel, message }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!id) return error("Channel ID is required", 422);

  try {
    const existing = await db.iptvChannel.findUnique({ where: { id } });
    if (!existing) return error("Channel not found", 404);

    const nextStatus = existing.status === "active" ? "inactive" : "active";

    const updated = await db.iptvChannel.update({
      where: { id },
      data: { status: nextStatus },
    });

    return ok({
      channel: {
        id: updated.id,
        name: updated.name,
        category: updated.category,
        streamUrl: updated.streamUrl,
        logoUrl: updated.logoUrl,
        language: updated.language,
        country: updated.country,
        isHD: updated.isHD,
        status: updated.status,
        viewerCount: updated.viewerCount,
        epgId: updated.epgId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      message: `Channel "${updated.name}" ${nextStatus === "active" ? "activated" : "deactivated"}`,
    });
  } catch (e) {
    console.error("[admin/iptv/channels/toggle] error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to toggle channel",
      500,
    );
  }
}
