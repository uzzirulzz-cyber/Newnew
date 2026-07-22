import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /wp-json/wc/store/v1/products
 * Public Store API — returns products in WooCommerce Store API format.
 * No authentication required.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const perPage = Math.min(Number(searchParams.get("per_page") || 50), 100);

  const products = await db.product.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true },
    take: perPage,
    orderBy: { salesCount: "desc" },
  });

  const storeProducts = products.map((p) => ({
    id: p.id,
    name: p.title,
    slug: p.slug,
    permalink: `https://playbeat.digital/product/${p.slug}`,
    description: p.description || "",
    short_description: p.shortDescription || "",
    prices: {
      price: String(Math.round(p.discountPrice || p.price)),
      regular_price: String(Math.round(p.price)),
      sale_price: p.discountPrice ? String(Math.round(p.discountPrice)) : "",
      price_range: null,
      currency_code: "PKR",
      currency_symbol: "Rs",
    },
    images: p.cover ? [{ src: p.cover.startsWith("http") ? p.cover : `https://playbeat.digital${p.cover}`, alt: p.title }] : [],
    categories: p.category ? [{ id: p.category.id, name: p.category.name, slug: p.category.slug }] : [],
    tags: [],
    add_to_cart: {
      text: "Buy now",
      url: `https://playbeat.digital/?product=${p.slug}`,
    },
    is_in_stock: true,
    is_on_sale: !!p.discountPrice,
    average_rating: String(p.rating || 0),
    review_count: p.reviewCount || 0,
  }));

  return NextResponse.json(storeProducts);
}
