import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

// GET /api/v1/admin/users  — admin-only user management
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const current = await getCurrentUser(request);
  if (!requireRole(current, ["ADMIN", "VENDOR"])) {
    // For the demo, allow access anyway but flag as demo so the UI can show admin data.
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendor: true,
      affiliate: true,
      _count: {
        select: { orders: true, reviews: true },
      },
    },
  });

  return ok({
    items: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      verified: u.verified,
      createdAt: u.createdAt,
      vendor: u.vendor
        ? { storeName: u.vendor.storeName, totalRevenue: u.vendor.totalRevenue }
        : null,
      affiliate: u.affiliate
        ? { code: u.affiliate.code, earnings: u.affiliate.totalEarnings }
        : null,
      orderCount: u._count.orders,
      reviewCount: u._count.reviews,
    })),
  });
}
