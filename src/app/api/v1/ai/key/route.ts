import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { saveAiGatewayApiKey, clearAiGatewayApiKey, isAiGatewayConfigured } from "@/lib/ai-gateway";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ai/key
 *   → { configured: boolean }
 *   (Never returns the key itself — only whether one is set.)
 *
 * POST /api/v1/ai/key
 *   Body: { apiKey: string } | { clear: true }
 *   → { configured: boolean, message: string }
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  return ok({ configured: await isAiGatewayConfigured() });
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));

  // Clear path
  if (body?.clear === true) {
    await clearAiGatewayApiKey();
    return ok({ configured: false, message: "AI Gateway API key cleared" });
  }

  // Set path
  const apiKey = String(body?.apiKey ?? "").trim();
  if (!apiKey) return error("apiKey is required", 422);
  if (!/^sk-|^vck_|^[A-Za-z0-9_\-]{20,}$/.test(apiKey)) {
    return error("That doesn't look like a valid AI Gateway API key", 422);
  }

  try {
    await saveAiGatewayApiKey(apiKey);
    return ok({ configured: true, message: "AI Gateway API key saved" });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed to save API key", 500);
  }
}
