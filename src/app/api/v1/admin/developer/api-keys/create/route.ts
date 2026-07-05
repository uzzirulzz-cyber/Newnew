import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/developer/api-keys/create
 *
 * Issues a new API key. The key is auto-generated and never stored hashed —
 * it is returned to the caller exactly once.
 *
 * Body: {
 *   name: string,
 *   permissions: string[],       // e.g. ["read:products","write:orders"]
 *   expiresAt?: string,          // ISO date string
 * }
 *
 * Auto-generated fields:
 *   prefix = "hk_" + 8 random base36 chars
 *   key    = prefix + "_" + 28 random base36 chars
 *   status = "active"
 *   permissions stored as JSON.stringify(permissions)
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { name, permissions, expiresAt } = body;

  if (!name) return error("name is required", 422);
  if (!Array.isArray(permissions)) {
    return error("permissions must be an array", 422);
  }

  const prefix = "hk_" + randomString(8);
  const key = prefix + "_" + randomString(28);

  try {
    const apiKey = await db.apiKey.create({
      data: {
        name: String(name),
        key,
        prefix,
        permissions: JSON.stringify(permissions),
        expiresAt: expiresAt ? String(expiresAt) : null,
        status: "active",
      },
    });

    return ok(
      {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key,
          prefix: apiKey.prefix,
          permissions,
          expiresAt: apiKey.expiresAt,
          status: apiKey.status,
          createdAt: apiKey.createdAt,
        },
        message: `API key "${apiKey.name}" created`,
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create API key",
      500,
    );
  }
}

// Generates a random base36 string of the requested length. Iterates until
// the requested length is reached — Math.random().toString(36) can yield
// fewer than N chars after the "0." prefix due to trailing zeros.
function randomString(len: number): string {
  let s = "";
  while (s.length < len) {
    s += Math.random().toString(36).slice(2);
  }
  return s.slice(0, len);
}
