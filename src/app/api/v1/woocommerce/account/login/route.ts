import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/woocommerce/account/login
 * Verifies customer credentials stored under "woocommerce_customers".
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

  const setting = await db.settings.findUnique({ where: { key: "woocommerce_customers" } });
  let customers: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    createdAt: string;
    source: string;
    wcCustomerId?: number;
  }> = [];
  if (setting?.value) {
    try {
      customers = JSON.parse(setting.value);
    } catch {
      customers = [];
    }
  }

  const customer = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    return error("Invalid email or password", 401);
  }

  return ok({
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      createdAt: customer.createdAt,
      source: customer.source,
      wcCustomerId: customer.wcCustomerId,
    },
    message: "Logged in successfully",
  });
}
