import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getMetaInsights, isMetaBusinessConfigured } from "@/lib/meta-business";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  if (!(await isMetaBusinessConfigured())) return error("Meta Business not configured", 401);
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId) return error("accountId is required", 422);
  const level = searchParams.get("level") || "campaign";
  const datePreset = searchParams.get("datePreset") || "last_7d";
  const since = searchParams.get("since");
  const until = searchParams.get("until");
  const result = await getMetaInsights(accountId, {
    level: level as any,
    datePreset: since && until ? undefined : datePreset,
    timeRange: since && until ? { since, until } : undefined,
  });
  if (result.ok) return ok(result.data);
  return error(result.message || "Failed", 502);
}
