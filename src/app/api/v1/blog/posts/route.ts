import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
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
 * GET /api/v1/blog/posts
 *
 * Returns published blog posts from the database (newest first).
 * Backs the public blog listing page.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 120);
  if (limited) return limited;

  try {
    const posts = await db.blogPost.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
    });

    const items = posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      tags: safeParseArray(p.tags),
      coverImage: p.coverImage,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      status: p.status,
    }));

    return ok({ items });
  } catch (e) {
    // Fail soft — never break the public blog page
    console.error("[blog/posts] error:", e);
    return ok({ items: [] });
  }
}
