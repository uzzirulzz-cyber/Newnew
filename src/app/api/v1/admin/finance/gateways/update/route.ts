import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/finance/gateways/update
 *
 * Updates a payment gateway's editable fields: name, config (JSON record),
 * and supportedCurrencies (JSON array). The `enabled` and `testMode` flags
 * have their own dedicated toggle endpoints.
 *
 * Body: {
 *   id: string,
 *   name?: string,
 *   config?: Record<string, unknown>,
 *   supportedCurrencies?: string[],
 * }
 *
 * Config values are stored as a JSON string (matching the Prisma schema).
 * Sensitive values (API keys, secrets) are kept as-is — the admin is
 * responsible for entering them.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, name, config, supportedCurrencies } = body;

  if (!id) return error("Gateway id is required", 422);

  // Build the update payload — only include fields that were provided.
  const data: any = {};
  if (typeof name === "string" && name.trim()) {
    data.name = name.trim();
  }
  if (config !== undefined) {
    if (config === null || typeof config !== "object" || Array.isArray(config)) {
      return error("config must be an object", 422);
    }
    data.config = JSON.stringify(config);
  }
  if (supportedCurrencies !== undefined) {
    if (!Array.isArray(supportedCurrencies)) {
      return error("supportedCurrencies must be an array", 422);
    }
    data.supportedCurrencies = JSON.stringify(
      supportedCurrencies.map((c: any) => String(c).toUpperCase().trim()).filter(Boolean),
    );
  }

  if (Object.keys(data).length === 0) {
    return error("Nothing to update — provide name, config, or supportedCurrencies", 422);
  }

  try {
    // Verify the gateway exists first (clean 404 for unknown IDs).
    const existing = await db.paymentGateway.findUnique({ where: { id: String(id) } });
    if (!existing) return error("Gateway not found", 404);

    const gateway = await db.paymentGateway.update({
      where: { id: String(id) },
      data,
    });

    return ok({
      gateway: {
        id: gateway.id,
        name: gateway.name,
        slug: gateway.slug,
        enabled: gateway.enabled,
        testMode: gateway.testMode,
        config: safeParseRecord(gateway.config),
        supportedCurrencies: safeParseArray(gateway.supportedCurrencies),
        transactionCount: gateway.transactionCount,
        totalVolume: gateway.totalVolume,
        updatedAt: gateway.updatedAt,
      },
      message: `Gateway "${gateway.name}" updated`,
    });
  } catch (e) {
    console.error("[admin/finance/gateways/update] error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to update gateway",
      500,
    );
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

function safeParseRecord(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
