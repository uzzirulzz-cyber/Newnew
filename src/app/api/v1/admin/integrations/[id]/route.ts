import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function parseConfig(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, any>;
    }
  } catch {
    // ignore
  }
  return {};
}

function serialize(int: any) {
  return {
    id: int.id,
    name: int.name,
    slug: int.slug,
    category: int.category,
    description: int.description ?? "",
    icon: int.icon ?? null,
    connected: !!int.connected,
    config: parseConfig(int.config),
    createdAt: int.createdAt,
    updatedAt: int.updatedAt ?? int.createdAt,
  };
}

// ----- PATCH /api/v1/admin/integrations/[id] — update connected/config -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid integration id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.integration.findUnique({ where: { id } });
  if (!existing) return error("Integration not found", 404);

  const data: any = {};

  if (body.connected !== undefined) {
    data.connected = !!body.connected;
    // When disconnecting, clear stored config (API keys, tokens, etc.).
    if (!data.connected) {
      data.config = "{}";
    }
  }

  if (body.config !== undefined) {
    if (body.config && typeof body.config === "object" && !Array.isArray(body.config)) {
      // Mask/normalize: drop empty-string values so we don't store empty secrets.
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(body.config)) {
        if (v === undefined || v === null || v === "") continue;
        cleaned[k] = v;
      }
      data.config = JSON.stringify(cleaned);
    } else if (typeof body.config === "string") {
      // Accept pre-encoded JSON too.
      try {
        JSON.parse(body.config);
        data.config = body.config;
      } catch {
        return error("config must be a valid JSON object", 422);
      }
    } else {
      return error("config must be a JSON object", 422);
    }
  }

  // Optional name/description edits.
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return error("Name cannot be empty", 422);
    data.name = name;
  }
  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string" ? body.description : null;
  }

  try {
    const updated = await db.integration.update({ where: { id }, data });
    return ok({ integration: serialize(updated) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update integration",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/integrations/[id] -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid integration id", 422);
  }

  const existing = await db.integration.findUnique({ where: { id } });
  if (!existing) return error("Integration not found", 404);

  try {
    await db.integration.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete integration",
      500,
    );
  }
}
