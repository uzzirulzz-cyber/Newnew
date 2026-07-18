import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/iptv/subscribers/[id]/credentials
 *
 * Sets (or clears) the Xtream Codes credentials for a single IPTV subscriber.
 *
 * Body (set credentials):
 *   {
 *     profileName: string,   // friendly label e.g. "Main Server"
 *     hostUrl: string,       // Xtream Codes server URL w/ port, e.g. http://srv.com:8080
 *     username: string,      // Xtream username
 *     password: string,      // Xtream password
 *     notes?: string,        // optional freeform notes
 *   }
 *
 * Body (clear credentials):
 *   { clear: true }
 *
 * When setting, the server derives:
 *   portalUrl = hostUrl (trailing slash trimmed)
 *   m3uUrl    = `${hostUrl}/get.php?username=USER&password=PASS&type=m3u_plus&output=ts`
 *
 * Returns the updated subscriber (credentials included).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!id) return error("Subscriber ID is required", 422);
  // MongoDB ObjectIds are 24 hex chars — reject anything else with a clean
  // 422 so malformed ids don't surface as ugly Prisma P2023 errors.
  if (!/^[a-f\d]{24}$/i.test(id)) return error("Invalid subscriber ID", 422);

  const body = await request.json().catch(() => ({}));

  try {
    const existing = await db.iptvSubscriber.findUnique({ where: { id } });
    if (!existing) return error("Subscriber not found", 404);

    // --- Clear path -------------------------------------------------------
    if (body?.clear === true) {
      const cleared = await db.iptvSubscriber.update({
        where: { id },
        data: {
          profileName: null,
          hostUrl: null,
          xtreamUsername: null,
          xtreamPassword: null,
          portalUrl: null,
          m3uUrl: null,
          notes: null,
        },
      });
      return ok({
        subscriber: serialize(cleared),
        message: `Xtream credentials cleared for "${cleared.name}"`,
      });
    }

    // --- Set path ---------------------------------------------------------
    const profileName = String(body?.profileName ?? "").trim();
    const hostUrlRaw = String(body?.hostUrl ?? "").trim();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");
    const notes = body?.notes != null ? String(body.notes) : existing.notes;

    if (!profileName) return error("profileName is required", 422);
    if (!hostUrlRaw) return error("hostUrl is required", 422);
    if (!username) return error("username is required", 422);
    if (!password) return error("password is required", 422);

    // Normalize the host URL: strip trailing slashes. We keep the scheme +
    // host + port exactly as the admin typed it (Xtream portals live on
    // non-standard ports like 8080).
    const hostUrl = hostUrlRaw.replace(/\/+$/, "");

    // Basic scheme check — Xtream portals are HTTP(S) endpoints.
    if (!/^https?:\/\//i.test(hostUrl)) {
      return error(
        "hostUrl must include the scheme, e.g. http://server.com:8080",
        422,
      );
    }

    const m3uUrl = `${hostUrl}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`;

    const updated = await db.iptvSubscriber.update({
      where: { id },
      data: {
        profileName,
        hostUrl,
        xtreamUsername: username,
        xtreamPassword: password,
        portalUrl: hostUrl,
        m3uUrl,
        notes,
      },
    });

    return ok({
      subscriber: serialize(updated),
      message: `Xtream credentials saved for "${updated.name}"`,
    });
  } catch (e) {
    console.error("[admin/iptv/subscribers/credentials] error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to save credentials",
      500,
    );
  }
}

/** Shape the subscriber for the response (includes the new Xtream fields). */
function serialize(s: any) {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    mac: s.mac,
    deviceType: s.deviceType,
    plan: s.plan,
    expiresAt: s.expiresAt,
    status: s.status,
    maxConnections: s.maxConnections,
    activeConnections: s.activeConnections,
    profileName: s.profileName,
    hostUrl: s.hostUrl,
    xtreamUsername: s.xtreamUsername,
    xtreamPassword: s.xtreamPassword,
    portalUrl: s.portalUrl,
    m3uUrl: s.m3uUrl,
    notes: s.notes,
    updatedAt: s.updatedAt,
  };
}
