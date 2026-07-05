import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/settings
 * PUT /api/v1/admin/settings
 *
 * Reads/writes platform-wide settings to the Settings table (key-value store).
 * The admin Settings module has 9 tabs (general, branding, smtp, sms, storage,
 * cdn, languages, currency, taxes) — each is stored as a separate Settings row
 * with a unique key.
 */

const SETTING_KEYS = [
  "general",
  "branding",
  "smtp",
  "sms",
  "storage",
  "cdn",
  "languages",
  "currency",
  "taxes",
] as const;

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const settings = await db.settings.findMany({
      where: { key: { in: [...SETTING_KEYS] } },
    });

    // Build a { key: value } object, parsing JSON values
    const result: Record<string, any> = {};
    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }

    return ok({ settings: result });
  } catch (e) {
    // DB cold start — return empty settings (frontend uses defaults)
    return ok({ settings: {} });
  }
}

export async function PUT(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));

  if (!body || typeof body !== "object") {
    return error("Settings object is required", 422);
  }

  try {
    // Upsert each provided key
    const updates: string[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (!SETTING_KEYS.includes(key as any)) continue;
      const jsonValue = JSON.stringify(value);
      await db.settings.upsert({
        where: { key },
        update: { value: jsonValue },
        create: { key, value: jsonValue },
      });
      updates.push(key);
    }

    return ok({
      saved: updates,
      message: `Saved ${updates.length} setting${updates.length === 1 ? "" : "s"}`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to save settings",
      500,
    );
  }
}
