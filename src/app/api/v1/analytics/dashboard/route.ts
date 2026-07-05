import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { ensureSeeded } from "@/lib/ensure-seed";
import { db } from "@/lib/db";

/**
 * GET /api/v1/analytics/dashboard — platform-wide analytics (admin view)
 *
 * Returns ONLY real data from the database. No dummy/fake values.
 * If the DB is empty, returns zeros — not fabricated numbers.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  try {
    // Fetch all real data from DB
    const [
      orders,
      products,
      users,
      vendors,
      customers,
      reviews,
    ] = await Promise.all([
      db.order.findMany({
        include: {
          items: { include: { product: { include: { category: true } } } },
          payment: true,
        },
      }),
      db.product.findMany({ include: { vendor: true } }),
      db.user.count(),
      db.vendor.findMany(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.review.count(),
    ]);

    // Calculate REAL revenue from orders
    const completedOrders = orders.filter((o) => o.status === "COMPLETED");
    const revenue = completedOrders.reduce((s, o) => s + o.total, 0);
    const liveRevenue = orders.reduce((s, o) => s + o.total, 0);
    const aov = completedOrders.length > 0 ? revenue / completedOrders.length : 0;
    const conversionRate =
      users > 0 ? Math.round((completedOrders.length / users) * 1000) / 10 : 0;

    // Payment success rate (real)
    const paidOrders = orders.filter((o) => o.payment?.status === "COMPLETED").length;
    const paymentSuccessRate = orders.length > 0
      ? Math.round((paidOrders / orders.length) * 1000) / 10
      : 0;

    // Revenue timeseries — last 30 days (real order data, zeros where no orders)
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

    // Top selling products (real)
    const productSales = new Map<string, { title: string; sales: number; revenue: number; vendor: string }>();
    for (const o of orders) {
      for (const it of o.items) {
        const existing = productSales.get(it.productId) ?? {
          title: it.product?.title || "Unknown",
          sales: 0,
          revenue: 0,
          vendor: it.product?.vendor?.storeName ?? "—",
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

    // Payment providers (real)
    const providerMap = new Map<string, number>();
    for (const o of orders) {
      const p = o.payment?.provider ?? "UNKNOWN";
      providerMap.set(p, (providerMap.get(p) ?? 0) + 1);
    }
    const paymentProviders = Array.from(providerMap.entries()).map(([name, value]) => ({ name, value }));

    // Top vendors (real)
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

    // Avg rating (real — from actual products, or 0 if none)
    const avgRating = products.length > 0
      ? Math.round((products.reduce((s, p) => s + p.rating, 0) / products.length) * 10) / 10
      : 0;

    return ok({
      summary: {
        revenue: Math.round(revenue * 100) / 100,
        liveRevenue: Math.round(liveRevenue * 100) / 100,
        orders: orders.length,
        customers, // REAL count — no fallback to "2"
        products: products.length, // REAL DB product count
        dbProducts: products.length,
        vendors: vendors.length,
        reviews,
        aov: Math.round(aov * 100) / 100,
        conversionRate,
        paymentSuccessRate,
        avgRating, // REAL — 0 if no products, not fake "5.0"
      },
      revenueTimeseries,
      topProducts,
      paymentProviders,
      topVendors,
      // No dummy traffic sources — return empty array if no real data
      trafficSources: [],
      demoMode: false,
    });
  } catch (e) {
    console.error("[analytics] DB query failed:", e);
    // Return ALL ZEROS — no fake data
    return ok({
      summary: {
        revenue: 0,
        liveRevenue: 0,
        orders: 0,
        customers: 0,
        products: 0,
        dbProducts: 0,
        vendors: 0,
        reviews: 0,
        aov: 0,
        conversionRate: 0,
        paymentSuccessRate: 0,
        avgRating: 0,
      },
      revenueTimeseries: [],
      topProducts: [],
      paymentProviders: [],
      topVendors: [],
      trafficSources: [],
      demoMode: false,
    });
  }
}
