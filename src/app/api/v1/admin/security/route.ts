import { NextRequest } from "next/server";
import crypto from "crypto";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Parse a JSON string field into an array (for ipWhitelist / firewallRules).
function parseArray<T = any>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    // ignore
  }
  return fallback;
}

function serialize(s: any) {
  return {
    id: s.id,
    twoFactorEnabled: !!s.twoFactorEnabled,
    twoFactorSecret: s.twoFactorSecret ?? null,
    ipWhitelist: parseArray<string>(s.ipWhitelist, []),
    firewallRules: parseArray<any>(s.firewallRules, []),
    sessionTimeout: s.sessionTimeout ?? 60,
    passwordPolicy: s.passwordPolicy ?? "standard",
    createdAt: s.createdAt,
    updatedAt: s.updatedAt ?? s.createdAt,
  };
}

// Ensure a SecuritySetting record exists. The schema allows many records, but
// for the admin panel we treat it as a singleton (the first row).
async function getOrCreateSettings() {
  let settings = await db.securitySetting.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!settings) {
    settings = await db.securitySetting.create({ data: {} });
  }
  return settings;
}

// ----- GET /api/v1/admin/security — get the security settings singleton -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const settings = await getOrCreateSettings();
    return ok({ settings: serialize(settings) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to fetch security settings",
      500,
    );
  }
}

// ----- PUT /api/v1/admin/security — update security settings -----

export async function PUT(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const settings = await getOrCreateSettings();
  const data: any = {};

  if (body.twoFactorEnabled !== undefined) {
    data.twoFactorEnabled = !!body.twoFactorEnabled;
    // If disabling 2FA, clear the secret.
    if (!data.twoFactorEnabled) {
      data.twoFactorSecret = null;
    }
  }

  if (body.ipWhitelist !== undefined) {
    if (Array.isArray(body.ipWhitelist)) {
      // Validate each entry looks like an IP or CIDR.
      const cleaned = body.ipWhitelist
        .filter((s: unknown) => typeof s === "string" && s.trim())
        .map((s: string) => s.trim());
      for (const entry of cleaned) {
        if (!/^[0-9a-fA-F:.\/]+$/.test(entry)) {
          return error(`Invalid IP or CIDR: ${entry}`, 422);
        }
      }
      data.ipWhitelist = JSON.stringify(cleaned);
    } else {
      return error("ipWhitelist must be an array of strings", 422);
    }
  }

  if (body.firewallRules !== undefined) {
    if (Array.isArray(body.firewallRules)) {
      const cleaned = body.firewallRules
        .filter((r: any) => r && typeof r === "object")
        .map((r: any) => ({
          action: typeof r.action === "string" && ["allow", "deny"].includes(r.action) ? r.action : "deny",
          ip: typeof r.ip === "string" ? r.ip.trim() : "*",
          port: typeof r.port === "string" || typeof r.port === "number" ? String(r.port) : "*",
          protocol: typeof r.protocol === "string" && ["tcp", "udp", "any"].includes(r.protocol.toLowerCase())
            ? r.protocol.toLowerCase()
            : "any",
          note: typeof r.note === "string" ? r.note : "",
        }));
      data.firewallRules = JSON.stringify(cleaned);
    } else {
      return error("firewallRules must be an array", 422);
    }
  }

  if (body.sessionTimeout !== undefined) {
    const t = typeof body.sessionTimeout === "string" ? parseInt(body.sessionTimeout, 10) : body.sessionTimeout;
    if (typeof t !== "number" || !Number.isFinite(t) || t < 1 || t > 1440) {
      return error("sessionTimeout must be a number between 1 and 1440 minutes", 422);
    }
    data.sessionTimeout = Math.round(t);
  }

  if (body.passwordPolicy !== undefined) {
    const p = typeof body.passwordPolicy === "string" ? body.passwordPolicy : "";
    if (!["standard", "strict", "maximum"].includes(p)) {
      return error("passwordPolicy must be one of: standard, strict, maximum", 422);
    }
    data.passwordPolicy = p;
  }

  try {
    const updated = await db.securitySetting.update({
      where: { id: settings.id },
      data,
    });
    return ok({ settings: serialize(updated) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update security settings",
      500,
    );
  }
}

// Internal helper exported for the 2FA route to reuse the singleton accessor.
export { getOrCreateSettings };
// Re-export crypto for downstream module-level use.
export { crypto as _crypto };
