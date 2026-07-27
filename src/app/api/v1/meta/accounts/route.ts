import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getMetaAdAccounts, isMetaBusinessConfigured } from "@/lib/meta-business";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  if (!(await isMetaBusinessConfigured())) return error("Meta Business not configured", 401);
  const result = await getMetaAdAccounts();
  if (result.ok) return ok(result.data);
  return error(result.message || "Failed", 502);
}
