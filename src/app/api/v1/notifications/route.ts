import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

// GET /api/v1/notifications  — for current user (falls back to first customer for demo)
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  let user = await getCurrentUser(request);
  // demo fallback: first customer
  if (!user) {
    user = (await db.user.findFirst({ where: { role: "CUSTOMER" } })) as any;
  }
  if (!user) return error("No user available", 404);

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return ok({
    items: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
    })),
  });
}
