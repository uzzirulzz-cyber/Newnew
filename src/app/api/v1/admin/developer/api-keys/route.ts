import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/developer/api-keys
 *
 * Returns all API keys. The `permissions` JSON-string column is parsed
 * back into an array of strings.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const apiKeys = await db.apiKey.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        key: k.key,
        prefix: k.prefix,
        permissions: safeParseArray(k.permissions),
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        status: k.status,
        createdBy: k.createdBy,
        createdAt: k.createdAt,
      })),
    });
  } catch (e) {
    console.error("[admin/developer/api-keys] error:", e);
    return ok({ items: [] });
  }
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
