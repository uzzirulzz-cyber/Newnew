import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/mobile/config
 * PUT /api/v1/admin/mobile/config
 *
 * Reads/writes the `mobile` group stored inside the Settings table.
 *
 * GET returns:  { config: { appName, bundleId, iosVersion, androidVersion, fcmKey, apnsKey } }
 * PUT body:     { config: { ...partial } }   (deep-merged with existing)
 * PUT returns:  { config: { ...full mobile config... } }
 */

const DEFAULT_MOBILE_CONFIG = {
  appName: "PlayBeat Digital",
  bundleId: "com.playbeat.digital",
  iosVersion: "1.0.0",
  androidVersion: "1.0.0",
  fcmKey: "",
  apnsKey: "",
};

function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T extends Record<string, any>>(
  tgt: T,
  src: Record<string, any>,
): T {
  const out: Record<string, any> = { ...tgt };
  for (const [k, v] of Object.entries(src)) {
    if (v === undefined) continue;
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, any>, v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

async function loadMobileConfig(): Promise<Record<string, any>> {
  let row: any = null;
  try {
    row = await db.settings.findUnique({ where: { key: "mobile" } });
  } catch {
    // ignore
  }
  let stored: Record<string, any> = {};
  if (row) {
    try {
      const parsed = JSON.parse(row.value);
      if (isPlainObject(parsed)) stored = parsed;
    } catch {
      // ignore
    }
  }
  return deepMerge(DEFAULT_MOBILE_CONFIG, stored);
}

// ----- GET -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const config = await loadMobileConfig();
    return ok({ config });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to load mobile config",
      500,
    );
  }
}

// ----- PUT -----

export async function PUT(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const incoming = body.config && isPlainObject(body.config) ? body.config : null;
  if (!incoming) {
    return error("Expected { config: { ...partial } }", 422);
  }

  try {
    const current = await loadMobileConfig();
    const merged = deepMerge(current, incoming);
    const jsonValue = JSON.stringify(merged);
    await db.settings.upsert({
      where: { key: "mobile" },
      update: { value: jsonValue },
      create: { key: "mobile", value: jsonValue },
    });
    return ok({ config: merged });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to save mobile config",
      500,
    );
  }
}
