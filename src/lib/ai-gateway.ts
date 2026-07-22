/**
 * Vercel AI Gateway client.
 *
 * The Vercel AI Gateway (https://ai-gateway.vercel.sh/v1) is an OpenAI-compatible
 * endpoint that routes prompts to many providers (OpenAI, Anthropic, Google,
 * xAI, etc.) through a single base URL + API key.
 *
 * Docs:
 *   - GET  /v1/models            → list available models
 *   - POST /v1/chat/completions  → OpenAI-compatible chat (supports stream:true)
 *
 * This module wraps both calls. The API key is read from the `ai_gateway`
 * Settings row first (so admins can set it in the UI), falling back to the
 * `AI_GATEWAY_API_KEY` env var.
 */

import { db } from "@/lib/db";

const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

export interface AiGatewayModel {
  id: string;
  name?: string;
  provider?: string;
  contextWindow?: number;
  [k: string]: unknown;
}

/**
 * Resolve the AI Gateway API key. Settings row takes precedence so admins can
 * set it from the UI without redeploying; falls back to the env var.
 */
export async function getAiGatewayApiKey(): Promise<string | null> {
  // DB first
  try {
    const setting = await db.settings.findUnique({ where: { key: "ai_gateway" } });
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (parsed?.apiKey && typeof parsed.apiKey === "string") return parsed.apiKey;
      } catch {
        // value might be a raw key string
        if (setting.value.trim()) return setting.value.trim();
      }
    }
  } catch {
    // DB unavailable — fall through to env
  }
  const envKey = process.env.AI_GATEWAY_API_KEY;
  return envKey && envKey.trim() ? envKey.trim() : null;
}

/** Whether an AI Gateway key is configured (DB or env). */
export async function isAiGatewayConfigured(): Promise<boolean> {
  return Boolean(await getAiGatewayApiKey());
}

/**
 * List the models available through the AI Gateway.
 * GET /v1/models → { object: "list", data: Model[] }
 */
export async function listAiGatewayModels(): Promise<{
  configured: boolean;
  baseUrl: string;
  models: AiGatewayModel[];
  error?: string;
}> {
  const apiKey = await getAiGatewayApiKey();
  if (!apiKey) {
    return { configured: false, baseUrl: AI_GATEWAY_BASE_URL, models: [] };
  }
  try {
    const res = await fetch(`${AI_GATEWAY_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        configured: true,
        baseUrl: AI_GATEWAY_BASE_URL,
        models: [],
        error: `Gateway returned HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
      };
    }
    const json: any = await res.json();
    const models: AiGatewayModel[] = Array.isArray(json?.data) ? json.data : [];
    return { configured: true, baseUrl: AI_GATEWAY_BASE_URL, models };
  } catch (e: any) {
    return {
      configured: true,
      baseUrl: AI_GATEWAY_BASE_URL,
      models: [],
      error: e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out contacting the AI Gateway"
        : e instanceof Error
          ? e.message
          : "Failed to contact the AI Gateway",
    };
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Send a chat completion request to the AI Gateway and return the raw
 * Response so the caller can stream the OpenAI-compatible SSE body.
 *
 * The caller is expected to pass `stream: true` through; the gateway then
 * emits `data: {...}\n\n` chunks that can be piped straight to the client.
 */
export async function streamAiGatewayChat(opts: StreamChatOptions): Promise<{
  ok: boolean;
  response?: Response;
  error?: string;
  status?: number;
}> {
  const apiKey = await getAiGatewayApiKey();
  if (!apiKey) {
    return { ok: false, error: "AI Gateway is not configured — set an API key first", status: 401 };
  }
  try {
    const res = await fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens,
        stream: true,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        error: `Gateway returned HTTP ${res.status}${text ? `: ${text.slice(0, 300)}` : ""}`,
      };
    }
    return { ok: true, response: res };
  } catch (e: any) {
    return {
      ok: false,
      error: e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out contacting the AI Gateway"
        : e instanceof Error
          ? e.message
          : "Failed to contact the AI Gateway",
    };
  }
}

/**
 * Persist the AI Gateway API key to the `ai_gateway` Settings row.
 * Stores `{ apiKey, updatedAt }` as JSON.
 */
export async function saveAiGatewayApiKey(apiKey: string): Promise<void> {
  const value = JSON.stringify({
    apiKey: apiKey.trim(),
    updatedAt: new Date().toISOString(),
  });
  const existing = await db.settings.findUnique({ where: { key: "ai_gateway" } });
  if (existing) {
    await db.settings.update({ where: { key: "ai_gateway" }, data: { value } });
  } else {
    await db.settings.create({ data: { key: "ai_gateway", value } });
  }
}

/** Clear the stored AI Gateway API key. */
export async function clearAiGatewayApiKey(): Promise<void> {
  const existing = await db.settings.findUnique({ where: { key: "ai_gateway" } });
  if (existing) {
    await db.settings.delete({ where: { key: "ai_gateway" } });
  }
}
