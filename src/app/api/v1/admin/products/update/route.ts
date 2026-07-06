import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/products/update
 *
 * Updates an existing product by ID.
 *
 * Body: {
 *   id: string,
 *   title?: string,
 *   shortDescription?: string,
 *   description?: string,
 *   type?: string,
 *   price?: number,
 *   discountPrice?: number,
 *   categorySlug?: string,
 *   sku?: string,
 *   stock?: number,
 *   tags?: string[],
 *   licenseType?: string,
 *   downloadFile?: string,
 *   fileSize?: number,
 *   version?: string,
 *   cover?: string,
 *   images?: string[],
 *   featured?: boolean,
 *   status?: "PUBLISHED" | "DRAFT" | "ARCHIVED",
 *   seoTitle?: string,
 *   seoDescription?: string,
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, categorySlug, tags, images, ...rest } = body;

  if (!id) return error("Product ID is required", 422);

  // Build update data — only include provided fields
  const updateData: any = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) {
      if (k === "price" || k === "discountPrice" || k === "fileSize" || k === "stock") {
        updateData[k] = Number(v);
      } else if (k === "featured") {
        updateData[k] = Boolean(v);
      } else {
        updateData[k] = v;
      }
    }
  }

  // Handle JSON-serialized fields
  if (tags !== undefined) updateData.tags = JSON.stringify(tags);
  if (images !== undefined) updateData.images = JSON.stringify(images);

  // Resolve category by slug
  if (categorySlug !== undefined) {
    if (categorySlug) {
      const cat = await db.category.findUnique({ where: { slug: categorySlug } });
      updateData.categoryId = cat?.id || null;
    } else {
      updateData.categoryId = null;
    }
  }

  try {
    const product = await db.product.update({
      where: { id: String(id) },
      data: updateData,
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
      },
      message: `Product "${product.title}" updated`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update product",
      500,
    );
  }
}
