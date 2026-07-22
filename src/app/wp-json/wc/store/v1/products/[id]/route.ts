import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /wc/store/v1/products/:id — single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { category: true },
  });

  if (!product) {
    return NextResponse.json({ code: "woocommerce_rest_product_invalid_id", message: "Invalid product ID" }, { status: 404 });
  }

  return NextResponse.json({
    id: product.id,
    name: product.title,
    slug: product.slug,
    permalink: `https://playbeat.digital/product/${product.slug}`,
    description: product.description || "",
    short_description: product.shortDescription || "",
    prices: {
      price: String(Math.round(product.discountPrice || product.price)),
      regular_price: String(Math.round(product.price)),
      sale_price: product.discountPrice ? String(Math.round(product.discountPrice)) : "",
      currency_code: "PKR",
      currency_symbol: "Rs",
    },
    images: product.cover ? [{ src: product.cover.startsWith("http") ? product.cover : `https://playbeat.digital${product.cover}`, alt: product.title }] : [],
    categories: product.category ? [{ id: product.category.id, name: product.category.name, slug: product.category.slug }] : [],
    add_to_cart: { text: "Buy now", url: `https://playbeat.digital/?product=${product.slug}` },
    is_in_stock: true,
    average_rating: String(product.rating || 0),
    review_count: product.reviewCount || 0,
  });
}
