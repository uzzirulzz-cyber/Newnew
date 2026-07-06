import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/iptv/subscribers/create
 *
 * Creates a new IPTV subscriber. Status defaults to "active" and
 * activeConnections defaults to 0 (per spec).
 *
 * Body: {
 *   name: string,
 *   email: string,
 *   mac?: string,
 *   deviceType?: string,
 *   plan: string,
 *   expiresAt: string,            // ISO date string
 *   maxConnections?: number,     // default 1
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { name, email, mac, deviceType, plan, expiresAt, maxConnections } = body;

  if (!name) return error("name is required", 422);
  if (!email) return error("email is required", 422);
  if (!plan) return error("plan is required", 422);
  if (!expiresAt) return error("expiresAt is required", 422);

  try {
    const subscriber = await db.iptvSubscriber.create({
      data: {
        name: String(name),
        email: String(email),
        mac: mac ? String(mac) : null,
        deviceType: deviceType ? String(deviceType) : null,
        plan: String(plan),
        expiresAt: String(expiresAt),
        maxConnections:
          maxConnections !== undefined && maxConnections !== null
            ? Number(maxConnections)
            : 1,
        activeConnections: 0,
        status: "active",
      },
    });

    return ok(
      {
        subscriber: {
          id: subscriber.id,
          name: subscriber.name,
          email: subscriber.email,
          mac: subscriber.mac,
          deviceType: subscriber.deviceType,
          plan: subscriber.plan,
          expiresAt: subscriber.expiresAt,
          status: subscriber.status,
          maxConnections: subscriber.maxConnections,
          activeConnections: subscriber.activeConnections,
          createdAt: subscriber.createdAt,
        },
        message: `IPTV subscriber "${subscriber.name}" created`,
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create subscriber",
      500,
    );
  }
}
