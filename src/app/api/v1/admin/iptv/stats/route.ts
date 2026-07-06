import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/iptv/stats
 *
 * Returns aggregate IPTV metrics:
 *   {
 *     totalChannels,
 *     activeChannels,
 *     errorChannels,
 *     totalSubscribers,
 *     activeSubscribers,
 *   }
 *
 * On DB errors returns zeros so the admin panel doesn't crash.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const [
      totalChannels,
      activeChannels,
      errorChannels,
      totalSubscribers,
      activeSubscribers,
    ] = await Promise.all([
      db.iptvChannel.count(),
      db.iptvChannel.count({ where: { status: "active" } }),
      db.iptvChannel.count({ where: { status: "error" } }),
      db.iptvSubscriber.count(),
      db.iptvSubscriber.count({ where: { status: "active" } }),
    ]);

    return ok({
      totalChannels,
      activeChannels,
      errorChannels,
      totalSubscribers,
      activeSubscribers,
    });
  } catch (e) {
    console.error("[admin/iptv/stats] error:", e);
    return ok({
      totalChannels: 0,
      activeChannels: 0,
      errorChannels: 0,
      totalSubscribers: 0,
      activeSubscribers: 0,
    });
  }
}
