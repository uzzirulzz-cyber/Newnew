import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/v1/media/folder
 *
 * Creates a new folder in /public/uploads/{name}/.
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  try {
    const { name } = await request.json().catch(() => ({}));
    if (!name || typeof name !== "string") {
      return error("Folder name is required", 422);
    }

    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 50);
    if (!safeName) {
      return error("Invalid folder name", 422);
    }

    const folderPath = path.join(process.cwd(), "public", "uploads", safeName);
    await fs.mkdir(folderPath, { recursive: true });

    return ok({ name: safeName, created: true });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create folder",
      500,
    );
  }
}
