import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getWordPressConnection, wpAuthHeader } from "@/lib/wordpress";

export const dynamic = "force-dynamic";

interface WpAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  source: "local" | "wordpress";
  wpUserId?: number;
}

/**
 * GET /api/v1/wordpress/account
 * Returns whether WordPress is reachable and the list of locally stored WP accounts.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  // Prefer the DB-backed connection; fall back to env.
  const conn = await getWordPressConnection();
  const available = Boolean(conn) || Boolean(process.env.WORDPRESS_API_URL);
  const apiUrl = conn?.apiUrl || process.env.WORDPRESS_API_URL || "http://localhost:8881/wp-json/wp/v2";

  const setting = await db.settings.findUnique({ where: { key: "wordpress_accounts" } });
  let accounts: WpAccount[] = [];
  if (setting?.value) {
    try {
      accounts = JSON.parse(setting.value);
    } catch {
      accounts = [];
    }
  }

  const safe = accounts.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    createdAt: a.createdAt,
    source: a.source,
    wpUserId: a.wpUserId,
  }));

  return ok({ available, apiUrl, accounts: safe });
}

/**
 * POST /api/v1/wordpress/account
 * Creates a WordPress user account. If a WordPress connection is configured
 * (DB-backed or env), attempts to create a real WP user via the WP REST API;
 * always stores locally under "wordpress_accounts".
 *
 * Body: { name, email, password }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { name, email, password } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return error("Name is required", 422);
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("Valid email is required", 422);
  }
  if (typeof password !== "string" || password.length < 6) {
    return error("Password must be at least 6 characters", 422);
  }

  // Load existing accounts
  const setting = await db.settings.findUnique({ where: { key: "wordpress_accounts" } });
  let accounts: WpAccount[] = [];
  if (setting?.value) {
    try {
      accounts = JSON.parse(setting.value);
    } catch {
      accounts = [];
    }
  }

  if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return error("An account with this email already exists", 409);
  }

  let wpUserId: number | undefined;
  let wpError: string | undefined;

  // If WP is configured, try to also create the user remotely.
  // Prefer the DB-backed connection; fall back to env vars.
  const conn = await getWordPressConnection();
  const apiUrl = conn?.apiUrl || process.env.WORDPRESS_API_URL;
  const authHeader = conn
    ? wpAuthHeader(conn)
    : (process.env.WORDPRESS_USERNAME && process.env.WORDPRESS_APP_PASSWORD
        ? `Basic ${Buffer.from(`${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`).toString("base64")}`
        : null);

  if (apiUrl && authHeader) {
    try {
      const base = apiUrl.replace(/\/$/, "");
      const url = new URL(`${base}/users`);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          username: email.split("@")[0] + "-" + Math.random().toString(36).slice(2, 6),
          email,
          name: name.trim(),
          password,
          roles: ["subscriber"],
        }),
      });
      if (res.ok) {
        const j = await res.json();
        wpUserId = j?.id;
      } else {
        wpError = `WordPress API error: ${res.status}`;
      }
    } catch (e) {
      wpError = e instanceof Error ? e.message : "WP user create failed";
    }
  }

  const account: WpAccount = {
    id: `wp-acc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: email.toLowerCase(),
    name: name.trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    source: wpUserId ? "wordpress" : "local",
    wpUserId,
  };

  accounts = [account, ...accounts];
  const json = JSON.stringify(accounts);
  if (setting) {
    await db.settings.update({ where: { key: "wordpress_accounts" }, data: { value: json } });
  } else {
    await db.settings.create({ data: { key: "wordpress_accounts", value: json } });
  }

  return ok({
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      createdAt: account.createdAt,
      source: account.source,
      wpUserId: account.wpUserId,
    },
    message: wpUserId
      ? "Account created and synced to WordPress"
      : wpError
        ? `Account saved locally (${wpError})`
        : "WordPress account created",
  });
}
