import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Token format: 32-char lowercase hex (crypto.randomBytes(16).toString("hex")).
const TOKEN_RE = /^[0-9a-fA-F]{32}$/;

// ----- GET /api/v1/iptv/credentials/[token] — public customer-facing viewer -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { token } = await params;
  if (!TOKEN_RE.test(token)) {
    return error("Credentials not found", 404);
  }

  const sub = await db.iptvSubscriber.findUnique({
    where: { shareToken: token },
  });
  if (!sub) {
    return error("Credentials not found", 404);
  }

  // Only expose the fields the customer needs to log in.
  return ok({
    name: sub.name,
    plan: sub.plan,
    expiresAt: sub.expiresAt,
    username: sub.username,
    password: sub.password,
    portalUrl: sub.portalUrl,
    m3uUrl: sub.m3uUrl,
    notes: sub.notes,
  });
}
