import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, error, applyRateLimit, validate, v } from "@/lib/api";
import { hashPassword, signToken, setAuthCookie, generateAffiliateCode } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;
  await ensureSeeded();

  const body = await request.json().catch(() => ({}));
  const result = validate<{ name: string; email: string; password: string }>(body, {
    name: v.required("Name"),
    email: v.email(),
    password: v.minLen(6, "Password"),
  });
  if (!result.valid) return error("Validation failed", 422, result.errors);

  const { name, email, password } = result.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return error("An account with this email already exists", 409);

  const user = await db.user.create({
    data: { email, name, passwordHash: hashPassword(password), role: "CUSTOMER" },
  });

  await db.affiliate.create({
    data: { userId: user.id, code: generateAffiliateCode(name), commissionRate: 10 },
  });

  const token = signToken({ sub: user.id, email: user.email, role: "CUSTOMER", name: user.name });
  await setAuthCookie(token);

  return ok(
    {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    },
    201,
  );
}
