import { db } from "@/lib/db";

/**
 * Lemon Squeezy product sync.
 *
 * The storefront shows ONLY products listed in your Lemon Squeezy store.
 * When LEMONSQUEEZY_API_KEY + LEMONSQUEEZY_STORE_ID are configured, we fetch
 * the live catalog from the LS API and map each product to the storefront
 * shape. When the key is not set, we return an empty list (the UI shows a
 * "connect Lemon Squeezy" state).
 *
 * No random/seeded products are shown — only what you have listed in Lemon
 * Squeezy.
 */

interface LSAttribute {
  name: string;
  slug?: string;
  description?: string | null;
  status?: string;
  thumb_url?: string | null;
  sort_price?: number | null;
  variants_count?: number;
  test_mode?: boolean;
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
    type: "gradient";
    colors: [string, string];
    icon: string;
    seed: string;
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
}

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

// Fallback gradient + icon for LS products (we don't have per-product art yet)
const LS_GRADIENT: [string, string] = ["#0ea5e9", "#0369a1"];

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
    const res = await fetch(
      `${LS_API_BASE}/products?filter[store_id]=${storeId}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.api+json",
        },
        next: { revalidate: 60 },
      },
    );

    const json: LSResponse = await res.json();
    if (!res.ok) {
      console.error(
        "[ls-products] API error:",
        json.errors?.[0]?.detail ?? res.statusText,
      );
      return { configured: true, items: [] };
    }

    // Find a "Lemon Squeezy" vendor if one exists, else leave vendor null
    const lsVendor = await db.vendor.findFirst({
      where: { storeName: { contains: "Lemon" } },
    });

    const items: StorefrontProduct[] = (json.data || []).map((p) => {
      const attrs = p.attributes;
      const price = attrs.sort_price ? attrs.sort_price / 100 : 0;
      const slug = attrs.slug || attrs.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return {
        id: `ls_${p.id}`,
        title: attrs.name,
        slug,
        shortDescription: attrs.description
          ? attrs.description.slice(0, 120)
          : null,
        description: attrs.description ?? attrs.name,
        type: "DIGITAL_DOWNLOAD",
        status: attrs.status === "published" ? "PUBLISHED" : "DRAFT",
        price,
        discountPrice: null,
        currency: "USD",
        sku: `LS-${p.id}`,
        stock: null,
        cover: {
          type: "gradient",
          colors: LS_GRADIENT,
          icon: "CreditCard",
          seed: slug,
        },
        tags: ["lemon-squeezy"],
        licenseType: "Lemon Squeezy license",
        downloadFile: null,
        fileSize: null,
        version: null,
        changelog: [],
        featured: false,
        rating: 5,
        reviewCount: 0,
        salesCount: 0,
        vendor: lsVendor
          ? {
              id: lsVendor.id,
              storeName: lsVendor.storeName,
              slug: lsVendor.slug,
              verified: lsVendor.verified,
              rating: lsVendor.rating,
            }
          : {
              id: "lemon-squeezy",
              storeName: "Lemon Squeezy",
              slug: "lemon-squeezy",
              verified: true,
              rating: 5,
            },
        category: null,
        effectivePrice: price,
        discountPercent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    return { configured: true, items };
  } catch (e) {
    console.error("[ls-products] fetch error:", e);
    return { configured: true, items: [] };
  }
}
