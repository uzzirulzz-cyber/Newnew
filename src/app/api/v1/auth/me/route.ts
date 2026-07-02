import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  const user = await getCurrentUser(request);
  if (!user) return error("Not authenticated", 401);

  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      vendor: user.vendor
        ? {
            id: user.vendor.id,
            storeName: user.vendor.storeName,
            slug: user.vendor.slug,
            verified: user.vendor.verified,
            totalSales: user.vendor.totalSales,
            totalRevenue: user.vendor.totalRevenue,
          }
        : null,
      affiliate: user.affiliate
        ? {
            id: user.affiliate.id,
            code: user.affiliate.code,
            commissionRate: user.affiliate.commissionRate,
            balance: user.affiliate.balance,
            totalEarnings: user.affiliate.totalEarnings,
          }
        : null,
    },
  });
}
