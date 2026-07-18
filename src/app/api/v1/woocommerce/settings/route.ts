import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { getSettings, getSettingGroups, isWooCommerceConfigured } from "@/lib/woocommerce-sdk";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  if (!isWooCommerceConfigured()) {
    return ok({ configured: false, groups: [], settings: [] });
  }

  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group") || "general";

  const [groups, settings] = await Promise.all([
    getSettingGroups(),
    getSettings(group),
  ]);

  return ok({ configured: true, groups, settings });
}
