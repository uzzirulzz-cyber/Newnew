import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Strip the password field from a WordPressAccount record before returning it
// to the client. The hashed password stays in the DB — it never leaves the API.
function sanitize<T extends { password?: string }>(acc: T): Omit<T, "password"> {
  if (!acc) return acc;
  const { password: _pw, ...rest } = acc;
  return rest as Omit<T, "password">;
}

// Build a WordPress-style username from an email. Lowercases, strips the
// domain, replaces invalid chars with dashes, truncates to 60 chars.
function usernameFromEmail(email: string): string {
  const local = (email.split("@")[0] || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return local || "user";
}

// ----- GET /api/v1/admin/wordpress/accounts — list all accounts -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const accounts = await db.wordPressAccount.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok({ items: accounts.map(sanitize) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list WordPress accounts",
      500,
    );
  }
}

// ----- POST /api/v1/admin/wordpress/accounts — create account -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("A valid email is required", 422);
  }

  const password =
    typeof body.password === "string" ? body.password : "";
  if (password.length < 6) {
    return error("Password must be at least 6 characters", 422);
  }

  const firstName =
    typeof body.firstName === "string" && body.firstName.trim()
      ? body.firstName.trim()
      : null;
  const lastName =
    typeof body.lastName === "string" && body.lastName.trim()
      ? body.lastName.trim()
      : null;

  // Ensure email is unique
  const existing = await db.wordPressAccount.findUnique({
    where: { email },
  });
  if (existing) {
    return error("An account with this email already exists", 409);
  }

  const username = usernameFromEmail(email);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const account = await db.wordPressAccount.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        username,
        status: "active",
      },
    });
    return ok({ account: sanitize(account) }, 201);
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create WordPress account",
      500,
    );
  }
}
