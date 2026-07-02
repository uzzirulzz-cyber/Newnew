import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit, validate, v } from "@/lib/api";
import {
  getCurrentUser,
  generateOrderNumber,
  generateLicenseKey,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

// GET /api/v1/orders  — current user's order history
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const user = await getCurrentUser(request);
  if (!user) return error("Not authenticated", 401);

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      payment: true,
    },
  });

  return ok({
    items: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      subtotal: o.subtotal,
      discount: o.discount,
      total: o.total,
      couponCode: o.couponCode,
      createdAt: o.createdAt,
      provider: o.payment?.provider,
      paymentStatus: o.payment?.status,
      items: o.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        title: it.product.title,
        price: it.price,
        licenseKey: it.licenseKey,
      })),
    })),
  });
}

// POST /api/v1/orders  — instant checkout (mock payment)
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;
  await ensureSeeded();

  const body = await request.json().catch(() => ({}));
  const result = validate<{
    items: { productId: string; price: number }[];
    customerName: string;
    customerEmail: string;
    couponCode?: string;
    provider?: string;
    affiliateCode?: string;
  }>(body, {
    items: (val) =>
      Array.isArray(val) && val.length > 0 ? null : "Cart must contain at least one item",
    customerName: v.required("Customer name"),
    customerEmail: v.email(),
    provider: (val) =>
      !val || ["STRIPE", "PAYPAL", "LEMON_SQUEEZY", "PADDLE", "CRYPTO"].includes(val as string)
        ? null
        : "Invalid payment provider",
  });
  if (!result.valid) return error("Validation failed", 422, result.errors);

  const user = await getCurrentUser(request);
  const { items, customerName, customerEmail, couponCode, provider, affiliateCode } =
    result.data;

  // verify products + compute subtotal
  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== items.length) return error("One or more products not found", 404);

  const subtotal = products.reduce((sum, p) => sum + (p.discountPrice ?? p.price), 0);

  // coupon
  let discount = 0;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
    if (coupon && coupon.active && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      if (subtotal >= coupon.minPurchase) {
        if (coupon.type === "PERCENTAGE") discount = (subtotal * coupon.value) / 100;
        else if (coupon.type === "FIXED") discount = Math.min(coupon.value, subtotal);
        discount = Math.round(discount * 100) / 100;
        appliedCoupon = coupon.code;
        await db.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  }
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  const paymentProvider = provider || "STRIPE";
  const order = await db.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: user?.id ?? null,
      status: total === 0 ? "COMPLETED" : "COMPLETED",
      subtotal,
      discount,
      total,
      currency: "USD",
      couponCode: appliedCoupon,
      customerName,
      customerEmail,
      affiliateCode: affiliateCode ?? null,
      items: {
        create: products.map((p) => ({
          productId: p.id,
          price: p.discountPrice ?? p.price,
          licenseKey: generateLicenseKey(),
        })),
      },
      payment: {
        create: {
          provider: paymentProvider,
          amount: total,
          currency: "USD",
          status: "COMPLETED",
          transactionId: "txn_" + Math.random().toString(36).slice(2, 12),
        },
      },
    },
    include: { items: { include: { product: true } }, payment: true },
  });

  // increment sales + vendor stats
  for (const p of products) {
    await db.product.update({
      where: { id: p.id },
      data: { salesCount: { increment: 1 } },
    });
    if (p.vendorId) {
      await db.vendor.update({
        where: { id: p.vendorId },
        data: {
          totalSales: { increment: 1 },
          totalRevenue: { increment: p.discountPrice ?? p.price },
        },
      });
    }
  }

  // affiliate attribution
  if (affiliateCode) {
    const affiliate = await db.affiliate.findUnique({ where: { code: affiliateCode } });
    if (affiliate) {
      const commission = Math.round(total * (affiliate.commissionRate / 100) * 100) / 100;
      await db.affiliate.update({
        where: { id: affiliate.id },
        data: {
          totalConversions: { increment: 1 },
          totalEarnings: { increment: commission },
          balance: { increment: commission },
        },
      });
    }
  }

  // create download records
  for (const it of order.items) {
    if (it.product.downloadFile) {
      await db.download.create({
        data: {
          orderId: order.id,
          productId: it.productId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
        },
      });
    }
  }

  return ok(
    {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal,
        discount,
        total,
        couponCode: order.couponCode,
        createdAt: order.createdAt,
        provider: order.payment?.provider,
        items: order.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          title: it.product.title,
          price: it.price,
          licenseKey: it.licenseKey,
        })),
      },
      message: "Order completed. License keys and downloads are ready.",
    },
    201,
  );
}
