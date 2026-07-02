import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, applyRateLimit } from "@/lib/api";
import { ensureSeeded } from "@/lib/ensure-seed";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const vendors = await db.vendor.findMany({
    orderBy: { totalRevenue: "desc" },
  });

  const items = vendors.map((v) => ({
    id: v.id,
    storeName: v.storeName,
    slug: v.slug,
    description: v.description,
    logo: v.logo,
    verified: v.verified,
    totalSales: v.totalSales,
    totalRevenue: Math.round(v.totalRevenue * 100) / 100,
    rating: v.rating,
  }));

  return ok({ items });
}
