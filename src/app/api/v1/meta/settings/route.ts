import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getMetaBusinessConfig, saveMetaBusinessConfig, clearMetaBusinessConfig, verifyMetaToken } from "@/lib/meta-business";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  const config = await getMetaBusinessConfig();
  if (!config) return ok({ configured: false });
  return ok({ configured: true, appId: config.appId, updatedAt: config.updatedAt });
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const token = String(body?.accessToken ?? "").trim();
  if (!token) return error("Access token is required", 422);
  await saveMetaBusinessConfig(token);
  const verify = await verifyMetaToken();
  return ok({ configured: true, message: "Meta token saved", verified: verify.ok, tokenInfo: verify.data });
}

export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  await clearMetaBusinessConfig();
  return ok({ configured: false, message: "Meta token cleared" });
}
