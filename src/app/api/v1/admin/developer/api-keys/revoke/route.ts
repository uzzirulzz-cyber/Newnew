import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/developer/api-keys/revoke
 *
 * Marks an API key as revoked. The row is preserved for audit history.
 *
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id } = body;

  if (!id) return error("API key id is required", 422);

  try {
    const apiKey = await db.apiKey.update({
      where: { id: String(id) },
      data: { status: "revoked" },
    });

    return ok({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        status: apiKey.status,
      },
      message: `API key "${apiKey.name}" revoked`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to revoke API key",
      500,
    );
  }
}
