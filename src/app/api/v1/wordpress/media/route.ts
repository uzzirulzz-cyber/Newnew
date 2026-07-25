import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getWordPressConnection, wpAuthHeader } from "@/lib/wordpress";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/wordpress/media
 *   Lists media items from the connected WordPress site (WP REST API /media).
 *
 * POST /api/v1/wordpress/media
 *   Uploads a file to the connected WordPress site.
 *   Body: FormData with "file" field (multipart/form-data).
 *   Returns the created media item.
 *
 * Uses the DB-backed WordPress connection (getWordPressConnection).
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const conn = await getWordPressConnection();
  if (!conn) return error("WordPress is not connected", 401);

  try {
    const base = conn.apiUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/media?per_page=30&_embed=true`, {
      headers: {
        Authorization: wpAuthHeader(conn),
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });

    if (!res.ok) {
      return error(`WordPress API error: ${res.status}`, 502);
    }

    const items = await res.json();
    return ok({ items: items.map((m: any) => ({
      id: m.id,
      title: m.title?.rendered || "Untitled",
      source_url: m.source_url,
      mime_type: m.mime_type,
      media_type: m.media_type,
      alt_text: m.alt_text || "",
      date: m.date,
      author: m.author,
      caption: m.caption?.rendered || "",
      description: m.description?.rendered || "",
      sizes: m.media_details?.sizes || {},
    }))});
  } catch (e: any) {
    return error(
      e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out"
        : e instanceof Error ? e.message : "Failed to fetch media",
      502,
    );
  }
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;

  const conn = await getWordPressConnection();
  if (!conn) return error("WordPress is not connected", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return error("No file provided — use multipart/form-data with a 'file' field", 422);
    }

    // Forward the file to WordPress's /media endpoint.
    const base = conn.apiUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/media`, {
      method: "POST",
      headers: {
        Authorization: wpAuthHeader(conn),
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return error(`WordPress upload failed: HTTP ${res.status}${text ? ` — ${text.slice(0, 200)}` : ""}`, 502);
    }

    const media: any = await res.json();
    return ok({
      media: {
        id: media.id,
        title: media.title?.rendered || file.name,
        source_url: media.source_url,
        mime_type: media.mime_type,
        alt_text: media.alt_text || "",
      },
      message: `Uploaded "${file.name}" to WordPress`,
    });
  } catch (e: any) {
    return error(
      e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Upload timed out"
        : e instanceof Error ? e.message : "Upload failed",
      502,
    );
  }
}
