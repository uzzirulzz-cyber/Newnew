import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * POST /api/v1/admin/products/upload-image
 *
 * Accepts multipart/form-data with a single `file` field (image/*).
 * Saves the file to /public/uploads/products/<hash>.<ext> and returns
 * the publicly-served URL. Used by the admin Products edit dialog to
 * upload product cover images without base64-encoding them inline.
 *
 * Response: { url: string, name: string, size: number, mimeType: string }
 */
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error("Invalid multipart request", 422);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return error("No file uploaded. Expected a 'file' field.", 422);
  }
  if (file.size === 0) {
    return error("Uploaded file is empty", 422);
  }
  if (file.size > MAX_BYTES) {
    return error(`File too large. Max ${MAX_BYTES / 1024 / 1024}MB.`, 413);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return error(
      `Unsupported file type "${file.type}". Allowed: ${Array.from(ALLOWED_MIME).join(", ")}`,
      415,
    );
  }

  // Map mime -> extension (fallback to original name extension)
  const extByMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  };
  const ext = extByMime[file.type] || path.extname(file.name).slice(1) || "bin";

  // Hash the file contents to dedupe and avoid name collisions.
  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
  const fileName = `${Date.now()}-${hash}.${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, fileName), buf);
  } catch (e) {
    console.error("[product-image-upload] write error:", e);
    return error("Failed to write file to disk", 500);
  }

  const url = `/uploads/products/${fileName}`;
  return ok(
    {
      url,
      name: fileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    },
    201,
  );
}
