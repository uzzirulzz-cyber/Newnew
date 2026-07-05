import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/finance/revenue
 *
 * Returns aggregate revenue metrics:
 *   - totalRevenue          = sum of amount for completed transactions
 *   - salesRevenue          = sum of amount for completed sale-type transactions
 *   - subscriptionRevenue   = sum of amount for completed subscription-type transactions
 *   - refunds               = sum of amount for refund-type transactions (any status)
 *   - transactionCount      = total row count
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const [completedAgg, salesAgg, subsAgg, refundsAgg, count] = await Promise.all([
      db.transaction.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { status: "completed", type: "sale" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { status: "completed", type: "subscription" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: "refund" },
        _sum: { amount: true },
      }),
      db.transaction.count(),
    ]);

    return ok({
      totalRevenue: completedAgg._sum.amount ?? 0,
      salesRevenue: salesAgg._sum.amount ?? 0,
      subscriptionRevenue: subsAgg._sum.amount ?? 0,
      refunds: refundsAgg._sum.amount ?? 0,
      transactionCount: count,
    });
  } catch (e) {
    console.error("[admin/finance/revenue] error:", e);
    return ok({
      totalRevenue: 0,
      salesRevenue: 0,
      subscriptionRevenue: 0,
      refunds: 0,
      transactionCount: 0,
    });
  }
}
