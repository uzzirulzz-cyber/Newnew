import { NextRequest } from "next/server";
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
  const vendor = await db.vendor.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        include: { category: true },
        orderBy: { salesCount: "desc" },
      },
      coupons: true,
    },
  });

  if (!vendor) return error("Vendor not found", 404);

  return ok({
    vendor: {
      id: vendor.id,
      storeName: vendor.storeName,
      slug: vendor.slug,
      description: vendor.description,
      verified: vendor.verified,
      totalSales: vendor.totalSales,
      totalRevenue: vendor.totalRevenue,
      rating: vendor.rating,
      createdAt: vendor.createdAt,
    },
    products: vendor.products.map((p) => serializeProduct({ ...p, vendor })),
    coupons: vendor.coupons.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.value,
      minPurchase: c.minPurchase,
      active: c.active,
    })),
  });
}
