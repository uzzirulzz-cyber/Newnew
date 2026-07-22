import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/zip",
  "text/",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml",
];

function sanitizeFileName(name: string): string {
  // Keep the extension; slugify the base name.
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext);
  const safe = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
  const safeExt = ext.replace(/[^a-z0-9.]/g, "").slice(0, 12);
  return `${safe}${safeExt}`;
}

function typeFromMime(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("zip") || mime.includes("compressed")) return "archive";
  if (mime.includes("word") || mime.includes("document")) return "document";
  if (mime.includes("sheet") || mime.includes("excel")) return "spreadsheet";
  if (mime.startsWith("text/")) return "text";
  return "file";
}

// ----- GET /api/v1/admin/wordpress/media — paginated list with search -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const url = new URL(request.url);
  const search = (url.searchParams.get("search") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") || 50)),
  );

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mimeType: { contains: search, mode: "insensitive" } },
      { type: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [items, total] = await Promise.all([
      db.mediaFile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mediaFile.count({ where }),
    ]);
    return ok({ items, total, page, limit });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list media",
      500,
    );
  }
}

// ----- POST /api/v1/admin/wordpress/media — upload a file (multipart) -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error("Expected multipart/form-data upload", 422);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return error("No 'file' field provided", 422);
  }
  if (file.size === 0) {
    return error("Uploaded file is empty", 422);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return error(
      `File too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB)`,
      413,
    );
  }

  const mimeType = file.type || "application/octet-stream";
  const allowed =
    ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p)) ||
    mimeType === "application/octet-stream";
  if (!allowed) {
    return error(`Unsupported file type: ${mimeType}`, 415);
  }

  // Ensure upload dir exists
  await fs.mkdir(MEDIA_DIR, { recursive: true });

  // Build a unique file name: <slug>-<6hex>.<ext>
  const originalName = file.name || "upload";
  const safeName = sanitizeFileName(originalName);
  const ext = path.extname(safeName);
  const base = path.basename(safeName, ext);
  const unique = `${base}-${randomBytes(3).toString("hex")}${ext}`;

  const absPath = path.join(MEDIA_DIR, unique);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(absPath, Buffer.from(arrayBuffer));

  const publicUrl = `/media/${unique}`;
  const type = typeFromMime(mimeType);

  try {
    const media = await db.mediaFile.create({
      data: {
        name: originalName.slice(0, 200),
        url: publicUrl,
        type,
        size: file.size,
        mimeType,
        folder: "media",
        tags: "[]",
      },
    });
    return ok({ file: media }, 201);
  } catch (e) {
    // Roll back the file write if the DB insert fails — keep disk clean.
    try {
      await fs.unlink(absPath);
    } catch {
      /* best effort */
    }
    return error(
      e instanceof Error ? e.message : "Failed to save media record",
      500,
    );
  }
}
