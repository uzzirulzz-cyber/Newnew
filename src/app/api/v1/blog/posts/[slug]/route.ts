import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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
 * GET /api/v1/blog/posts/[slug]
 *
 * Returns a single published blog post by slug from the database.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limited = applyRateLimit(request, 120);
  if (limited) return limited;

  const { slug } = await params;

  try {
    const p = await db.blogPost.findUnique({ where: { slug } });
    if (!p || p.status !== "published") {
      return error("Post not found", 404);
    }

    const post = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      tags: safeParseArray(p.tags),
      coverImage: p.coverImage,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      status: p.status,
    };

    return ok({ post });
  } catch (e) {
    console.error("[blog/posts/[slug]] error:", e);
    return error("Post not found", 404);
  }
}
