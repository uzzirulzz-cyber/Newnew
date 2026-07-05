import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/subscriptions/list
 *
 * Returns all subscriptions. Supports:
 *   ?status=  — filter by status (active | cancelled | past_due | trial)
 *   ?search=  — search customerName or customerEmail
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
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const subscriptions = await db.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: subscriptions.map((s) => ({
        id: s.id,
        userId: s.userId,
        customerName: s.customerName,
        customerEmail: s.customerEmail,
        plan: s.plan,
        price: s.price,
        billingCycle: s.billingCycle,
        status: s.status,
        startDate: s.startDate,
        nextBillingDate: s.nextBillingDate,
        cancelledAt: s.cancelledAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (e) {
    console.error("[admin/subscriptions/list] error:", e);
    return ok({ items: [] });
  }
}
