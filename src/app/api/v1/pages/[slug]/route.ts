import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";

/**
 * GET /api/v1/pages/[slug]
 *
 * Returns the content for a static CMS page. Currently backed by hardcoded
 * content for /about — any other slug returns 404. Replace with a real
 * StaticPage model once one exists.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limited = applyRateLimit(request, 120);
  if (limited) return limited;

  const { slug } = await params;

  const pages: Record<string, { title: string; content: string; updatedAt: string }> = {
    about: {
      title: "About us",
      updatedAt: "2026-04-01T00:00:00.000Z",
      content:
        "## Our story\n\nWe started SiteBuilder in 2025 with a simple idea: launching a marketing site shouldn't take a week of yak-shaving. Today we power hundreds of sites for teams of every size.\n\n## Our values\n\n- **Ship every week.** Small, frequent releases beat big bang launches.\n- **Words matter.** Clear writing is the cheapest UX improvement there is.\n- **Boring tech, sharp execution.** We pick proven tools and use them well.\n\n## Get in touch\n\nWant to chat? Head over to our [contact page](/contact) — we'd love to hear from you.",
    },
  };

  const page = pages[slug];
  if (!page) return error("Page not found", 404);

  return ok({ page });
}
