import { db } from "@/lib/db";

/**
 * Lemon Squeezy product sync.
 *
 * The storefront shows ONLY products listed in your Lemon Squeezy store.
 * We fetch the live catalog from the LS API and map each product to the
 * storefront shape, using the real product image, price, and checkout URL.
 */

interface LSAttribute {
  name: string;
  slug?: string;
  description?: string | null;
  status?: string;
  thumb_url?: string | null;
  large_thumb_url?: string | null;
  price?: number | null;
  price_formatted?: string | null;
  buy_now_url?: string | null;
  test_mode?: boolean;
  from_price?: number | null;
  to_price?: number | null;
  store_id?: number;
}

interface LSProduct {
  id: string;
  type: "products";
  attributes: LSAttribute;
}

interface LSResponse {
  data: LSProduct[];
  meta?: { page?: { total?: number } };
  errors?: Array<{ detail?: string }>;
}

export interface StorefrontProduct {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  type: string;
  status: string;
  price: number;
  discountPrice: number | null;
  currency: string;
  sku: string;
  stock: number | null;
  cover: {
    type: "gradient" | "image";
    colors?: [string, string];
    icon?: string;
    seed?: string;
    image?: string;
  };
  tags: string[];
  licenseType: string | null;
  downloadFile: string | null;
  fileSize: string | null;
  version: string | null;
  changelog: any[];
  featured: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    verified: boolean;
    rating: number;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  effectivePrice: number;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
  buyNowUrl?: string | null;
  priceFormatted?: string | null;
}

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

// Fallback gradient for LS products without an image
const LS_GRADIENT: [string, string] = ["#0ea5e9", "#0369a1"];

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLemonSqueezyConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID,
  );
}

/**
 * Fetch the real product catalog from Lemon Squeezy and map to the storefront
 * shape. Returns [] when LS is not configured.
 */
export async function getLemonSqueezyProducts(): Promise<{
  configured: boolean;
  items: StorefrontProduct[];
}> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    return { configured: false, items: [] };
  }

  try {
    const url = new URL(`${LS_API_BASE}/products`);
    url.searchParams.set("filter[store_id]", storeId);
    url.searchParams.set("per_page", "100");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
      next: { revalidate: 60 },
    });

    const json: LSResponse = await res.json();
    if (!res.ok) {
      console.error(
        "[ls-products] API error:",
        json.errors?.[0]?.detail ?? res.statusText,
      );
      return { configured: true, items: [] };
    }

    // Detect the store currency (LS prices are in the store's default currency)
    // Store 420060 = PKR. We use the price_formatted hint to detect currency.
    const items: StorefrontProduct[] = (json.data || []).map((p) => {
      const attrs = p.attributes;
      const rawPrice = attrs.price ?? 0;
      // LS prices are in cents
      const price = rawPrice / 100;
      const slug = attrs.slug || attrs.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const description = attrs.description ? stripHtml(attrs.description) : attrs.name;
      const image = attrs.large_thumb_url || attrs.thumb_url || null;
      const isSubscription = !!attrs.price_formatted?.includes("/");
      // Detect currency from price_formatted (e.g. "PKR480/month")
      const currency = attrs.price_formatted?.startsWith("PKR") ? "PKR" : "USD";

      return {
        id: `ls_${p.id}`,
        title: attrs.name,
        slug,
        shortDescription: description.slice(0, 140) || null,
        description,
        type: isSubscription ? "SAAS_SUBSCRIPTION" : "DIGITAL_DOWNLOAD",
        status: attrs.status === "published" ? "PUBLISHED" : "DRAFT",
        price,
        discountPrice: null,
        currency,
        sku: `LS-${p.id}`,
        stock: null,
        cover: image
          ? { type: "image", image }
          : { type: "gradient", colors: LS_GRADIENT, icon: "CreditCard", seed: slug },
        tags: ["lemon-squeezy"],
        licenseType: isSubscription ? "Subscription" : "Digital product",
        downloadFile: null,
        fileSize: null,
        version: null,
        changelog: [],
        featured: true,
        rating: 5,
        reviewCount: 0,
        salesCount: 0,
        vendor: {
          id: "lemon-squeezy",
          storeName: "Playbeat Digital",
          slug: "playbeat-digital",
          verified: true,
          rating: 5,
        },
        category: null,
        effectivePrice: price,
        discountPercent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        buyNowUrl: attrs.buy_now_url ?? null,
        priceFormatted: attrs.price_formatted ?? null,
      };
    });

    return { configured: true, items };
  } catch (e) {
    console.error("[ls-products] fetch error:", e);
    return { configured: true, items: [] };
  }
}
