import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/media/delete
 *
 * Permanently deletes a media file record. (Does not delete the underlying
 * blob from object storage — that's a separate concern.)
 *
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id } = body;

  if (!id) return error("Media file id is required", 422);

  try {
    const file = await db.mediaFile.delete({
      where: { id: String(id) },
    });

    return ok({
      deleted: true,
      id: file.id,
      name: file.name,
      message: `Media file "${file.name}" deleted`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete media file",
      500,
    );
  }
}
