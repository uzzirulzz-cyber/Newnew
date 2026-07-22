import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Fields the admin may update on a CMS page.
const UPDATEABLE_FIELDS = [
  "title",
  "path",
  "status",
  "sections",
  "seoTitle",
  "seoDescription",
] as const;

// ----- GET /api/v1/admin/cms/pages/[id] -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid page id", 422);
  }

  try {
    const page = await db.cmsPage.findUnique({ where: { id } });
    if (!page) {
      return error("Page not found", 404);
    }
    return ok({ page });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to fetch page",
      500,
    );
  }
}

// ----- PATCH /api/v1/admin/cms/pages/[id] -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid page id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.cmsPage.findUnique({ where: { id } });
  if (!existing) {
    return error("Page not found", 404);
  }

  const data: any = {};
  for (const field of UPDATEABLE_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // Normalize sections: array → JSON string
  if (data.sections !== undefined && data.sections !== null) {
    if (typeof data.sections === "string") {
      try {
        JSON.parse(data.sections);
      } catch {
        return error("sections must be valid JSON", 422);
      }
    } else if (Array.isArray(data.sections)) {
      data.sections = JSON.stringify(data.sections);
    } else {
      return error("sections must be an array or JSON string", 422);
    }
  }

  // Normalize nullable SEO fields
  if (data.seoTitle !== undefined) {
    data.seoTitle =
      typeof data.seoTitle === "string" && data.seoTitle.trim()
        ? data.seoTitle.trim()
        : null;
  }
  if (data.seoDescription !== undefined) {
    data.seoDescription =
      typeof data.seoDescription === "string" && data.seoDescription.trim()
        ? data.seoDescription.trim()
        : null;
  }

  try {
    const page = await db.cmsPage.update({ where: { id }, data });
    return ok({ page });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update page",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/cms/pages/[id] -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid page id", 422);
  }

  const existing = await db.cmsPage.findUnique({ where: { id } });
  if (!existing) {
    return error("Page not found", 404);
  }

  try {
    await db.cmsPage.delete({ where: { id } });
    return ok({ success: true, id });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete page",
      500,
    );
  }
}
