import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set(["draft", "published"]);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(
  base: string,
  ignoreId: string,
): Promise<string> {
  let slug = base || "post";
  let suffix = 1;
  for (;;) {
    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`.slice(0, 80);
  }
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * PATCH /api/v1/admin/cms/blog/[id]
 * Body: partial { title, content, excerpt, tags, coverImage, status, authorName }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!id) return error("Blog post id is required", 422);

  const body = await request.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  let newTitle: string | undefined;
  if (typeof body.title === "string" && body.title.trim()) {
    newTitle = body.title.trim();
    data.title = newTitle;
  }
  if (typeof body.content === "string") {
    data.content = body.content;
  }
  if (typeof body.excerpt === "string") {
    data.excerpt = body.excerpt;
  }
  if (Array.isArray(body.tags)) {
    data.tags = JSON.stringify(
      body.tags.filter((t: unknown) => typeof t === "string"),
    );
  }
  if (typeof body.coverImage === "string") {
    data.coverImage = body.coverImage;
  }
  if (typeof body.status === "string" && ALLOWED_STATUS.has(body.status)) {
    data.status = body.status;
    if (body.status === "published") {
      data.publishedAt = new Date();
    }
  }
  if (typeof body.authorName === "string") {
    data.authorName = body.authorName;
  }

  if (Object.keys(data).length === 0) {
    return error("No valid fields provided for update", 422);
  }

  try {
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) return error("Blog post not found", 404);

    if (newTitle && slugify(newTitle) !== existing.slug) {
      data.slug = await uniqueSlug(slugify(newTitle), id);
    }

    const updated = await db.blogPost.update({ where: { id }, data });

    return ok({
      post: {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        excerpt: updated.excerpt,
        content: updated.content,
        tags: safeParseArray(updated.tags),
        coverImage: updated.coverImage,
        status: updated.status,
        authorName: updated.authorName,
        publishedAt: updated.publishedAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      message: "Blog post updated",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update blog post",
      500,
    );
  }
}

/**
 * DELETE /api/v1/admin/cms/blog/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!id) return error("Blog post id is required", 422);

  try {
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) return error("Blog post not found", 404);

    await db.blogPost.delete({ where: { id } });

    return ok({
      deleted: true,
      id,
      message: "Blog post deleted",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete blog post",
      500,
    );
  }
}
