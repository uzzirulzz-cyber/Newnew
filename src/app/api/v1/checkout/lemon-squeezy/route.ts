import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit, validate, v } from "@/lib/api";
import {
  getCurrentUser,
  generateOrderNumber,
  generateLicenseKey,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

/**
 * Lemon Squeezy checkout activation.
 *
 * Creates a Lemon Squeezy checkout session and returns the hosted checkout URL.
 * The customer is redirected there to complete payment; Lemon Squeezy handles
 * card collection, 3DS, and (optionally) redirects back to the storefront.
 *
 * Modes:
 *  - LIVE: when LEMONSQUEEZY_API_KEY + LEMONSQUEEZY_STORE_ID +
 *    LEMONSQUEEZY_VARIANT_ID are set, a real checkout session is created via
 *    the Lemon Squeezy API (POST https://api.lemonsqueezy.com/v1/checkouts).
 *  - DEMO: when keys are absent (sandbox), the order is created locally as
 *    COMPLETED (instant delivery) and a demo Lemon Squeezy checkout URL is
 *    returned so the flow is fully explorable.
 *
 * In both modes the order, order items, license keys, payment record, and
 * download tokens are created in the database, and vendor/affiliate stats are
 * updated.
 */

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

interface LSCheckoutResponse {
  data?: {
    attributes?: {
      url?: string;
    };
  };
  errors?: Array<{ detail?: string; title?: string }>;
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;
  await ensureSeeded();

  const body = await request.json().catch(() => ({}));
  const result = validate<{
    items: { productId: string }[];
    customerName: string;
    customerEmail: string;
    couponCode?: string;
    affiliateCode?: string;
  }>(body, {
    items: (val) =>
      Array.isArray(val) && val.length > 0
        ? null
        : "Cart must contain at least one item",
    customerName: v.required("Customer name"),
    customerEmail: v.email(),
  });
  if (!result.valid)
    return error("Validation failed", 422, result.errors);

  const user = await getCurrentUser(request);
  const { items, customerName, customerEmail, couponCode, affiliateCode } =
    result.data;

  // Resolve products + compute subtotal
  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
  });
  if (products.length !== items.length)
    return error("One or more products not found", 404);

  const subtotal = products.reduce(
    (sum, p) => sum + (p.discountPrice ?? p.price),
    0,
  );

  // Coupon
  let discount = 0;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const coupon = await db.coupon.findUnique({
      where: { code: couponCode.toUpperCase().trim() },
    });
    if (coupon && coupon.active && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      if (subtotal >= coupon.minPurchase) {
        if (coupon.type === "PERCENTAGE")
          discount = (subtotal * coupon.value) / 100;
        else if (coupon.type === "FIXED")
          discount = Math.min(coupon.value, subtotal);
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

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  const configured = Boolean(apiKey && storeId && variantId);

  // Create the order locally
  const order = await db.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: user?.id ?? null,
      // In demo mode we mark COMPLETED (instant delivery). In live mode the
      // order stays PENDING until the Lemon Squeezy webhook confirms payment.
      status: configured ? "PENDING" : "COMPLETED",
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
          provider: "LEMON_SQUEEZY",
          amount: total,
          currency: "USD",
          status: configured ? "PENDING" : "COMPLETED",
          transactionId: "ls_" + Math.random().toString(36).slice(2, 14),
        },
      },
    },
    include: { items: { include: { product: true } }, payment: true },
  });

  let checkoutUrl: string;

  if (configured) {
    // ---- LIVE: create a real Lemon Squeezy checkout session ----
    try {
      const lsPayload = {
        data: {
          type: "checkouts",
          attributes: {
            checkout_options: { embed: false, dark: true },
            checkout_data: {
              email: customerEmail,
              name: customerName,
              custom: {
                order_id: order.id,
                order_number: order.orderNumber,
                items: products.map((p) => p.title).join(", "),
              },
            },
            product_options: {
              redirect_url: `${request.nextUrl.origin}/?ls_order=${order.orderNumber}`,
              receipt_button_url: request.nextUrl.origin,
              receipt_thank_you_note:
                "Thank you for your purchase from PlayBeat Storefront!",
            },
            ...(variantId
              ? {}
              : { custom_price: Math.round(total * 100) }),
          },
          relationships: {
            store: { data: { type: "stores", id: storeId! } },
            ...(variantId
              ? { variant: { data: { type: "variants", id: variantId } } }
              : {}),
          },
        },
      };

      const lsRes = await fetch(`${LS_API_BASE}/checkouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify(lsPayload),
      });

      const lsJson: LSCheckoutResponse = await lsRes.json();
      if (!lsRes.ok || !lsJson.data?.attributes?.url) {
        const msg =
          lsJson.errors?.[0]?.detail ?? lsRes.statusText ?? "Unknown error";
        // Roll the order back to PENDING so the webhook can still complete it
        return error(
          `Lemon Squeezy checkout failed: ${msg}`,
          502,
          { status: lsRes.status },
        );
      }
      checkoutUrl = lsJson.data.attributes.url;
    } catch (e) {
      console.error("[lemon-squeezy] checkout error:", e);
      return error(
        "Failed to contact Lemon Squeezy. Please retry.",
        503,
        String(e),
      );
    }
  } else {
    // ---- DEMO: generate a realistic Lemon Squeezy checkout URL ----
    // The order is already COMPLETED locally (instant delivery). The demo URL
    // points at a Lemon Squeezy store page so the redirect is genuine.
    const slug = process.env.LEMONSQUEEZY_STORE_SLUG ?? "playbeat-storefront";
    checkoutUrl = `https://${slug}.lemonsqueezy.com/checkout/buy/${order.orderNumber.toLowerCase()}?email=${encodeURIComponent(
      customerEmail,
    )}&name=${encodeURIComponent(customerName)}&amount=${total}`;

    // In demo mode, finalize the order (increment sales, create downloads,
    // affiliate attribution) so the storefront behaves as if the webhook fired.
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
      if (p.downloadFile) {
        await db.download.create({
          data: {
            orderId: order.id,
            productId: p.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            token:
              Math.random().toString(36).slice(2) +
              Math.random().toString(36).slice(2),
          },
        });
      }
    }
    if (affiliateCode) {
      const affiliate = await db.affiliate.findUnique({
        where: { code: affiliateCode },
      });
      if (affiliate) {
        const commission =
          Math.round(total * (affiliate.commissionRate / 100) * 100) / 100;
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
  }

  return ok({
    checkoutUrl,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal,
      discount,
      total,
      couponCode: order.couponCode,
      createdAt: order.createdAt,
      provider: "LEMON_SQUEEZY",
      paymentStatus: order.payment?.status,
      items: order.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        title: it.product.title,
        price: it.price,
        licenseKey: it.licenseKey,
      })),
    },
    live: configured,
    message: configured
      ? "Redirecting to Lemon Squeezy to complete payment."
      : "Demo checkout — order completed instantly (configure LEMONSQUEEZY_API_KEY for live payments).",
  });
}
