import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import {
  getWordPressConnection,
  saveWordPressConnection,
  clearWordPressConnection,
  testWordPressConnection,
} from "@/lib/wordpress";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/wordpress/connection
 *   → { configured, apiUrl, username, label, isWpCom, updatedAt }
 *   (Never returns the application password.)
 *
 * POST /api/v1/wordpress/connection
 *   Body: { apiUrl, username, appPassword, label? }
 *   Saves the connection. If `test: true` is also passed, validates it by
 *   hitting /users/me and includes the test result in the response.
 *
 * DELETE /api/v1/wordpress/connection
 *   Clears the stored connection.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const conn = await getWordPressConnection();
  if (!conn) {
    return ok({ configured: false });
  }
  return ok({
    configured: true,
    apiUrl: conn.apiUrl,
    username: conn.username,
    label: conn.label,
    isWpCom: conn.isWpCom,
    updatedAt: conn.updatedAt,
  });
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const apiUrl = String(body?.apiUrl ?? "").trim();
  const username = String(body?.username ?? "").trim();
  const appPassword = String(body?.appPassword ?? "").trim();
  const label = body?.label != null ? String(body.label) : undefined;
  const shouldTest = body?.test !== false; // default: test on save

  if (!apiUrl) return error("apiUrl is required", 422);
  if (!username) return error("username is required", 422);
  if (!appPassword) return error("appPassword is required", 422);

  let conn;
  try {
    conn = await saveWordPressConnection({ apiUrl, username, appPassword, label });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed to save connection", 422);
  }

  // If the caller asked for a test, validate the freshly-saved connection.
  let testResult: { ok: boolean; message: string; user?: any } | undefined;
  if (shouldTest) {
    testResult = await testWordPressConnection(conn);
  }

  return ok({
    configured: true,
    apiUrl: conn.apiUrl,
    username: conn.username,
    label: conn.label,
    isWpCom: conn.isWpCom,
    updatedAt: conn.updatedAt,
    test: testResult,
    message: testResult
      ? testResult.ok
        ? `Saved — ${testResult.message}`
        : `Saved, but connection test failed: ${testResult.message}`
      : "WordPress connection saved",
  });
}

export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  await clearWordPressConnection();
  return ok({ configured: false, message: "WordPress connection cleared" });
}
