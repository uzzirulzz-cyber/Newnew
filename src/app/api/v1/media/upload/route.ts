import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/v1/media/upload
 *
 * Handles file uploads via multipart/form-data. Saves files to
 * /public/uploads/ and returns the public URL + metadata.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    const folder = (formData.get("folder") as string) || "general";

    if (!files || files.length === 0) {
      return error("No files provided", 422);
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadDir, { recursive: true });

    const uploaded = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        uploaded.push({
          name: file.name,
          error: "File exceeds 100MB limit",
        });
        continue;
      }

      // Generate unique filename
      const ext = path.extname(file.name);
      const baseName = path.basename(file.name, ext);
      const uniqueName = `${baseName}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      // Write file
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${folder}/${uniqueName}`;

      uploaded.push({
        name: file.name,
        storedName: uniqueName,
        url: publicUrl,
        size: file.size,
        type: file.type,
        folder,
        uploadedAt: new Date().toISOString(),
      });
    }

    return ok({ files: uploaded, count: uploaded.length });
  } catch (e) {
    console.error("[media-upload] error:", e);
    return error("Failed to upload files", 500, String(e));
  }
}
