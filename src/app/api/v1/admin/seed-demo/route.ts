import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/seed-demo
 *
 * Seeds the database with 10 sample products (PKR prices, mix of statuses)
 * and 10 sample orders (mix of PENDING / PAID / COMPLETED / REFUNDED /
 * CANCELLED). Useful for populating the admin dashboard with realistic data
 * on a fresh install.
 *
 * Returns: { products: number, orders: number }
 */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SAMPLE_PRODUCTS: Array<{
  title: string;
  type: string;
  price: number;
  discountPrice?: number;
  shortDescription: string;
  description: string;
  tags: string[];
  status: "PUBLISHED" | "PENDING" | "DRAFT";
  featured?: boolean;
  stock?: number;
  licenseType?: string;
}> = [
  {
    title: "Netflix Premium 1 Month",
    type: "SAAS_SUBSCRIPTION",
    price: 1500,
    discountPrice: 1200,
    shortDescription: "4K UHD Netflix account — single screen, 30 days.",
    description:
      "Premium Netflix subscription with 4K UHD streaming. Single screen, valid for 30 days from activation. Delivered instantly to your email.",
    tags: ["netflix", "streaming", "premium"],
    status: "PUBLISHED",
    featured: true,
    stock: 50,
    licenseType: "DIGITAL",
  },
  {
    title: "Spotify Premium 3 Months",
    type: "SAAS_SUBSCRIPTION",
    price: 1200,
    shortDescription: "Spotify Premium individual account, 90 days.",
    description:
      "Ad-free music streaming with offline downloads. Valid for 3 months. Activated within 24 hours of purchase.",
    tags: ["spotify", "music", "premium"],
    status: "PUBLISHED",
    stock: 75,
    licenseType: "DIGITAL",
  },
  {
    title: "ChatGPT Plus 1 Month",
    type: "AI_TOOL",
    price: 3500,
    discountPrice: 3200,
    shortDescription: "OpenAI ChatGPT Plus account access, 30 days.",
    description:
      "ChatGPT Plus subscription with GPT-4 access, faster response times, and priority access to new features. 30 days of premium access.",
    tags: ["chatgpt", "openai", "ai"],
    status: "PUBLISHED",
    featured: true,
    stock: 30,
    licenseType: "DIGITAL",
  },
  {
    title: "YouTube Premium Family 1 Month",
    type: "SAAS_SUBSCRIPTION",
    price: 2000,
    shortDescription: "YouTube Premium family plan, 30 days.",
    description:
      "Ad-free YouTube, background play, and YouTube Music Premium for up to 5 family members. 30 days.",
    tags: ["youtube", "premium", "family"],
    status: "PUBLISHED",
    stock: 25,
    licenseType: "DIGITAL",
  },
  {
    title: "Amazon Prime Video 1 Month",
    type: "SAAS_SUBSCRIPTION",
    price: 1300,
    shortDescription: "Prime Video subscription, 30 days.",
    description:
      "Stream thousands of movies and Amazon Originals. 30-day single-account access.",
    tags: ["amazon", "prime", "streaming"],
    status: "PUBLISHED",
    stock: 40,
    licenseType: "DIGITAL",
  },
  {
    title: "Disney+ Hotstar Premium 1 Month",
    type: "SAAS_SUBSCRIPTION",
    price: 1800,
    shortDescription: "Disney+ Hotstar Premium, 30 days.",
    description:
      "Premium Disney+ Hotstar subscription with live sports, movies, and Disney+ originals. 30 days.",
    tags: ["disney", "hotstar", "streaming"],
    status: "PENDING",
    stock: 20,
    licenseType: "DIGITAL",
  },
  {
    title: "Microsoft Office 365 1 Year",
    type: "SOFTWARE_LICENSE",
    price: 12000,
    discountPrice: 9999,
    shortDescription: "Office 365 Personal, 12-month subscription.",
    description:
      "Microsoft Office 365 Personal — Word, Excel, PowerPoint, Outlook, OneDrive 1TB. 12-month subscription for 1 user.",
    tags: ["microsoft", "office", "productivity"],
    status: "PUBLISHED",
    featured: true,
    stock: 15,
    licenseType: "LICENSE_KEY",
  },
  {
    title: "Adobe Creative Cloud 1 Month",
    type: "SOFTWARE_LICENSE",
    price: 8500,
    shortDescription: "Adobe CC All Apps plan, 30 days.",
    description:
      "Full Adobe Creative Cloud suite — Photoshop, Illustrator, Premiere Pro, After Effects, and 20+ other apps. 30 days.",
    tags: ["adobe", "creative", "design"],
    status: "PENDING",
    stock: 10,
    licenseType: "LICENSE_KEY",
  },
  {
    title: "Canva Pro 1 Year",
    type: "SAAS_SUBSCRIPTION",
    price: 5500,
    discountPrice: 4500,
    shortDescription: "Canva Pro individual, 12 months.",
    description:
      "Canva Pro with 100+ million premium assets, background remover, magic resize, and brand kit. 12 months.",
    tags: ["canva", "design", "pro"],
    status: "PUBLISHED",
    stock: 60,
    licenseType: "DIGITAL",
  },
  {
    title: "Apple Music 3 Months",
    type: "SAAS_SUBSCRIPTION",
    price: 1100,
    shortDescription: "Apple Music individual, 90 days.",
    description:
      "Apple Music subscription with 100+ million songs, ad-free. 3-month individual plan.",
    tags: ["apple", "music", "streaming"],
    status: "DRAFT",
    stock: 0,
    licenseType: "DIGITAL",
  },
];

const SAMPLE_ORDERS: Array<{
  customerName: string;
  customerEmail: string;
  status: "PENDING" | "PAID" | "COMPLETED" | "REFUNDED" | "CANCELLED";
  provider?: "STRIPE" | "PAYPAL" | "LEMON_SQUEEZY" | "JAZZCASH" | "EASYPAISA";
  productIndexes: number[];
}> = [
  {
    customerName: "Ahmed Raza",
    customerEmail: "ahmed.raza@example.com",
    status: "COMPLETED",
    provider: "JAZZCASH",
    productIndexes: [0, 2],
  },
  {
    customerName: "Sara Khan",
    customerEmail: "sara.khan@example.com",
    status: "COMPLETED",
    provider: "EASYPAISA",
    productIndexes: [1, 8],
  },
  {
    customerName: "Bilal Hussain",
    customerEmail: "bilal.hussain@example.com",
    status: "PAID",
    provider: "STRIPE",
    productIndexes: [6],
  },
  {
    customerName: "Fatima Ali",
    customerEmail: "fatima.ali@example.com",
    status: "PENDING",
    productIndexes: [3, 4],
  },
  {
    customerName: "Usman Tariq",
    customerEmail: "usman.tariq@example.com",
    status: "COMPLETED",
    provider: "PAYPAL",
    productIndexes: [2],
  },
  {
    customerName: "Ayesha Siddiqui",
    customerEmail: "ayesha.s@example.com",
    status: "REFUNDED",
    provider: "STRIPE",
    productIndexes: [7],
  },
  {
    customerName: "Hamza Sheikh",
    customerEmail: "hamza.sheikh@example.com",
    status: "CANCELLED",
    productIndexes: [5],
  },
  {
    customerName: "Zainab Malik",
    customerEmail: "zainab.malik@example.com",
    status: "COMPLETED",
    provider: "JAZZCASH",
    productIndexes: [8, 1],
  },
  {
    customerName: "Imran Qureshi",
    customerEmail: "imran.q@example.com",
    status: "PENDING",
    productIndexes: [0],
  },
  {
    customerName: "Maryam Iqbal",
    customerEmail: "maryam.iqbal@example.com",
    status: "PAID",
    provider: "LEMON_SQUEEZY",
    productIndexes: [6, 9],
  },
];

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 5);
  if (limited) return limited;

  try {
    const stamp = Date.now().toString(36);

    // ----- 1. Create products -----
    const createdProducts: Array<{
      id: string;
      price: number;
      currency: string;
      title: string;
    }> = [];

    for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
      const p = SAMPLE_PRODUCTS[i];
      const baseSlug = `${slugify(p.title)}-${stamp}`;
      const sku = `SEED-${stamp}-${i + 1}`;
      const cover = JSON.stringify({
        type: "gradient",
        colors: ["#3b82f6", "#8b5cf6"],
        icon: "Package",
        seed: baseSlug,
      });
      try {
        const created = await db.product.create({
          data: {
            title: p.title,
            slug: baseSlug,
            shortDescription: p.shortDescription,
            description: p.description,
            type: p.type,
            status: p.status,
            price: p.price,
            discountPrice: p.discountPrice ?? null,
            currency: "PKR",
            sku,
            stock: p.stock ?? 0,
            tags: JSON.stringify(p.tags),
            licenseType: p.licenseType ?? "",
            downloadFile: "",
            version: "1.0.0",
            cover,
            images: JSON.stringify([]),
            featured: p.featured ?? false,
            seoTitle: p.title,
            seoDescription: p.shortDescription,
          },
        });
        createdProducts.push({
          id: created.id,
          price: created.price,
          currency: created.currency,
          title: created.title,
        });
      } catch (e) {
        console.error("[seed-demo] product create failed:", p.title, e);
      }
    }

    // ----- 2. Create orders (with items + payments where applicable) -----
    let orderCount = 0;
    for (let i = 0; i < SAMPLE_ORDERS.length; i++) {
      const o = SAMPLE_ORDERS[i];
      const validItems = o.productIndexes
        .map((idx) => createdProducts[idx])
        .filter(Boolean);
      if (validItems.length === 0) continue;

      const subtotal = validItems.reduce((s, p) => s + p.price, 0);
      const total = subtotal;
      const orderNumber = `ORD-${stamp.toUpperCase()}-${(i + 1)
        .toString()
        .padStart(3, "0")}`;

      try {
        const order = await db.order.create({
          data: {
            orderNumber,
            status: o.status,
            subtotal,
            discount: 0,
            total,
            currency: "PKR",
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            items: {
              create: validItems.map((p) => ({
                productId: p.id,
                price: p.price,
                licenseKey:
                  o.status === "COMPLETED" || o.status === "PAID"
                    ? `LIC-${stamp}-${p.id.slice(-6)}`
                    : null,
              })),
            },
          },
        });

        // Payment row for paid / completed / refunded orders
        if (o.provider) {
          const paymentStatus =
            o.status === "COMPLETED" || o.status === "PAID"
              ? "COMPLETED"
              : o.status === "REFUNDED"
                ? "REFUNDED"
                : o.status === "CANCELLED"
                  ? "FAILED"
                  : "PENDING";
          await db.payment.create({
            data: {
              orderId: order.id,
              provider: o.provider,
              amount: total,
              currency: "PKR",
              status: paymentStatus,
              transactionId: `TXN-${stamp}-${i + 1}`,
            },
          });
        }

        orderCount++;
      } catch (e) {
        console.error("[seed-demo] order create failed:", o.customerName, e);
      }
    }

    return ok({
      products: createdProducts.length,
      orders: orderCount,
      message: `Seeded ${createdProducts.length} products and ${orderCount} orders`,
    });
  } catch (e) {
    console.error("[seed-demo] error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to seed demo data",
      500,
    );
  }
}
