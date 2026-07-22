import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function maskKey(key: string): string {
  if (!key || key.length < 12) return "••••••••";
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

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

// ----- PATCH /api/v1/admin/api-keys/[id] — update name/scopes/status -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid API key id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.apiKey.findUnique({ where: { id } });
  if (!existing) {
    return error("API key not found", 404);
  }

  const data: any = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return error("Name cannot be empty", 422);
    if (name.length > 100) return error("Name must be 100 characters or fewer", 422);
    data.name = name;
  }

  if (body.scopes !== undefined) {
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
    data.scopes = JSON.stringify(scopes);
    data.permissions = data.scopes;
  }

  if (body.status !== undefined) {
    const status = typeof body.status === "string" ? body.status.trim() : "";
    if (!["active", "inactive", "revoked"].includes(status)) {
      return error("Status must be one of: active, inactive, revoked", 422);
    }
    data.status = status;
  }

  try {
    const updated = await db.apiKey.update({ where: { id }, data });
    return ok({ apiKey: serialize(updated) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update API key",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/api-keys/[id] — revoke (hard delete) -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid API key id", 422);
  }

  const existing = await db.apiKey.findUnique({ where: { id } });
  if (!existing) {
    return error("API key not found", 404);
  }

  try {
    await db.apiKey.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to revoke API key",
      500,
    );
  }
}
