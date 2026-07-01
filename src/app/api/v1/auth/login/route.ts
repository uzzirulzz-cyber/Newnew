import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit, validate, v } from "@/lib/api";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;
  await ensureSeeded();

  const body = await request.json().catch(() => ({}));
  const result = validate<{ email: string; password: string }>(body, {
    email: v.email(),
    password: v.required("Password"),
  });
  if (!result.valid) return error("Validation failed", 422, result.errors);

  const { email, password } = result.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return error("Invalid email or password", 401);
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role as "CUSTOMER" | "VENDOR" | "ADMIN",
    name: user.name,
  });
  await setAuthCookie(token);

  return ok({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
}
