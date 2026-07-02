// Transforms Prisma rows (with JSON-as-string fields) into clean API shapes.

export interface ProductCover {
  type: "gradient";
  colors: [string, string];
  icon: string;
  seed: string;
}

export function parseCover(imagesJson: string | null): ProductCover {
  try {
    const arr = JSON.parse(imagesJson || "[]") as unknown[];
    if (Array.isArray(arr) && arr[0]) {
      return arr[0] as ProductCover;
    }
  } catch {
    /* ignore */
  }
  return { type: "gradient", colors: ["#10b981", "#0d9488"], icon: "Package", seed: "default" };
}

export function parseJsonArray<T = string>(json: string | null, fallback: T[] = []): T[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}

import type { Product, Vendor, Category, Review, User } from "@prisma/client";

export function serializeProduct(
  p: Product & { vendor?: Vendor | null; category?: Category | null },
) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description,
    type: p.type,
    status: p.status,
    price: p.price,
    discountPrice: p.discountPrice,
    currency: p.currency,
    sku: p.sku,
    stock: p.stock,
    cover: parseCover(p.images),
    tags: parseJsonArray<string>(p.tags),
    licenseType: p.licenseType,
    downloadFile: p.downloadFile,
    fileSize: p.fileSize,
    version: p.version,
    changelog: parseJsonArray(p.changelog),
    featured: p.featured,
    rating: p.rating,
    reviewCount: p.reviewCount,
    salesCount: p.salesCount,
    vendor: p.vendor
      ? {
          id: p.vendor.id,
          storeName: p.vendor.storeName,
          slug: p.vendor.slug,
          verified: p.vendor.verified,
          rating: p.vendor.rating,
        }
      : null,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          icon: p.category.icon,
          color: p.category.color,
        }
      : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    effectivePrice: p.discountPrice != null ? p.discountPrice : p.price,
    discountPercent:
      p.discountPrice != null && p.price > 0
        ? Math.round((1 - p.discountPrice / p.price) * 100)
        : 0,
  };
}

export function serializeReview(r: Review & { user?: User | null }) {
  return {
    id: r.id,
    productId: r.productId,
    userId: r.userId,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    verified: r.verified,
    status: r.status,
    vendorReply: r.vendorReply,
    createdAt: r.createdAt,
    user: r.user ? { id: r.user.id, name: r.user.name } : null,
    authorName: r.user?.name ?? "Anonymous",
  };
}
