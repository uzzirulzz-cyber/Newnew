import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const UPDATEABLE_FIELDS = ["name", "slides", "active"] as const;

// ----- GET /api/v1/admin/cms/sliders/[id] -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid slider id", 422);
  }

  try {
    const slider = await db.slider.findUnique({ where: { id } });
    if (!slider) {
      return error("Slider not found", 404);
    }
    return ok({ slider });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to fetch slider",
      500,
    );
  }
}

// ----- PATCH /api/v1/admin/cms/sliders/[id] -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid slider id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.slider.findUnique({ where: { id } });
  if (!existing) {
    return error("Slider not found", 404);
  }

  const data: any = {};
  for (const field of UPDATEABLE_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // Normalize slides
  if (data.slides !== undefined && data.slides !== null) {
    if (typeof data.slides === "string") {
      try {
        JSON.parse(data.slides);
      } catch {
        return error("slides must be valid JSON", 422);
      }
    } else if (Array.isArray(data.slides)) {
      data.slides = JSON.stringify(data.slides);
    } else {
      return error("slides must be an array or JSON string", 422);
    }
  }

  // Normalize active
  if (data.active !== undefined) {
    data.active = Boolean(data.active);
  }

  try {
    const slider = await db.slider.update({ where: { id }, data });
    return ok({ slider });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update slider",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/cms/sliders/[id] -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid slider id", 422);
  }

  const existing = await db.slider.findUnique({ where: { id } });
  if (!existing) {
    return error("Slider not found", 404);
  }

  try {
    await db.slider.delete({ where: { id } });
    return ok({ success: true, id });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete slider",
      500,
    );
  }
}
