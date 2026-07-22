import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/v1/media/delete
 *
 * Deletes a file from /public/uploads/{folder}/{name}.
 * Body: { url: string } — the public URL of the file (e.g. /uploads/banners/hero.png)
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  try {
    const { url } = await request.json().catch(() => ({}));
    if (!url || typeof url !== "string") {
      return error("File URL is required", 422);
    }

    // Validate URL starts with /uploads/ to prevent path traversal
    if (!url.startsWith("/uploads/")) {
      return error("Invalid file URL", 422);
    }

    const filePath = path.join(process.cwd(), "public", url);
    // Resolve and ensure it's within uploads
    const uploadsRoot = path.join(process.cwd(), "public", "uploads");
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(uploadsRoot)) {
      return error("Invalid file path", 422);
    }

    await fs.unlink(resolved).catch(() => {
      throw new Error("File not found");
    });

    return ok({ deleted: true, url });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Delete failed",
      500,
    );
  }
}
