import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/iptv/channels/update
 *
 * Updates an existing IPTV channel by ID. All fields are optional — only
 * fields explicitly present in the body are written.
 *
 * Body: {
 *   id: string,
 *   name?: string,
 *   category?: string,
 *   streamUrl?: string,
 *   logoUrl?: string,
 *   status?: "active" | "inactive" | "error",
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, name, category, streamUrl, logoUrl, status } = body;

  if (!id) return error("Channel id is required", 422);

  const updateData: any = {};
  if (name !== undefined) updateData.name = String(name);
  if (category !== undefined) updateData.category = category ? String(category) : null;
  if (streamUrl !== undefined) updateData.streamUrl = String(streamUrl);
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl ? String(logoUrl) : null;
  if (status !== undefined) updateData.status = String(status);

  if (Object.keys(updateData).length === 0) {
    return error("No fields provided to update", 422);
  }

  try {
    const channel = await db.iptvChannel.update({
      where: { id: String(id) },
      data: updateData,
    });

    return ok({
      channel: {
        id: channel.id,
        name: channel.name,
        category: channel.category,
        streamUrl: channel.streamUrl,
        logoUrl: channel.logoUrl,
        status: channel.status,
        updatedAt: channel.updatedAt,
      },
      message: `Channel "${channel.name}" updated`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update channel",
      500,
    );
  }
}
