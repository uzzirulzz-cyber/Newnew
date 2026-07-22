import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { isWooCommerceConfigured } from "@/lib/woocommerce";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface WcCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
  source: "local" | "woocommerce";
  wcCustomerId?: number;
}

/**
 * GET /api/v1/woocommerce/account
 * Returns whether WooCommerce is configured and the list of locally registered customers.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const available = isWooCommerceConfigured();
  const storeUrl = process.env.WOOCOMMERCE_STORE_URL || "";

  const setting = await db.settings.findUnique({ where: { key: "woocommerce_customers" } });
  let customers: WcCustomer[] = [];
  if (setting?.value) {
    try {
      customers = JSON.parse(setting.value);
    } catch {
      customers = [];
    }
  }

  // Don't leak password hashes to the client
  const safe = customers.map((c) => ({
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    createdAt: c.createdAt,
    source: c.source,
    wcCustomerId: c.wcCustomerId,
  }));

  return ok({ available, storeUrl, customers: safe });
}

/**
 * POST /api/v1/woocommerce/account
 * Creates a customer account. If WC is configured, attempts to also create the customer
 * on the WC store; always stores locally under "woocommerce_customers" so the admin
 * can list/manage them regardless of WC availability.
 *
 * Body: { email, password, firstName?, lastName? }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { email, password, firstName, lastName } = body ?? {};

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("Valid email is required", 422);
  }
  if (typeof password !== "string" || password.length < 6) {
    return error("Password must be at least 6 characters", 422);
  }

  const first = typeof firstName === "string" ? firstName.trim() : "";
  const last = typeof lastName === "string" ? lastName.trim() : "";

  // Load existing customers
  const setting = await db.settings.findUnique({ where: { key: "woocommerce_customers" } });
  let customers: WcCustomer[] = [];
  if (setting?.value) {
    try {
      customers = JSON.parse(setting.value);
    } catch {
      customers = [];
    }
  }

  // De-dupe by email
  if (customers.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
    return error("A customer with this email already exists", 409);
  }

  let wcCustomerId: number | undefined;
  let wcError: string | undefined;

  // If WC is configured, try to also create the customer remotely
  if (isWooCommerceConfigured()) {
    try {
      const base = process.env.WOOCOMMERCE_STORE_URL!.replace(/\/$/, "");
      const url = new URL(`${base}/wp-json/wc/v3/customers`);
      url.searchParams.set("consumer_key", process.env.WOOCOMMERCE_CONSUMER_KEY!);
      url.searchParams.set("consumer_secret", process.env.WOOCOMMERCE_CONSUMER_SECRET!);
      const wcRes = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          first_name: first,
          last_name: last,
          username: email.split("@")[0] + "-" + Math.random().toString(36).slice(2, 6),
          password,
        }),
      });
      if (wcRes.ok) {
        const wcJson = await wcRes.json();
        wcCustomerId = wcJson?.id;
      } else {
        wcError = `WooCommerce API error: ${wcRes.status}`;
      }
    } catch (e) {
      wcError = e instanceof Error ? e.message : "WC customer create failed";
    }
  }

  const customer: WcCustomer = {
    id: `wc-cust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: email.toLowerCase(),
    firstName: first,
    lastName: last,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    source: wcCustomerId ? "woocommerce" : "local",
    wcCustomerId,
  };

  customers = [customer, ...customers];
  const json = JSON.stringify(customers);
  if (setting) {
    await db.settings.update({ where: { key: "woocommerce_customers" }, data: { value: json } });
  } else {
    await db.settings.create({ data: { key: "woocommerce_customers", value: json } });
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
    message: wcCustomerId
      ? "Customer created and synced to WooCommerce"
      : wcError
        ? `Customer saved locally (${wcError})`
        : "Customer account created",
  });
}
