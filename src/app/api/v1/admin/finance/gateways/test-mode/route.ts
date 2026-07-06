import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/finance/gateways/test-mode
 *
 * Toggles testMode on a payment gateway.
 *
 * Body: { id: string, testMode: boolean }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, testMode } = body;

  if (!id) return error("Gateway id is required", 422);
  if (typeof testMode !== "boolean") {
    return error("testMode must be a boolean", 422);
  }

  try {
    const gateway = await db.paymentGateway.update({
      where: { id: String(id) },
      data: { testMode: Boolean(testMode) },
    });

    return ok({
      gateway: {
        id: gateway.id,
        name: gateway.name,
        slug: gateway.slug,
        enabled: gateway.enabled,
        testMode: gateway.testMode,
      },
      message: `Gateway "${gateway.name}" test mode ${testMode ? "enabled" : "disabled"}`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update gateway",
      500,
    );
  }
}
