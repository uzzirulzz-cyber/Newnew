import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/iptv/channels/delete
 *
 * Deletes an IPTV channel by ID.
 *
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id } = body;

  if (!id) return error("Channel id is required", 422);

  try {
    const channel = await db.iptvChannel.delete({
      where: { id: String(id) },
    });

    return ok({
      deleted: true,
      id: channel.id,
      name: channel.name,
      message: `Channel "${channel.name}" deleted`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete channel",
      500,
    );
  }
}
