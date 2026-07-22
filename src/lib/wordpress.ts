/**
 * WordPress connection resolver.
 *
 * The admin can store the WordPress.com (or self-hosted WP) connection in the
 * database from the WordPress admin module UI — this lets them connect the
 * real site (e.g. https://playbeatdotdigital.wordpress.com) without editing
 * env vars or redeploying. If no DB entry exists, we fall back to the
 * WORDPRESS_API_URL / WORDPRESS_USERNAME / WORDPRESS_APP_PASSWORD env vars
 * (which point at the local WordPress Studio instance by default).
 *
 * Auth model: WordPress.com hosted sites + self-hosted WP (5.6+) both support
 * application passwords via Basic auth on the /wp-json/wp/v2 REST API. The
 * admin generates one from WP Admin → Users → Profile → Application Passwords.
 *
 * For WordPress.com specifically, the application password is created in the
 * WP.com dashboard under the site's settings, and the API URL is
 * https://<site>.wordpress.com/wp-json/wp/v2.
 */

import { db } from "@/lib/db";

export interface WordPressConnection {
  apiUrl: string;      // e.g. https://playbeatdotdigital.wordpress.com/wp-json/wp/v2
  username: string;    // WP.com account username or site admin login
  appPassword: string; // application password (spaces are fine — WP accepts them)
  label?: string;      // friendly label, e.g. "PlayBeat WP.com"
  isWpCom: boolean;    // true if the URL is a *.wordpress.com site
  updatedAt?: string;
}

const SETTING_KEY = "wordpress_connection";

/** Determine whether a URL points at a WordPress.com hosted site. */
function isWordPressCom(url: string): boolean {
  return /\.wordpress\.com\//i.test(url);
}

/**
 * Load the WordPress connection from the DB; fall back to env vars; finally
 * fall back to the local WordPress Studio default.
 *
 * Returns null only if nothing at all is configured.
 */
export async function getWordPressConnection(): Promise<WordPressConnection | null> {
  // 1. DB
  try {
    const setting = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (parsed?.apiUrl && parsed?.username && parsed?.appPassword) {
          return {
            apiUrl: String(parsed.apiUrl),
            username: String(parsed.username),
            appPassword: String(parsed.appPassword),
            label: parsed.label ? String(parsed.label) : undefined,
            isWpCom: isWordPressCom(String(parsed.apiUrl)),
            updatedAt: parsed.updatedAt,
          };
        }
      } catch {
        // corrupt JSON — ignore, fall through
      }
    }
  } catch {
    // DB unavailable — fall through to env
  }

  // 2. Env
  const envUrl = process.env.WORDPRESS_API_URL;
  const envUser = process.env.WORDPRESS_USERNAME;
  const envPass = process.env.WORDPRESS_APP_PASSWORD;
  if (envUrl && envUser && envPass) {
    return {
      apiUrl: envUrl,
      username: envUser,
      appPassword: envPass,
      label: "From .env",
      isWpCom: isWordPressCom(envUrl),
    };
  }

  // 3. Nothing configured
  return null;
}

/** Whether a WordPress connection is available (DB or env). */
export async function isWordPressConfigured(): Promise<boolean> {
  return Boolean(await getWordPressConnection());
}

/**
 * Build the Basic-auth header value for a given connection.
 * Application passwords may contain spaces — WP accepts them either way, but
 * we strip them for safety since some HTTP clients are picky.
 */
export function wpAuthHeader(conn: WordPressConnection): string {
  const cleanPass = conn.appPassword.replace(/\s+/g, " ").trim();
  return `Basic ${Buffer.from(`${conn.username}:${cleanPass}`).toString("base64")}`;
}

/** Persist a WordPress connection to the DB (upserts the settings row). */
export async function saveWordPressConnection(input: {
  apiUrl: string;
  username: string;
  appPassword: string;
  label?: string;
}): Promise<WordPressConnection> {
  const apiUrl = input.apiUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(apiUrl)) {
    throw new Error("API URL must start with http:// or https://");
  }
  if (!input.username.trim()) throw new Error("Username is required");
  if (!input.appPassword.trim()) throw new Error("Application password is required");

  const conn: WordPressConnection = {
    apiUrl,
    username: input.username.trim(),
    appPassword: input.appPassword.trim(),
    label: input.label?.trim() || undefined,
    isWpCom: isWordPressCom(apiUrl),
    updatedAt: new Date().toISOString(),
  };

  const value = JSON.stringify(conn);
  const existing = await db.settings.findUnique({ where: { key: SETTING_KEY } });
  if (existing) {
    await db.settings.update({ where: { key: SETTING_KEY }, data: { value } });
  } else {
    await db.settings.create({ data: { key: SETTING_KEY, value } });
  }
  return conn;
}

/** Remove the stored WordPress connection from the DB. */
export async function clearWordPressConnection(): Promise<void> {
  try {
    const existing = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (existing) {
      await db.settings.delete({ where: { key: SETTING_KEY } });
    }
  } catch {
    // best-effort
  }
}

/**
 * Test a WordPress connection by hitting the /users/me endpoint — this is the
 * canonical "is my auth working?" check for the WP REST API. Returns the
 * authenticated user's display name on success, or an error message.
 */
export async function testWordPressConnection(conn: WordPressConnection): Promise<{
  ok: boolean;
  message: string;
  user?: { id: number; name: string; username: string };
}> {
  const base = conn.apiUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${base}/users/me`, {
      headers: {
        Authorization: wpAuthHeader(conn),
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "Authentication failed — check username and application password" };
    }
    if (res.status === 404) {
      return { ok: false, message: "REST API not found at that URL — verify it ends with /wp-json/wp/v2" };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, message: `WordPress returned HTTP ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}` };
    }
    const j: any = await res.json();
    return {
      ok: true,
      message: `Connected as ${j?.name || j?.slug || "user"}`,
      user: {
        id: Number(j?.id) || 0,
        name: String(j?.name || "user"),
        username: String(j?.slug || j?.username || ""),
      },
    };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "Timed out contacting WordPress — check the URL"
        : e instanceof Error
          ? e.message
          : "Could not reach WordPress",
    };
  }
}
