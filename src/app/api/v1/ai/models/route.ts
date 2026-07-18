import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { listAiGatewayModels } from "@/lib/ai-gateway";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ai/models
 *
 * Lists the models available through the Vercel AI Gateway.
 * Returns { configured, baseUrl, models[], error? }.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const result = await listAiGatewayModels();
  // Don't treat "not configured" as an error — return it so the UI can prompt
  // the admin to add a key. Only surface a 502 if the gateway was reachable
  // but returned an error.
  if (result.error && result.configured) {
    return error(result.error, 502);
  }
  return ok(result);
}
