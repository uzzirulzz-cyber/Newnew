import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, applyRateLimit } from "@/lib/api";
import { ensureSeeded } from "@/lib/ensure-seed";

// GET /api/v1/analytics/dashboard  — platform-wide analytics (admin view)
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const [orders, products, users, vendors, customers, reviews] = await Promise.all([
    db.order.findMany({
      where: { status: "COMPLETED" },
      include: { items: { include: { product: { include: { category: true } } } }, payment: true },
    }),
    db.product.findMany({ include: { vendor: true } }),
    db.user.count(),
    db.vendor.findMany(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.review.count(),
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const aov = orders.length > 0 ? revenue / orders.length : 0;
  const conversionRate =
    users > 0 ? Math.round((orders.length / (users * 6)) * 1000) / 10 : 0; // mock traffic multiplier

  // revenue over last 30 days
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  }
  const revenueTimeseries = Array.from(byDay.entries()).map(([date, v]) => ({
    date,
    revenue: Math.round(v.revenue * 100) / 100,
    orders: v.orders,
  }));

  // revenue by category
  const categoryMap = new Map<string, { name: string; revenue: number; orders: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const catName = it.product.category?.name ?? "Uncategorized";
      const existing = categoryMap.get(catName) ?? { name: catName, revenue: 0, orders: 0 };
      existing.revenue += it.price;
      existing.orders += 1;
      categoryMap.set(catName, existing);
    }
  }
  const revenueByCategory = Array.from(categoryMap.values())
    .map((c) => ({ ...c, revenue: Math.round(c.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue);

  // payment providers distribution
  const providerMap = new Map<string, number>();
  for (const o of orders) {
    const p = o.payment?.provider ?? "UNKNOWN";
    providerMap.set(p, (providerMap.get(p) ?? 0) + 1);
  }
  const paymentProviders = Array.from(providerMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // top selling products
  const productSales = new Map<string, { title: string; sales: number; revenue: number; vendor: string }>();
  for (const o of orders) {
    for (const it of o.items) {
      const existing = productSales.get(it.productId) ?? {
        title: it.product.title,
        sales: 0,
        revenue: 0,
        vendor: it.product.vendor?.storeName ?? "—",
      };
      existing.sales += 1;
      existing.revenue += it.price;
      productSales.set(it.productId, existing);
    }
  }
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));

  // top vendors
  const topVendors = vendors
    .map((v) => ({
      id: v.id,
      storeName: v.storeName,
      slug: v.slug,
      verified: v.verified,
      totalSales: v.totalSales,
      totalRevenue: Math.round(v.totalRevenue * 100) / 100,
      rating: v.rating,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 6);

  // traffic sources (mock)
  const trafficSources = [
    { source: "Direct", value: 32 },
    { source: "Organic Search", value: 28 },
    { source: "Affiliate", value: 18 },
    { source: "Social", value: 14 },
    { source: "Email", value: 8 },
  ];

  return ok({
    summary: {
      revenue: Math.round(revenue * 100) / 100,
      orders: orders.length,
      customers,
      products: products.length,
      vendors: vendors.length,
      reviews,
      aov: Math.round(aov * 100) / 100,
      conversionRate,
      avgRating:
        products.length > 0
          ? Math.round((products.reduce((s, p) => s + p.rating, 0) / products.length) * 10) / 10
          : 0,
    },
    revenueTimeseries,
    revenueByCategory,
    paymentProviders,
    topProducts,
    topVendors,
    trafficSources,
  });
}
