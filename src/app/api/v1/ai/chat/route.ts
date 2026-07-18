import { NextRequest } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { streamAiGatewayChat, isAiGatewayConfigured } from "@/lib/ai-gateway";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/ai/chat
 *
 * Streaming chat completion proxied through the Vercel AI Gateway.
 *
 * Body: { model, messages: [{role, content}], temperature?, maxTokens? }
 *
 * Returns a streaming SSE response (OpenAI-compatible `data: {...}` chunks).
 * On error returns JSON { success:false, error:{message} } with the right status.
 *
 * We stream by piping the gateway's response body straight through — the
 * gateway already emits OpenAI-compatible SSE, so the browser can parse it
 * with the standard EventSource / ReadableStream approach.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  if (!(await isAiGatewayConfigured())) {
    return Response.json(
      { success: false, error: { message: "AI Gateway is not configured — set an API key in the AI Tools module" } },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const model = String(body?.model ?? "").trim();
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const temperature = body?.temperature != null ? Number(body.temperature) : undefined;
  const maxTokens = body?.maxTokens != null ? Number(body.maxTokens) : undefined;

  if (!model) {
    return Response.json(
      { success: false, error: { message: "model is required" } },
      { status: 422 },
    );
  }
  if (!messages.length) {
    return Response.json(
      { success: false, error: { message: "messages array is required" } },
      { status: 422 },
    );
  }

  // Basic shape validation — each message must have role + content.
  const validRoles = new Set(["system", "user", "assistant"]);
  const cleanMessages = messages
    .filter((m: any) => m && validRoles.has(String(m.role)) && typeof m.content === "string")
    .map((m: any) => ({ role: String(m.role), content: String(m.content) }));
  if (!cleanMessages.length) {
    return Response.json(
      { success: false, error: { message: "messages must contain at least one valid {role, content} entry" } },
      { status: 422 },
    );
  }

  const result = await streamAiGatewayChat({
    model,
    messages: cleanMessages,
    temperature,
    maxTokens,
  });

  if (!result.ok || !result.response) {
    return Response.json(
      { success: false, error: { message: result.error || "Gateway request failed" } },
      { status: result.status || 502 },
    );
  }

  // Pipe the gateway's SSE stream straight through to the client. We add a
  // `text/event-stream` content type so browsers/EventSource handle it, plus
  // the streaming-friendly cache/disconnection headers.
  const headers = new Headers(result.response.headers);
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  headers.set("X-Accel-Buffering", "no");

  return new Response(result.response.body, { status: 200, headers });
}
