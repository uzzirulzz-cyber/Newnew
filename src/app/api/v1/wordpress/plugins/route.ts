import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";

/**
 * GET /api/v1/wordpress/plugins?search=woocommerce&per_page=12
 *
 * Searches the official WordPress.org Plugin Directory via the
 * WordPress.org API. No authentication required — it's a public API.
 *
 * Docs: https://developer.wordpress.org/rest-api/reference/
 * Endpoint: https://api.wordpress.org/plugins/info/1.2/?action=query_plugins
 *
 * Returns plugin cards with: name, slug, version, author, rating,
 * downloads, active_installs, short_description, homepage, download_link,
 * icons (svg/png), banner.
 *
 * Also supports a "popular" mode (no search) that returns featured plugins.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const perPage = Math.min(Number(searchParams.get("per_page") || "12"), 50);
  const browse = searchParams.get("browse") || "popular"; // popular | new | updated | top-rated

  try {
    // WordPress.org Plugin Information API
    // https://developer.wordpress.org/rest-api/using-the-rest-api/
    const apiUrl = new URL("https://api.wordpress.org/plugins/info/1.2/");
    apiUrl.searchParams.set("action", "query_plugins");

    if (search.trim()) {
      // Search mode
      apiUrl.searchParams.set("request[search]", search.trim());
      apiUrl.searchParams.set("request[per_page]", String(perPage));
      apiUrl.searchParams.set("request[fields][downloadlink]", "1");
      apiUrl.searchParams.set("request[fields][icons]", "1");
      apiUrl.searchParams.set("request[fields][banners]", "1");
      apiUrl.searchParams.set("request[fields][active_installs]", "1");
      apiUrl.searchParams.set("request[fields][ratings]", "1");
    } else {
      // Browse mode (popular/new/updated/top-rated)
      apiUrl.searchParams.set("request[browse]", browse);
      apiUrl.searchParams.set("request[per_page]", String(perPage));
      apiUrl.searchParams.set("request[fields][downloadlink]", "1");
      apiUrl.searchParams.set("request[fields][icons]", "1");
      apiUrl.searchParams.set("request[fields][banners]", "1");
      apiUrl.searchParams.set("request[fields][active_installs]", "1");
      apiUrl.searchParams.set("request[fields][ratings]", "1");
    }

    const res = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) {
      return error(
        `WordPress.org API returned HTTP ${res.status}`,
        res.status,
      );
    }

    const data = await res.json();

    // Normalize the response into a simpler shape
    const plugins = (data.plugins || []).map((p: any) => ({
      slug: p.slug,
      name: p.name,
      version: p.version,
      author: typeof p.author === "string" ? p.author : p.author?.display_name || "",
      rating: p.rating || 0,                    // 0-100
      num_ratings: p.num_ratings || 0,
      downloads: p.downloaded || 0,
      active_installs: p.active_installs || 0,
      last_updated: p.last_updated || "",
      short_description: (p.short_description || "").slice(0, 200),
      homepage: p.homepage || `https://wordpress.org/plugins/${p.slug}/`,
      download_link: p.download_link || "",
      icons: {
        svg: p.icons?.svg || null,
        "1x": p.icons?.["1x"] || null,
        "2x": p.icons?.["2x"] || null,
      },
      banner: {
        low: p.banners?.low || null,
        high: p.banners?.high || null,
      },
      requires: p.requires || "",                // min WP version
      tested: p.tested || "",                    // tested up to WP version
      requires_php: p.requires_php || "",
    }));

    return ok({
      items: plugins,
      total: data.info?.results || plugins.length,
      pages: data.info?.pages || 1,
      browse: search.trim() ? "search" : browse,
      search: search.trim(),
      wordpressOrgUrl: "https://wordpress.org/plugins/",
    });
  } catch (e: any) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      return error("WordPress.org API timed out. Try again.", 504);
    }
    return error(
      e instanceof Error ? e.message : "Failed to fetch plugins",
      500,
    );
  }
}
