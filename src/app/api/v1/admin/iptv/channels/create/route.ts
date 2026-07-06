import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/iptv/channels/create
 *
 * Creates a new IPTV channel.
 *
 * Body: {
 *   name: string,
 *   category?: string,
 *   streamUrl: string,
 *   logoUrl?: string,
 *   language?: string,
 *   country?: string,
 *   isHD?: boolean,                 // default false
 *   status: "active" | "inactive" | "error",
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { name, category, streamUrl, logoUrl, language, country, isHD, status } = body;

  if (!name) return error("name is required", 422);
  if (!streamUrl) return error("streamUrl is required", 422);
  if (!status) return error("status is required", 422);

  try {
    const channel = await db.iptvChannel.create({
      data: {
        name: String(name),
        category: category ? String(category) : null,
        streamUrl: String(streamUrl),
        logoUrl: logoUrl ? String(logoUrl) : null,
        language: language ? String(language) : null,
        country: country ? String(country) : null,
        isHD: Boolean(isHD),
        status: String(status),
      },
    });

    return ok(
      {
        channel: {
          id: channel.id,
          name: channel.name,
          category: channel.category,
          streamUrl: channel.streamUrl,
          logoUrl: channel.logoUrl,
          language: channel.language,
          country: channel.country,
          isHD: channel.isHD,
          status: channel.status,
          createdAt: channel.createdAt,
        },
        message: `Channel "${channel.name}" created`,
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create channel",
      500,
    );
  }
}
