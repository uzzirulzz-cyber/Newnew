import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const UPDATEABLE_FIELDS = [
  "question",
  "answer",
  "category",
  "sortOrder",
  "published",
] as const;

// ----- GET /api/v1/admin/cms/faqs/[id] -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid FAQ id", 422);
  }

  try {
    const faq = await db.faq.findUnique({ where: { id } });
    if (!faq) {
      return error("FAQ not found", 404);
    }
    return ok({ faq });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to fetch FAQ",
      500,
    );
  }
}

// ----- PATCH /api/v1/admin/cms/faqs/[id] -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid FAQ id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.faq.findUnique({ where: { id } });
  if (!existing) {
    return error("FAQ not found", 404);
  }

  const data: any = {};
  for (const field of UPDATEABLE_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // Normalize sortOrder
  if (data.sortOrder !== undefined) {
    const n = Number(data.sortOrder);
    if (!Number.isFinite(n)) {
      return error("sortOrder must be a number", 422);
    }
    data.sortOrder = Math.floor(n);
  }

  // Normalize published
  if (data.published !== undefined) {
    data.published = Boolean(data.published);
  }

  // Normalize category
  if (data.category !== undefined) {
    data.category =
      typeof data.category === "string" && data.category.trim()
        ? data.category.trim()
        : "general";
  }

  try {
    const faq = await db.faq.update({ where: { id }, data });
    return ok({ faq });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update FAQ",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/cms/faqs/[id] -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid FAQ id", 422);
  }

  const existing = await db.faq.findUnique({ where: { id } });
  if (!existing) {
    return error("FAQ not found", 404);
  }

  try {
    await db.faq.delete({ where: { id } });
    return ok({ success: true, id });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete FAQ",
      500,
    );
  }
}
