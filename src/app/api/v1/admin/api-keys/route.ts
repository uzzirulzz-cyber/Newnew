import { NextRequest } from "next/server";
import crypto from "crypto";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Mask an API key for display: show the first 8 + last 4 chars, hide the middle.
function maskKey(key: string): string {
  if (!key || key.length < 12) return "••••••••";
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

// Convert a raw ApiKey DB record into the JSON shape returned to the client.
// The full key is NEVER sent here — only the masked form. The full key is
// returned exactly once, on creation.
function serialize(k: any) {
  let scopes: string[] = [];
  try {
    const parsed = JSON.parse(k.scopes || "[]");
    if (Array.isArray(parsed)) scopes = parsed;
  } catch {
    // ignore
  }
  return {
    id: k.id,
    name: k.name,
    key: maskKey(k.key),
    prefix: k.prefix,
    scopes,
    lastUsedAt: k.lastUsedAt ?? null,
    status: k.status,
    createdAt: k.createdAt,
    updatedAt: k.updatedAt ?? k.createdAt,
  };
}

// ----- GET /api/v1/admin/api-keys — list all keys (masked) -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const keys = await db.apiKey.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok({ items: keys.map(serialize) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list API keys",
      500,
    );
  }
}

// ----- POST /api/v1/admin/api-keys — create a new key -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return error("Name is required", 422);
  }
  if (name.length > 100) {
    return error("Name must be 100 characters or fewer", 422);
  }

  // Normalise scopes into a string[] (default: ["read"]).
  let scopes: string[] = ["read"];
  if (Array.isArray(body.scopes)) {
    scopes = body.scopes
      .filter((s: unknown) => typeof s === "string" && s.trim())
      .map((s: string) => s.trim());
    if (scopes.length === 0) scopes = ["read"];
  } else if (typeof body.scopes === "string" && body.scopes.trim()) {
    scopes = body.scopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Generate the full key: `pb_` + 32 hex chars (16 random bytes).
  const fullKey = `pb_${crypto.randomBytes(16).toString("hex")}`;
  const prefix = fullKey.slice(0, 8);

  try {
    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: fullKey,
        prefix,
        scopes: JSON.stringify(scopes),
        permissions: JSON.stringify(scopes),
        status: "active",
      },
    });
    // Return the serialized record PLUS the full key — only once.
    return ok({ apiKey: serialize(apiKey), fullKey }, 201);
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create API key",
      500,
    );
  }
}
