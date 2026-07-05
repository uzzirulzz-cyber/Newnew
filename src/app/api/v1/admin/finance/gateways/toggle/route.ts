import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/finance/gateways/toggle
 *
 * Enables or disables a payment gateway.
 *
 * Body: { id: string, enabled: boolean }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, enabled } = body;

  if (!id) return error("Gateway id is required", 422);
  if (typeof enabled !== "boolean") {
    return error("enabled must be a boolean", 422);
  }

  try {
    const gateway = await db.paymentGateway.update({
      where: { id: String(id) },
      data: { enabled: Boolean(enabled) },
    });

    return ok({
      gateway: {
        id: gateway.id,
        name: gateway.name,
        slug: gateway.slug,
        enabled: gateway.enabled,
        testMode: gateway.testMode,
      },
      message: `Gateway "${gateway.name}" ${enabled ? "enabled" : "disabled"}`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update gateway",
      500,
    );
  }
}
