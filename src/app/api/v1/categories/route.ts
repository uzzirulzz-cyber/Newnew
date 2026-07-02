import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, applyRateLimit } from "@/lib/api";
import { ensureSeeded } from "@/lib/ensure-seed";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  try {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
    });

    // compute product counts
    const withCounts = await Promise.all(
      categories.map(async (c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        color: c.color,
        productCount: await db.product.count({
          where: { categoryId: c.id, status: "PUBLISHED" },
        }),
      })),
    );

    return ok({ items: withCounts });
  } catch (e) {
    // DB connection issues (e.g. Neon cold starts) should never break the page
    return ok({ items: [] });
  }
}
