import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";

/**
 * GET /api/v1/lemon-squeezy/products
 *
 * Lists the real products from your Lemon Squeezy store. When
 * LEMONSQUEEZY_API_KEY + LEMONSQUEEZY_STORE_ID are configured, this fetches
 * the live catalog from the Lemon Squeezy API. The storefront uses this list
 * to decide which products to display — only products listed in Lemon Squeezy
 * appear on the storefront.
 *
 * If the key is not configured, returns an empty list (so the storefront can
 * show a "connect Lemon Squeezy" state instead of random products).
 */

interface LSProduct {
  id: string;
  type: "products";
  attributes: {
    name: string;
    slug?: string;
    description?: string;
    status?: string;
    thumb_url?: string | null;
    sort_price?: number | null;
    variants_count?: number;
  };
}

interface LSResponse {
  data: LSProduct[];
  meta?: { page?: { total?: number } };
  errors?: Array<{ detail?: string }>;
}

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    return ok({
      configured: false,
      items: [],
      message:
        "Lemon Squeezy is not connected. Set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID to list only products from your store.",
    });
  }

  try {
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/products?filter[store_id]=${storeId}&per_page=100`,
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
      return error(
        `Lemon Squeezy API error: ${json.errors?.[0]?.detail ?? res.statusText}`,
        502,
      );
    }

    const items = (json.data || []).map((p) => ({
      id: p.id,
      name: p.attributes.name,
      slug: p.attributes.slug ?? null,
      description: p.attributes.description ?? null,
      status: p.attributes.status ?? "published",
      thumbnail: p.attributes.thumb_url ?? null,
      price: p.attributes.sort_price ?? null,
      variants: p.attributes.variants_count ?? 0,
    }));

    return ok({
      configured: true,
      items,
      total: items.length,
    });
  } catch (e) {
    console.error("[ls-products] error:", e);
    return error("Failed to fetch Lemon Squeezy products", 503, String(e));
  }
}
