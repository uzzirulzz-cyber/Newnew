import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomHex(len: number): string {
  const bytes = randomBytes(Math.ceil(len / 2));
  return bytes.toString("hex").slice(0, len);
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "page";
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = `${base}-${randomHex(6)}`;
    const existing = await db.cmsPage.findUnique({ where: { slug } });
    if (!existing) return slug;
  }
  return `${base}-${randomHex(10)}`;
}

// ----- GET /api/v1/admin/cms/pages — list all pages -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const items = await db.cmsPage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok({ items });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list pages",
      500,
    );
  }
}

// ----- POST /api/v1/admin/cms/pages — create page -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  if (typeof body.title !== "string" || !body.title.trim()) {
    return error("title is required", 422);
  }
  if (typeof body.path !== "string" || !body.path.trim()) {
    return error("path is required", 422);
  }

  const title = body.title.trim();
  const path = body.path.trim();
  const status =
    typeof body.status === "string" && body.status
      ? body.status
      : "published";

  // sections: accept array or JSON-string — store as JSON string
  let sectionsStr = "[]";
  if (body.sections !== undefined && body.sections !== null) {
    if (typeof body.sections === "string") {
      try {
        JSON.parse(body.sections);
        sectionsStr = body.sections;
      } catch {
        return error("sections must be valid JSON", 422);
      }
    } else if (Array.isArray(body.sections)) {
      sectionsStr = JSON.stringify(body.sections);
    } else {
      return error("sections must be an array or JSON string", 422);
    }
  }

  const seoTitle =
    typeof body.seoTitle === "string" && body.seoTitle.trim()
      ? body.seoTitle.trim()
      : null;
  const seoDescription =
    typeof body.seoDescription === "string" && body.seoDescription.trim()
      ? body.seoDescription.trim()
      : null;

  const slug = await generateUniqueSlug(title);

  try {
    const page = await db.cmsPage.create({
      data: {
        title,
        slug,
        path,
        status,
        sections: sectionsStr,
        seoTitle,
        seoDescription,
        views: 0,
      },
    });
    return ok({ page }, 201);
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create page",
      500,
    );
  }
}
