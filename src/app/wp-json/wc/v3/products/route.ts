import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /wp-json/wc/v3/products
 *
 * Returns PlayBeat products in WooCommerce REST API v3 format.
 * Any WooCommerce client can consume this.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const perPage = Math.min(Number(searchParams.get("per_page") || 50), 100);
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  const products = await db.product.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true },
    take: perPage,
    skip: (page - 1) * perPage,
    orderBy: { salesCount: "desc" },
  });

  // Format as WooCommerce v3 products
  const wcProducts = products.map((p) => ({
    id: p.id,
    name: p.title,
    slug: p.slug,
    permalink: `https://playbeat.digital/product/${p.slug}`,
    date_created: p.createdAt.toISOString(),
    date_modified: p.updatedAt.toISOString(),
    type: "simple",
    status: "publish",
    featured: p.featured,
    catalog_visibility: "visible",
    description: p.description || "",
    short_description: p.shortDescription || "",
    sku: p.sku || "",
    price: String(p.discountPrice || p.price),
    regular_price: String(p.price),
    sale_price: p.discountPrice ? String(p.discountPrice) : "",
    on_sale: !!p.discountPrice,
    total_sales: p.salesCount || 0,
    virtual: true,
    downloadable: true,
    categories: p.category ? [{
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
    }] : [],
    images: p.cover ? [{ src: p.cover.startsWith("http") ? p.cover : `https://playbeat.digital${p.cover}` }] : [],
    tags: [],
    stock_status: "instock",
    stock_quantity: p.stock || null,
    rating: p.rating || 0,
    rating_count: p.reviewCount || 0,
    meta_data: [
      { key: "_playbeat_type", value: p.type },
      { key: "_playbeat_license_type", value: p.licenseType || "" },
    ],
  }));

  // Set WooCommerce-compatible headers
  const response = NextResponse.json(wcProducts);
  response.headers.set("X-WP-Total", String(products.length));
  response.headers.set("X-WP-TotalPages", "1");
  response.headers.set("X-WC-Version", "3.0.0");
  return response;
}

/**
 * POST /wp-json/wc/v3/products
 * Create a product (WooCommerce compatible)
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const product = await db.product.create({
    data: {
      title: body.name || "Untitled",
      slug: (body.slug || body.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
      sku: body.sku || `SKU-${Date.now().toString(36)}`,
      description: body.description || "",
      shortDescription: body.short_description || "",
      type: body.meta_data?.find((m: any) => m.key === "_playbeat_type")?.value || "DIGITAL_DOWNLOAD",
      status: "PUBLISHED",
      price: Number(body.regular_price || 0),
      discountPrice: body.sale_price ? Number(body.sale_price) : null,
      currency: "PKR",
      cover: body.images?.[0]?.src || null,
      images: JSON.stringify(body.images?.map((i: any) => i.src) || []),
      tags: JSON.stringify(body.tags?.map((t: any) => t.name) || []),
      featured: body.featured || false,
      stock: body.stock_quantity ? Number(body.stock_quantity) : 100,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
    },
  });

  return NextResponse.json({
    id: product.id,
    name: product.title,
    slug: product.slug,
    permalink: `https://playbeat.digital/product/${product.slug}`,
    price: String(product.discountPrice || product.price),
    regular_price: String(product.price),
    status: "publish",
  }, { status: 201 });
}
