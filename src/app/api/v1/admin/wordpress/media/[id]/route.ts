import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const MEDIA_DIR = path.join(process.cwd(), "public", "media");

// ----- GET /api/v1/admin/wordpress/media/[id] -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid media id", 422);
  }

  try {
    const file = await db.mediaFile.findUnique({ where: { id } });
    if (!file) {
      return error("Media file not found", 404);
    }
    return ok({ file });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to fetch media file",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/wordpress/media/[id] -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid media id", 422);
  }

  try {
    const file = await db.mediaFile.findUnique({ where: { id } });
    if (!file) {
      return error("Media file not found", 404);
    }

    // Remove the file from disk (best-effort — don't fail the request if missing)
    if (file.url && file.url.startsWith("/media/")) {
      const absPath = path.join(MEDIA_DIR, path.basename(file.url));
      try {
        await fs.unlink(absPath);
      } catch {
        /* file may already be gone — ignore */
      }
    }

    await db.mediaFile.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete media file",
      500,
    );
  }
}
