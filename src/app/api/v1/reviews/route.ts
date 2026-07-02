import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit, validate, v } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

// GET /api/v1/reviews?productId=...
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return error("productId is required", 400);

  const reviews = await db.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return ok({
    items: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      verified: r.verified,
      vendorReply: r.vendorReply,
      createdAt: r.createdAt,
      authorName: r.user?.name ?? "Anonymous",
    })),
  });
}

// POST /api/v1/reviews  (verified-purchase enforced)
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;
  await ensureSeeded();

  const user = await getCurrentUser(request);
  if (!user) return error("You must be logged in to leave a review", 401);

  const body = await request.json().catch(() => ({}));
  const result = validate<{
    productId: string;
    rating: number;
    title?: string;
    comment: string;
  }>(body, {
    productId: v.required("Product"),
    rating: (val) =>
      typeof val === "number" && val >= 1 && val <= 5 ? null : "Rating must be 1–5",
    comment: v.minLen(3, "Comment"),
  });
  if (!result.valid) return error("Validation failed", 422, result.errors);

  const { productId, rating, title, comment } = result.data;

  // verified-purchase check
  const purchased = await db.orderItem.findFirst({
    where: {
      productId,
      order: { userId: user.id, status: "COMPLETED" },
    },
  });

  const review = await db.review.create({
    data: {
      productId,
      userId: user.id,
      rating,
      title: title ?? null,
      comment,
      verified: !!purchased,
      status: "APPROVED",
    },
    include: { user: true },
  });

  // recompute product rating
  const agg = await db.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count,
    },
  });

  return ok(
    {
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      verified: review.verified,
      createdAt: review.createdAt,
      authorName: review.user?.name ?? "Anonymous",
    },
    201,
  );
}
