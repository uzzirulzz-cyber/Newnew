import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/finance/gateways
 *
 * Returns all payment gateways. JSON-encoded fields (supportedCurrencies,
 * config) are parsed back into JS values before returning.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const gateways = await db.paymentGateway.findMany({
      orderBy: { createdAt: "asc" },
    });

    return ok({
      items: gateways.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        enabled: g.enabled,
        testMode: g.testMode,
        config: safeParseRecord(g.config),
        supportedCurrencies: safeParseArray(g.supportedCurrencies),
        transactionCount: g.transactionCount,
        totalVolume: g.totalVolume,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
    });
  } catch (e) {
    console.error("[admin/finance/gateways] error:", e);
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
