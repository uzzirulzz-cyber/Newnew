import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/media/add
 *
 * Registers a media file in the library. The actual upload (file bytes) is
 * handled elsewhere; this endpoint just records the metadata row.
 *
 * Body: {
 *   name: string,
 *   url: string,
 *   type: string,                 // image | video | document | audio
 *   size: number,                 // bytes
 *   mimeType?: string,
 *   folder?: string,
 *   tags?: string[],              // stored as JSON.stringify(tags)
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { name, url, type, size, mimeType, folder, tags } = body;

  if (!name) return error("name is required", 422);
  if (!url) return error("url is required", 422);
  if (!type) return error("type is required", 422);
  if (size === undefined || size === null || Number.isNaN(Number(size))) {
    return error("A valid size is required", 422);
  }

  const tagsArray = Array.isArray(tags) ? tags : [];

  try {
    const file = await db.mediaFile.create({
      data: {
        name: String(name),
        url: String(url),
        type: String(type),
        size: Number(size),
        mimeType: mimeType ? String(mimeType) : null,
        folder: folder ? String(folder) : null,
        tags: JSON.stringify(tagsArray),
      },
    });

    return ok(
      {
        file: {
          id: file.id,
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
          mimeType: file.mimeType,
          folder: file.folder,
          uploadedBy: file.uploadedBy,
          tags: tagsArray,
          storageId: file.storageId,
          createdAt: file.createdAt,
        },
        message: `Media file "${file.name}" added`,
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to add media file",
      500,
    );
  }
}
