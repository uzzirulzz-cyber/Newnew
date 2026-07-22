import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/iptv/import-m3u
 *
 * Fetches M3U playlist from Free-TV/IPTV GitHub repo (or custom URL),
 * parses it, and imports all channels into MongoDB.
 *
 * Body: {
 *   url?: string,      // M3U URL (defaults to Free-TV/IPTV master playlist)
 *   category?: string, // filter by category/country (e.g. "Pakistan", "USA")
 * }
 *
 * The Free-TV/IPTV repo has ~1900+ free TV channels from 90+ countries.
 * URL: https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8
 */
const DEFAULT_M3U_URL = "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8";

interface ParsedChannel {
  name: string;
  streamUrl: string;
  logo?: string;
  category?: string;
  country?: string;
  language?: string;
  tvgId?: string;
}

function parseM3U(content: string, categoryFilter?: string): ParsedChannel[] {
  const lines = content.split("\n");
  const channels: ParsedChannel[] = [];
  let currentInfo: Partial<ParsedChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      // Parse EXTINF line
      currentInfo = {};

      // Extract tvg-name
      const nameMatch = line.match(/tvg-name="([^"]*)"/);
      if (nameMatch) currentInfo.name = nameMatch[1];

      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      if (logoMatch) currentInfo.logo = logoMatch[1];

      // Extract tvg-id
      const idMatch = line.match(/tvg-id="([^"]*)"/);
      if (idMatch) currentInfo.tvgId = idMatch[1];

      // Extract tvg-country
      const countryMatch = line.match(/tvg-country="([^"]*)"/);
      if (countryMatch) currentInfo.country = countryMatch[1];

      // Extract group-title (category)
      const groupMatch = line.match(/group-title="([^"]*)"/);
      if (groupMatch) currentInfo.category = groupMatch[1];

      // Extract channel name from end of line (after last comma)
      const commaIdx = line.lastIndexOf(",");
      if (commaIdx >= 0 && !currentInfo.name) {
        currentInfo.name = line.substring(commaIdx + 1).trim();
      }
    } else if (line && !line.startsWith("#") && currentInfo.name) {
      // This is the stream URL
      currentInfo.streamUrl = line;

      // Apply category filter if provided
      if (!categoryFilter || 
          (currentInfo.category || "").toLowerCase().includes(categoryFilter.toLowerCase()) ||
          (currentInfo.country || "").toLowerCase().includes(categoryFilter.toLowerCase())) {
        channels.push(currentInfo as ParsedChannel);
      }

      currentInfo = {};
    }
  }

  return channels;
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 5); // Low rate limit — this is a heavy operation
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const m3uUrl = body.url || DEFAULT_M3U_URL;
  const categoryFilter = body.category || undefined;

  try {
    // Fetch M3U playlist
    const res = await fetch(m3uUrl, {
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!res.ok) {
      return error(`Failed to fetch M3U playlist: HTTP ${res.status}`, 502);
    }

    const m3uContent = await res.text();

    if (!m3uContent.startsWith("#EXTM3U")) {
      return error("Invalid M3U format — file must start with #EXTM3U", 422);
    }

    // Parse channels
    const channels = parseM3U(m3uContent, categoryFilter);

    if (channels.length === 0) {
      return error("No channels found in M3U playlist" + (categoryFilter ? ` matching "${categoryFilter}"` : ""), 404);
    }

    // Import to MongoDB
    let imported = 0;
    let skipped = 0;

    for (const ch of channels) {
      // Check if channel already exists (by name + streamUrl)
      const existing = await db.iptvChannel.findFirst({
        where: {
          name: ch.name,
          streamUrl: ch.streamUrl,
        },
      }).catch(() => null);

      if (existing) {
        skipped++;
        continue;
      }

      await db.iptvChannel.create({
        data: {
          name: ch.name,
          category: ch.category || null,
          streamUrl: ch.streamUrl,
          logoUrl: ch.logo || null,
          language: null,
          country: ch.country || null,
          isHD: ch.name.toLowerCase().includes("hd") || ch.name.toLowerCase().includes("4k"),
          status: "active",
          viewerCount: 0,
          epgId: ch.tvgId || null,
        },
      });
      imported++;
    }

    return ok({
      imported,
      skipped,
      total: channels.length,
      source: m3uUrl,
      filter: categoryFilter || "all",
      message: `Imported ${imported} channels (${skipped} already existed) from ${channels.length} total in playlist.`,
    });
  } catch (e: any) {
    if (e?.name === "TimeoutError") {
      return error("M3U fetch timed out — try again or use a smaller playlist", 504);
    }
    return error(e instanceof Error ? e.message : "M3U import failed", 500);
  }
}
