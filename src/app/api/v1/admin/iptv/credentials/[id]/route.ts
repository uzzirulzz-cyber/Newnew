import { NextRequest } from "next/server";
import crypto from "crypto";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ----- GET /api/v1/admin/iptv/credentials/[id] — single subscriber credentials -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid subscriber id", 422);
  }

  const sub = await db.iptvSubscriber.findUnique({ where: { id } });
  if (!sub) {
    return error("Subscriber not found", 404);
  }
  return ok({ subscriber: sub });
}

// ----- PATCH /api/v1/admin/iptv/credentials/[id] — update credentials -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid subscriber id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.iptvSubscriber.findUnique({ where: { id } });
  if (!existing) {
    return error("Subscriber not found", 404);
  }

  const username =
    body.username === undefined
      ? existing.username
      : String(body.username || "").trim() || null;
  const password =
    body.password === undefined
      ? existing.password
      : String(body.password || "").trim() || null;
  const portalUrl =
    body.portalUrl === undefined
      ? existing.portalUrl
      : String(body.portalUrl || "").trim() || null;
  const m3uUrl =
    body.m3uUrl === undefined
      ? existing.m3uUrl
      : String(body.m3uUrl || "").trim() || null;
  const notes =
    body.notes === undefined
      ? existing.notes
      : String(body.notes || "").trim() || null;

  // Auto-generate a share token if none exists.
  let shareToken = existing.shareToken;
  if (!shareToken) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = crypto.randomBytes(16).toString("hex");
      const conflict = await db.iptvSubscriber.findUnique({
        where: { shareToken: candidate },
      });
      if (!conflict) {
        shareToken = candidate;
        break;
      }
    }
    if (!shareToken) {
      return error("Failed to generate a unique share token", 500);
    }
  }

  try {
    const updated = await db.iptvSubscriber.update({
      where: { id },
      data: { username, password, portalUrl, m3uUrl, notes, shareToken },
    });
    return ok({ subscriber: updated });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update credentials",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/iptv/credentials/[id] — clear credentials -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid subscriber id", 422);
  }

  const existing = await db.iptvSubscriber.findUnique({ where: { id } });
  if (!existing) {
    return error("Subscriber not found", 404);
  }

  try {
    const updated = await db.iptvSubscriber.update({
      where: { id },
      data: {
        username: null,
        password: null,
        portalUrl: null,
        m3uUrl: null,
        notes: null,
      },
    });
    return ok({ subscriber: updated });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to clear credentials",
      500,
    );
  }
}
