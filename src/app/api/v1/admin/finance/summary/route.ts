import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const EMPTY_BY_CATEGORY: Record<string, number> = {
  "office-bills": 0,
  electricity: 0,
  internet: 0,
  stationary: 0,
  rent: 0,
  salaries: 0,
  marketing: 0,
  tools: 0,
  other: 0,
};

/**
 * GET /api/v1/admin/finance/summary
 *
 * Computes a comprehensive finance summary from REAL DB data:
 *   - Revenue from COMPLETED orders (gross, net of refunds, count)
 *   - Expenses from db.expense (total, by category, count)
 *   - Profit (net revenue minus expenses, margin %)
 *   - Refunds (total + count from REFUNDED orders)
 *   - recentExpenses — last 10 expense records
 *   - monthlyData — last 12 months of revenue / expenses / profit
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  try {
    // ---- Revenue + Refunds from orders ----
    // gross = sum of totals where status = COMPLETED
    // refunds = sum of totals where status = REFUNDED
    const completedOrders = await db.order.findMany({
      where: { status: "COMPLETED" },
      select: { total: true, currency: true, createdAt: true },
    });
    const refundedOrders = await db.order.findMany({
      where: { status: "REFUNDED" },
      select: { total: true, currency: true, createdAt: true },
    });

    const grossRevenue = completedOrders.reduce((s, o) => s + (o.total || 0), 0);
    const refundTotal = refundedOrders.reduce((s, o) => s + (o.total || 0), 0);
    const netRevenue = Math.max(0, grossRevenue - refundTotal);
    const orderCount = completedOrders.length;
    const refundCount = refundedOrders.length;

    // ---- Expenses ----
    const allExpenses = await db.expense.findMany({
      orderBy: { expenseDate: "desc" },
    });

    const expenseTotal = allExpenses.reduce(
      (s, e) => s + (e.amount || 0),
      0,
    );

    const byCategory: Record<string, number> = { ...EMPTY_BY_CATEGORY };
    for (const e of allExpenses) {
      const key = EMPTY_BY_CATEGORY[e.category] !== undefined
        ? e.category
        : "other";
      byCategory[key] += e.amount || 0;
    }

    const recentExpenses = allExpenses.slice(0, 10).map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      typeCode: e.typeCode,
      amount: e.amount,
      currency: e.currency,
      expenseDate: e.expenseDate,
      status: e.status,
      createdAt: e.createdAt,
    }));

    // ---- Profit ----
    const profitGross = netRevenue - expenseTotal;
    const profitMargin =
      grossRevenue > 0 ? (profitGross / grossRevenue) * 100 : 0;

    // ---- Monthly data — last 12 months ----
    // Build a map keyed by `YYYY-MM` for revenue (from order.createdAt) and
    // expenses (from expense.expenseDate).
    const now = new Date();
    const months: Array<{ key: string; month: string; revenue: number; expenses: number; profit: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        month: MONTH_NAMES[d.getMonth()],
        revenue: 0,
        expenses: 0,
        profit: 0,
      });
    }
    const monthMap = new Map(months.map((m) => [m.key, m]));

    // Revenue by month (from completed orders — subtract refunds).
    for (const o of completedOrders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(key);
      if (bucket) bucket.revenue += o.total || 0;
    }
    for (const o of refundedOrders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(key);
      if (bucket) bucket.revenue = Math.max(0, bucket.revenue - (o.total || 0));
    }

    // Expenses by month.
    for (const e of allExpenses) {
      const d = new Date(e.expenseDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(key);
      if (bucket) bucket.expenses += e.amount || 0;
    }

    // Profit per month.
    for (const m of months) {
      m.profit = m.revenue - m.expenses;
    }

    return ok({
      revenue: {
        gross: grossRevenue,
        net: netRevenue,
        count: orderCount,
      },
      expenses: {
        total: expenseTotal,
        byCategory,
        count: allExpenses.length,
      },
      profit: {
        gross: profitGross,
        margin: Number(profitMargin.toFixed(2)),
      },
      refunds: {
        total: refundTotal,
        count: refundCount,
      },
      recentExpenses,
      monthlyData: months.map(({ key, ...rest }) => rest),
    });
  } catch (e) {
    console.error("[admin/finance/summary] error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to compute finance summary",
      500,
    );
  }
}
