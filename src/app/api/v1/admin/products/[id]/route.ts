import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Fields the admin may update on a product.
const UPDATEABLE_FIELDS = [
  "title",
  "shortDescription",
  "description",
  "type",
  "status",
  "price",
  "discountPrice",
  "currency",
  "sku",
  "stock",
  "images",
  "videoUrl",
  "tags",
  "licenseType",
  "downloadFile",
  "fileSize",
  "version",
  "changelog",
  "cover",
  "variants",
  "seoTitle",
  "seoDescription",
  "featured",
  "categoryId",
  "vendorId",
] as const;

// ----- PATCH /api/v1/admin/products/[id] — update -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  await ensureSeeded();

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid product id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  // Verify existence first (so we can return a clean 404)
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) {
    return error("Product not found", 404);
  }

  // Build update payload from allowed fields only (strip id etc.)
  const data: any = {};
  for (const field of UPDATEABLE_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // ---- numeric coercion + validation ----
  if (data.price !== undefined) {
    const p = Number(data.price);
    if (!Number.isFinite(p) || p < 0) {
      return error("price must be a non-negative number", 422);
    }
    data.price = p;
  }
  if (data.discountPrice !== undefined) {
    data.discountPrice =
      data.discountPrice === null ? null : Number(data.discountPrice);
    if (data.discountPrice !== null && !Number.isFinite(data.discountPrice)) {
      return error("discountPrice must be a number or null", 422);
    }
  }
  if (data.stock !== undefined) {
    data.stock = data.stock === null ? null : Number(data.stock);
    if (data.stock !== null && (!Number.isFinite(data.stock) || data.stock < 0)) {
      return error("stock must be a non-negative integer or null", 422);
    }
    if (data.stock !== null) data.stock = Math.floor(data.stock);
  }
  if (data.featured !== undefined) {
    data.featured = Boolean(data.featured);
  }

  // ---- status validation (if provided) ----
  if (data.status !== undefined) {
    const allowed = ["DRAFT", "PENDING", "PUBLISHED"];
    if (typeof data.status !== "string" || !allowed.includes(data.status)) {
      return error(`status must be one of: ${allowed.join(", ")}`, 422);
    }
  }

  // ---- categoryId / vendorId validation ----
  if (data.categoryId !== undefined && data.categoryId !== null) {
    if (!OBJECT_ID_RE.test(String(data.categoryId))) {
      return error("Invalid categoryId", 422);
    }
  }
  if (data.vendorId !== undefined && data.vendorId !== null) {
    if (!OBJECT_ID_RE.test(String(data.vendorId))) {
      return error("Invalid vendorId", 422);
    }
  }

  // ---- SKU uniqueness check (if changing SKU) ----
  if (data.sku && data.sku !== existing.sku) {
    const conflict = await db.product.findUnique({ where: { sku: data.sku } });
    if (conflict && conflict.id !== id) {
      return error("SKU already in use by another product", 409);
    }
  }

  // updatedAt is handled automatically by Prisma's @updatedAt annotation,
  // so we don't need to set it explicitly.

  try {
    const product = await db.product.update({
      where: { id },
      data,
      include: { category: true, vendor: true },
    });
    return ok({ product });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update product",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/products/[id] — delete -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  await ensureSeeded();

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid product id", 422);
  }

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) {
    return error("Product not found", 404);
  }

  try {
    await db.product.delete({ where: { id } });
    return ok({ success: true, id });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete product",
      500,
    );
  }
}
