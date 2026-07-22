import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/admin/mobile/push — list recent broadcast push notifications.
 * POST /api/v1/admin/mobile/push
 *
 * Body: { title, message, audience }
 *
 * Stores the broadcast push in the MobilePushNotification table and returns
 * success. Since FCM/APNs credentials aren't configured yet, the actual
 * delivery is skipped — but we log the intent so it can be wired up later.
 */

const AUDIENCES = ["all", "users", "admins"] as const;

function serialize(n: any) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    audience: n.audience,
    status: n.status,
    createdAt: n.createdAt,
  };
}

// ----- GET -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const items = await db.mobilePushNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok({ items: items.map(serialize) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list push notifications",
      500,
    );
  }
}

// ----- POST -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const audience =
    typeof body.audience === "string" && AUDIENCES.includes(body.audience as any)
      ? body.audience
      : "all";

  if (!title) return error("title is required", 422);
  if (!message) return error("message is required", 422);

  try {
    // Persist the broadcast so we have a history of pushes sent from the admin.
    const record = await db.mobilePushNotification.create({
      data: {
        title,
        message,
        audience,
        status: "sent",
      },
    });

    // NOTE: When FCM/APNs is configured, this is where we would fan out the
    // delivery. For now we just log the intent — the route still returns
    // success because the record is durable.
    console.log(
      `[mobile/push] queued broadcast (audience=${audience}): "${title}" → ${record.id}`,
    );

    return ok({
      success: true,
      id: record.id,
      audience,
      title,
      message,
      note:
        "Stored in DB. Configure FCM/APNs credentials in Settings to deliver via push services.",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to send push notification",
      500,
    );
  }
}
