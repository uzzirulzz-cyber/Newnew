import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getMetaCampaigns, isMetaBusinessConfigured } from "@/lib/meta-business";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  if (!(await isMetaBusinessConfigured())) return error("Meta Business not configured", 401);
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId) return error("accountId is required", 422);
  const result = await getMetaCampaigns(accountId);
  if (result.ok) return ok(result.data);
  return error(result.message || "Failed", 502);
}
