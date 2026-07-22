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

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = base || "post";
  let suffix = 1;
  for (;;) {
    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`.slice(0, 80);
  }
}

/**
 * GET /api/v1/admin/cms/blog
 * Returns all blog posts (newest first).
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const posts = await db.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        tags: safeParseArray(p.tags),
        coverImage: p.coverImage,
        status: p.status,
        authorName: p.authorName,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to load blog posts",
      500,
    );
  }
}

/**
 * POST /api/v1/admin/cms/blog
 * Body: { title: string, content?: string, excerpt?: string, tags?: string[],
 *         coverImage?: string, status?: "draft"|"published", authorName?: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { title, content, excerpt, tags, coverImage, status, authorName } =
    body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    return error("Post title is required", 422);
  }

  const finalStatus =
    typeof status === "string" && ALLOWED_STATUS.has(status) ? status : "draft";

  const tagsArray = Array.isArray(tags)
    ? tags.filter((t: unknown) => typeof t === "string")
    : [];

  try {
    const slug = await uniqueSlug(slugify(title));

    const post = await db.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: typeof excerpt === "string" ? excerpt : null,
        content: typeof content === "string" ? content : "",
        tags: JSON.stringify(tagsArray),
        coverImage: typeof coverImage === "string" ? coverImage : null,
        status: finalStatus,
        authorName: typeof authorName === "string" ? authorName : null,
        publishedAt:
          finalStatus === "published" ? new Date() : null,
      },
    });

    return ok(
      {
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          tags: tagsArray,
          coverImage: post.coverImage,
          status: post.status,
          authorName: post.authorName,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
        message: "Blog post created",
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create blog post",
      500,
    );
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
