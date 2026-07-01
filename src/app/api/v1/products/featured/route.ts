import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit } from "@/lib/api";
import { serializeProduct } from "@/lib/serializers";
import { ensureSeeded } from "@/lib/ensure-seed";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const items = await db.product.findMany({
    where: { featured: true, status: "PUBLISHED" },
    orderBy: { salesCount: "desc" },
    take: 8,
    include: { vendor: true, category: true },
  });

  return ok({ items: items.map(serializeProduct) });
}
