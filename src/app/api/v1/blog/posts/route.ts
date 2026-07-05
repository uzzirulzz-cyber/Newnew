import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";

/**
 * GET /api/v1/blog/posts
 *
 * Returns the list of published blog posts. Backed by hardcoded sample data
 * for now — wire this up to a real Blog model once one exists.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 120);
  if (limited) return limited;

  const items = [
    {
      id: "post-1",
      slug: "welcome-to-our-blog",
      title: "Welcome to our blog",
      excerpt:
        "A short introduction to what we're building and what you can expect to read here in the coming weeks.",
      tags: ["Announcement", "Company"],
      coverImage: "",
      content:
        "Welcome! This is the first post on our brand-new blog. Over the coming weeks we'll be sharing product updates, behind-the-scenes stories, and deep dives into the technology that powers our platform.\n\nThanks for stopping by — we're glad you're here.",
      publishedAt: "2026-01-12T09:00:00.000Z",
      status: "published",
    },
    {
      id: "post-2",
      slug: "shipping-faster-with-design-systems",
      title: "Shipping faster with design systems",
      excerpt:
        "How a small, well-documented design system can unlock velocity for product teams of any size.",
      tags: ["Design", "Engineering"],
      coverImage: "",
      content:
        "Design systems aren't just about consistency — they're about velocity. When every team can reach for the same primitives, the cost of trying an idea drops to almost zero.\n\nIn this post we walk through the components, tokens, and documentation patterns that have worked for us.",
      publishedAt: "2026-02-04T14:30:00.000Z",
      status: "published",
    },
    {
      id: "post-3",
      slug: "the-care-and-feeding-of-api-clients",
      title: "The care and feeding of API clients",
      excerpt:
        "A few simple rules for keeping your frontend API layer readable, testable, and resilient.",
      tags: ["Engineering", "APIs"],
      coverImage: "",
      content:
        "Your API client is the boundary between 'the network' and 'your UI'. Treating it well pays dividends for years.\n\nWe cover caching, error normalization, retries, and the small ergonomic helpers that make a client feel like home.",
      publishedAt: "2026-03-18T11:15:00.000Z",
      status: "published",
    },
    {
      id: "post-4",
      slug: "hiring-our-first-product-designer",
      title: "Hiring our first product designer",
      excerpt:
        "We're looking for a designer who loves the messy middle of product work as much as the polish.",
      tags: ["Hiring", "Design"],
      coverImage: "",
      content:
        "Our team is growing and we're ready to bring on our first dedicated product designer. If you enjoy sitting next to engineers, prototyping in code, and shipping to real users every week — we'd love to talk.",
      publishedAt: "2026-04-22T08:45:00.000Z",
      status: "published",
    },
    {
      id: "post-5",
      slug: "changelog-april-2026",
      title: "Changelog — April 2026",
      excerpt:
        "New analytics dashboard, faster search, and a long list of bug fixes shipped this month.",
      tags: ["Changelog", "Product"],
      coverImage: "",
      content:
        "Here's everything we shipped in April: a redesigned analytics dashboard, 3x faster product search, webhook delivery retries, and over forty smaller fixes and polish items.",
      publishedAt: "2026-04-30T17:00:00.000Z",
      status: "published",
    },
  ];

  return ok({ items });
}
