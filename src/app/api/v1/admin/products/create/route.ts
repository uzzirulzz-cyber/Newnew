import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/products/create
 *
 * Creates a new product in the database.
 *
 * Body: {
 *   title: string,
 *   shortDescription?: string,
 *   description?: string,
 *   type: "SAAS_SUBSCRIPTION" | "DIGITAL_DOWNLOAD" | "GIFT_CARD" | "AI_TOOL" | "TEMPLATE" | "EBOOK" | "GRAPHIC" | "COURSE" | "GAME" | "PAYMENT_GATEWAY" | "AFFILIATE_OFFER" | "MEMBERSHIP",
 *   price: number,           // PKR
 *   discountPrice?: number,  // PKR (optional sale price)
 *   categorySlug?: string,   // e.g. "games", "ai-tools"
 *   vendorId?: string,
 *   sku?: string,
 *   stock?: number,
 *   tags?: string[],         // JSON-serialized in DB
 *   licenseType?: string,
 *   downloadFile?: string,   // URL or base64
 *   fileSize?: number,
 *   version?: string,
 *   cover?: string,          // JSON { type, colors, icon, seed } or image URL
 *   images?: string[],       // JSON-serialized array of URLs
 *   variants?: string,       // JSON-stringified array of variant options e.g. ["1 Month","3 Months"]
 *   featured?: boolean,
 *   seoTitle?: string,
 *   seoDescription?: string,
 * }
 */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const {
    title, shortDescription, description, type, price, discountPrice,
    categorySlug, vendorId, sku, stock, tags, licenseType, downloadFile,
    fileSize, version, cover, images, variants, featured, seoTitle, seoDescription,
  } = body;

  if (!title) return error("Product title is required", 422);
  if (!type) return error("Product type is required", 422);
  if (price === undefined || price < 0) return error("A valid price is required", 422);

  try {
    // Resolve category by slug
    let categoryId: string | null = null;
    if (categorySlug) {
      const cat = await db.category.findUnique({ where: { slug: categorySlug } });
      if (cat) categoryId = cat.id;
    }

    // Generate unique slug
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 1;
    while (await db.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const product = await db.product.create({
      data: {
        title: String(title).slice(0, 200),
        slug,
        shortDescription: shortDescription || "",
        description: description || "",
        type: String(type),
        status: "PUBLISHED",
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        currency: "PKR",
        sku: sku || `SKU-${Date.now()}`,
        stock: stock ?? 0,
        tags: JSON.stringify(tags || []),
        licenseType: licenseType || "",
        downloadFile: downloadFile || "",
        fileSize: fileSize ? String(fileSize) : null,
        version: version || "1.0.0",
        cover: cover || JSON.stringify({ type: "gradient", colors: ["#3b82f6", "#8b5cf6"], icon: "Package", seed: slug }),
        images: JSON.stringify(images || []),
        variants: variants || null,
        featured: featured || false,
        seoTitle: seoTitle || "",
        seoDescription: seoDescription || "",
        categoryId,
        vendorId: vendorId || null,
      },
    });

    return ok({
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        type: product.type,
        status: product.status,
        featured: product.featured,
        createdAt: product.createdAt,
      },
      message: `Product "${product.title}" created`,
    }, 201);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return error("A product with this slug already exists", 409);
    }
    return error(
      e instanceof Error ? e.message : "Failed to create product",
      500,
    );
  }
}
