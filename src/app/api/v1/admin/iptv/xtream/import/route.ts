import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/iptv/xtream/import
 *
 * Server-side proxy that talks to an Xtream Codes server and imports the
 * channels it returns into the local IptvChannel collection.
 *
 * Running this on the server (rather than from the browser) avoids CORS
 * restrictions — browsers block cross-origin fetches to arbitrary Xtream
 * host URLs, but the Next.js server can reach them directly.
 *
 * Body:
 *   {
 *     hostUrl: string,        // e.g. http://server.com:8080
 *     username: string,       // Xtream username
 *     password: string,       // Xtream password
 *     profileName?: string,   // used as the default category prefix
 *     limit?: number,         // cap per content type (default 500, max 2000)
 *     types?: ("live" | "vod" | "series")[]  // default ["live"]
 *   }
 *
 * Returns:
 *   { imported, skipped, live, vod, series, profileName, message }
 */
const VALID_TYPES = new Set(["live", "vod", "series"]);

/** Fetch JSON from a URL with a timeout, returning [] on non-array results. */
async function fetchJsonArray(url: string, timeoutMs = 30_000): Promise<any[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const hostUrlRaw = String(body?.hostUrl ?? "").trim();
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");
  const profileName = String(body?.profileName ?? "").trim() || "Xtream";
  const limit = Math.min(Math.max(Number(body?.limit) || 500, 1), 2000);
  const types: string[] = Array.isArray(body?.types) && body.types.length
    ? body.types.filter((t: any) => VALID_TYPES.has(String(t)))
    : ["live"];

  if (!types.length) return error("No valid content types selected", 422);
  if (!hostUrlRaw) return error("hostUrl is required", 422);
  if (!username) return error("username is required", 422);
  if (!password) return error("password is required", 422);

  const hostUrl = hostUrlRaw.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(hostUrl)) {
    return error("hostUrl must include the scheme, e.g. http://server.com:8080", 422);
  }

  const apiBase = `${hostUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    // --- 1. Authenticate ----------------------------------------------------
    // The player_api.php endpoint returns user info when called with no action.
    // If the credentials are wrong, it returns { user_info: { auth: 0 } }.
    let authJson: any = null;
    try {
      const authRes = await fetch(apiBase, { signal: AbortSignal.timeout(20_000) });
      if (!authRes.ok) {
        return error(
          `Xtream server returned HTTP ${authRes.status} — check the host URL`,
          502,
        );
      }
      authJson = await authRes.json();
    } catch (e: any) {
      const msg = e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out connecting to the Xtream server — check the host URL"
        : "Could not reach the Xtream server — check the host URL";
      return error(msg, 502);
    }

    if (!authJson || !authJson.user_info) {
      return error(
        "Xtream server returned an unexpected response — verify the URL is an Xtream Codes portal",
        502,
      );
    }
    if (authJson.user_info.auth === 0) {
      return error("Xtream authentication failed — check username and password", 401);
    }

    const stats = { live: 0, vod: 0, series: 0, imported: 0, skipped: 0 };
    const categoryPrefix = profileName ? `${profileName} / ` : "";

    // --- 2. Live streams ----------------------------------------------------
    if (types.includes("live")) {
      const streams = await fetchJsonArray(`${apiBase}&action=get_live_streams`);
      stats.live = streams.length;
      for (const stream of streams.slice(0, limit)) {
        try {
          await db.iptvChannel.create({
            data: {
              name: String(stream.name || `Live ${stream.stream_id}`),
              streamUrl: `${hostUrl}/live/${username}/${password}/${stream.stream_id}.m3u8`,
              logoUrl: stream.stream_icon || null,
              category: `${categoryPrefix}${stream.category_name || "Live"}`,
              isHD: /\b(HD|4K|UHD|1080|720)\b/i.test(String(stream.name || "")),
              status: "active",
            },
          });
          stats.imported++;
        } catch {
          stats.skipped++;
        }
      }
    }

    // --- 3. VOD (movies) ----------------------------------------------------
    if (types.includes("vod")) {
      const streams = await fetchJsonArray(`${apiBase}&action=get_vod_streams`);
      stats.vod = streams.length;
      for (const stream of streams.slice(0, limit)) {
        try {
          const ext = String(stream.container_extension || "mp4");
          await db.iptvChannel.create({
            data: {
              name: String(stream.name || `Movie ${stream.stream_id}`),
              streamUrl: `${hostUrl}/movie/${username}/${password}/${stream.stream_id}.${ext}`,
              logoUrl: stream.stream_icon || null,
              category: `${categoryPrefix}VOD`,
              isHD: /\b(HD|4K|UHD|1080|720)\b/i.test(String(stream.name || "")),
              status: "active",
            },
          });
          stats.imported++;
        } catch {
          stats.skipped++;
        }
      }
    }

    // --- 4. Series ----------------------------------------------------------
    if (types.includes("series")) {
      const streams = await fetchJsonArray(`${apiBase}&action=get_series`);
      stats.series = streams.length;
      for (const stream of streams.slice(0, limit)) {
        try {
          await db.iptvChannel.create({
            data: {
              name: String(stream.name || `Series ${stream.series_id}`),
              streamUrl: `${hostUrl}/series/${username}/${password}/${stream.series_id}.mp4`,
              logoUrl: stream.cover || null,
              category: `${categoryPrefix}Series`,
              isHD: false,
              status: "active",
            },
          });
          stats.imported++;
        } catch {
          stats.skipped++;
        }
      }
    }

    return ok({
      ...stats,
      profileName,
      message: `Imported ${stats.imported} channels from Xtream "${profileName}" (live: ${stats.live}, vod: ${stats.vod}, series: ${stats.series})`,
    });
  } catch (e) {
    console.error("[admin/iptv/xtream/import] error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to import from Xtream server",
      500,
    );
  }
}
