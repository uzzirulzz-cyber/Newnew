import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getTikTokSettings } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

const MCP_SERVER_URL = "https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat";

/**
 * POST /api/v1/tiktok/mcp
 *
 * Proxy that forwards JSON-RPC requests to TikTok's hosted MCP server
 * (https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat) using the
 * stored TikTok access token.
 *
 * This lets the admin call any MCP tool (tools/list, tools/call, etc.)
 * directly from PlayBeat without a separate MCP client like Claude Desktop.
 *
 * Body: standard MCP JSON-RPC envelope
 *   { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }
 *   { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "...", arguments: {...} } }
 *
 * The route injects the Access-Token header from the stored TikTok settings
 * and forwards the response back to the caller.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const settings = await getTikTokSettings();
  if (!settings) {
    return error("TikTok is not configured — set access token first", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.method) {
    return error("Invalid MCP request — { jsonrpc, id, method, params } required", 422);
  }

  try {
    // Forward the JSON-RPC request to TikTok's MCP server with auth.
    // Try both common auth header formats — Bearer and Access-Token.
    const res = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.accessToken}`,
        "Access-Token": settings.accessToken,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    // The MCP server may return text (e.g. "unauthorized") or JSON-RPC.
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await res.json();
      return ok({ mcpResponse: json, httpStatus: res.status });
    }

    // Plain text response (e.g. "unauthorized") — means auth failed or
    // the server rejected the request before JSON-RPC processing.
    const text = await res.text();
    if (text === "unauthorized" || res.status === 401) {
      return error(
        "TikTok MCP server rejected the access token. Make sure you have a valid long-term access token from TikTok Ads Manager → Developer Settings.",
        401,
      );
    }
    return ok({ mcpResponse: { raw: text }, httpStatus: res.status });
  } catch (e: any) {
    return error(
      e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out contacting TikTok MCP server"
        : e instanceof Error ? e.message : "MCP request failed",
      502,
    );
  }
}

/** GET — returns the MCP server URL + connection status for the admin UI. */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  const settings = await getTikTokSettings();
  return ok({
    mcpServerUrl: MCP_SERVER_URL,
    configured: Boolean(settings),
  });
}
