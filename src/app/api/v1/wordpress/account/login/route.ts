import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/wordpress/account/login
 * Verifies account credentials stored under "wordpress_accounts".
 * Body: { email, password }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { email, password } = body ?? {};

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("Valid email is required", 422);
  }
  if (typeof password !== "string" || !password) {
    return error("Password is required", 422);
  }

  const setting = await db.settings.findUnique({ where: { key: "wordpress_accounts" } });
  let accounts: Array<{
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: string;
    source: string;
    wpUserId?: number;
  }> = [];
  if (setting?.value) {
    try {
      accounts = JSON.parse(setting.value);
    } catch {
      accounts = [];
    }
  }

  const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return error("Invalid email or password", 401);
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
    message: "Logged in successfully",
  });
}
