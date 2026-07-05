import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/iptv/subscribers
 *
 * Returns all IPTV subscribers. Supports:
 *   ?status=  — filter by status (active | expired | suspended)
 *   ?search=  — search name or email
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim() || "";
  const search = searchParams.get("search")?.trim() || "";

  try {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const subscribers = await db.iptvSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: subscribers.map((s) => ({
        id: s.id,
        userId: s.userId,
        name: s.name,
        email: s.email,
        mac: s.mac,
        deviceType: s.deviceType,
        plan: s.plan,
        expiresAt: s.expiresAt,
        status: s.status,
        maxConnections: s.maxConnections,
        activeConnections: s.activeConnections,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (e) {
    console.error("[admin/iptv/subscribers] error:", e);
    return ok({ items: [] });
  }
}
