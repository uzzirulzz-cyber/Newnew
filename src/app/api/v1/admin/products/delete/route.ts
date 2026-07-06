import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/products/delete
 *
 * Deletes a product by ID.
 *
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id } = body;

  if (!id) return error("Product ID is required", 422);

  try {
    const product = await db.product.delete({
      where: { id: String(id) },
    });

    return ok({
      deleted: true,
      title: product.title,
      message: `Product "${product.title}" deleted`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete product",
      500,
    );
  }
}
