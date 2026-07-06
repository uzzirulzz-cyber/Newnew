import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/subscriptions/create
 *
 * Creates a new subscription record.
 *
 * Body: {
 *   customerName: string,
 *   customerEmail: string,
 *   plan: string,
 *   price: number,
 *   billingCycle: "monthly" | "yearly",
 *   status: "active" | "cancelled" | "past_due" | "trial",
 *   startDate: string,         // ISO date string
 *   nextBillingDate: string,   // ISO date string
 *   userId?: string,
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const {
    customerName,
    customerEmail,
    plan,
    price,
    billingCycle,
    status,
    startDate,
    nextBillingDate,
    userId,
  } = body;

  if (!customerName) return error("customerName is required", 422);
  if (!customerEmail) return error("customerEmail is required", 422);
  if (!plan) return error("plan is required", 422);
  if (price === undefined || price === null || Number.isNaN(Number(price))) {
    return error("A valid price is required", 422);
  }
  if (!billingCycle) return error("billingCycle is required", 422);
  if (!status) return error("status is required", 422);
  if (!startDate) return error("startDate is required", 422);
  if (!nextBillingDate) return error("nextBillingDate is required", 422);

  try {
    const subscription = await db.subscription.create({
      data: {
        customerName: String(customerName),
        customerEmail: String(customerEmail),
        plan: String(plan),
        price: Number(price),
        billingCycle: String(billingCycle),
        status: String(status),
        startDate: String(startDate),
        nextBillingDate: String(nextBillingDate),
        userId: userId ? String(userId) : null,
      },
    });

    return ok(
      {
        subscription: {
          id: subscription.id,
          customerName: subscription.customerName,
          customerEmail: subscription.customerEmail,
          plan: subscription.plan,
          price: subscription.price,
          billingCycle: subscription.billingCycle,
          status: subscription.status,
          startDate: subscription.startDate,
          nextBillingDate: subscription.nextBillingDate,
          userId: subscription.userId,
          createdAt: subscription.createdAt,
        },
        message: `Subscription for ${subscription.customerName} created`,
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create subscription",
      500,
    );
  }
}
