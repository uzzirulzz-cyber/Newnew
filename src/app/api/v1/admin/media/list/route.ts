import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/media/list
 *
 * Returns all media files. Supports:
 *   ?type=    — filter by type (image | video | document | audio)
 *   ?folder=  — filter by folder (exact match)
 *   ?search=  — match file name (case-insensitive contains)
 *
 * Ordered by createdAt desc. The `tags` JSON-string column is parsed back
 * into an array of strings.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type")?.trim() || "";
  const folder = searchParams.get("folder")?.trim() || "";
  const search = searchParams.get("search")?.trim() || "";

  try {
    const where: any = {};
    if (type) where.type = type;
    if (folder) where.folder = folder;
    if (search) {
      where.name = { contains: search };
    }

    const files = await db.mediaFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: files.map((f) => ({
        id: f.id,
        name: f.name,
        url: f.url,
        type: f.type,
        size: f.size,
        mimeType: f.mimeType,
        folder: f.folder,
        uploadedBy: f.uploadedBy,
        tags: safeParseArray(f.tags),
        storageId: f.storageId,
        createdAt: f.createdAt,
      })),
    });
  } catch (e) {
    console.error("[admin/media/list] error:", e);
    return ok({ items: [] });
  }
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
