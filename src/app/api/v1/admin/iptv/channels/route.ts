import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/iptv/channels
 *
 * Returns all IPTV channels. Supports:
 *   ?status=    — filter by status (active | inactive | error)
 *   ?category=  — filter by category (exact match, case-insensitive)
 *   ?search=    — search channel name
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const search = searchParams.get("search")?.trim() || "";

  try {
    const where: any = {};
    if (status) where.status = status;
    if (category) {
      where.category = { equals: category };
    }
    if (search) {
      where.name = { contains: search };
    }

    const channels = await db.iptvChannel.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: channels.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        streamUrl: c.streamUrl,
        logoUrl: c.logoUrl,
        language: c.language,
        country: c.country,
        isHD: c.isHD,
        status: c.status,
        viewerCount: c.viewerCount,
        epgId: c.epgId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (e) {
    console.error("[admin/iptv/channels] error:", e);
    return ok({ items: [] });
  }
}
