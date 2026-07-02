import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

// GET /api/v1/affiliates/stats  — affiliate dashboard data for the demo affiliate
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  // For the demo, return the first affiliate's stats (so the UI always has data)
  const affiliate = await db.affiliate.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      payouts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!affiliate) return error("No affiliate found", 404);

  // clicks over last 30 days
  const clicks = await db.affiliateClick.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, { clicks: number; conversions: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { clicks: 0, conversions: 0 });
  }
  for (const c of clicks) {
    const key = c.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.clicks += 1;
      if (c.converted) bucket.conversions += 1;
    }
  }

  const timeseries = Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));

  const conversionRate =
    affiliate.totalClicks > 0
      ? Math.round((affiliate.totalConversions / affiliate.totalClicks) * 1000) / 10
      : 0;

  const referralLink = `https://playbeat.io/?ref=${affiliate.code}`;

  // top referring products (mock derived from orders with affiliateCode)
  const attributedOrders = await db.order.findMany({
    where: { affiliateCode: affiliate.code },
    include: { items: { include: { product: true } } },
  });
  const productMap = new Map<string, { title: string; conversions: number; earnings: number }>();
  for (const o of attributedOrders) {
    for (const it of o.items) {
      const existing = productMap.get(it.productId) ?? {
        title: it.product.title,
        conversions: 0,
        earnings: 0,
      };
      existing.conversions += 1;
      existing.earnings += (it.price * affiliate.commissionRate) / 100;
      productMap.set(it.productId, existing);
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  return ok({
    affiliate: {
      id: affiliate.id,
      code: affiliate.code,
      referralLink,
      commissionRate: affiliate.commissionRate,
      status: affiliate.status,
    },
    stats: {
      totalClicks: affiliate.totalClicks,
      totalConversions: affiliate.totalConversions,
      conversionRate,
      totalEarnings: affiliate.totalEarnings,
      balance: affiliate.balance,
      pendingPayout: affiliate.balance,
    },
    timeseries,
    payouts: affiliate.payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      method: p.method,
      createdAt: p.createdAt,
    })),
    topProducts,
  });
}
