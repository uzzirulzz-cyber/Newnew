import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social-media/posts
 * Returns all draft/published social posts (stored in Settings table as JSON).
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const setting = await db.settings.findUnique({ where: { key: "social_posts" } });
  let posts: unknown[] = [];
  if (setting?.value) {
    try {
      posts = JSON.parse(setting.value);
    } catch {
      posts = [];
    }
  }
  return ok({ posts });
}

/**
 * POST /api/v1/admin/social-media/posts
 * Creates a new draft social post (saved to Settings table under "social_posts").
 * Body: { content: string, platforms?: string[], status?: "draft"|"published", link?: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { content, platforms, status, link } = body ?? {};

  if (typeof content !== "string" || !content.trim()) {
    return error("Post content is required", 422);
  }

  const post = {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: content.trim(),
    platforms: Array.isArray(platforms) ? platforms : [],
    status: status === "published" ? "published" : "draft",
    link: typeof link === "string" ? link : null,
    createdAt: new Date().toISOString(),
  };

  const setting = await db.settings.findUnique({ where: { key: "social_posts" } });
  let posts: unknown[] = [];
  if (setting?.value) {
    try {
      posts = JSON.parse(setting.value);
    } catch {
      posts = [];
    }
  }
  posts = [post, ...posts];

  const json = JSON.stringify(posts);
  if (setting) {
    await db.settings.update({ where: { key: "social_posts" }, data: { value: json } });
  } else {
    await db.settings.create({ data: { key: "social_posts", value: json } });
  }

  return ok({ post, posts, message: "Draft post saved" });
}

/**
 * DELETE /api/v1/admin/social-media/posts
 * Body: { id: string } — removes a post from the stored list.
 */
export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id } = body ?? {};
  if (typeof id !== "string" || !id) {
    return error("Post id is required", 422);
  }

  const setting = await db.settings.findUnique({ where: { key: "social_posts" } });
  let posts: unknown[] = [];
  if (setting?.value) {
    try {
      posts = JSON.parse(setting.value);
    } catch {
      posts = [];
    }
  }
  posts = posts.filter((p: any) => p?.id !== id);

  const json = JSON.stringify(posts);
  if (setting) {
    await db.settings.update({ where: { key: "social_posts" }, data: { value: json } });
  } else {
    await db.settings.create({ data: { key: "social_posts", value: json } });
  }

  return ok({ posts, message: "Post deleted" });
}
