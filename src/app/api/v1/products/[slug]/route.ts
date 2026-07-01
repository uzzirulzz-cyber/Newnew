import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit } from "@/lib/api";
import { serializeProduct } from "@/lib/serializers";
import { ensureSeeded } from "@/lib/ensure-seed";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      vendor: true,
      category: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: true },
      },
    },
  });

  if (!product) return error("Product not found", 404);

  const reviews = product.reviews;
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return ok({
    product: serializeProduct(product),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      verified: r.verified,
      vendorReply: r.vendorReply,
      createdAt: r.createdAt,
      authorName: r.user?.name ?? "Anonymous",
    })),
    ratingBreakdown,
  });
}

// Handle preflight for dynamic route
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
