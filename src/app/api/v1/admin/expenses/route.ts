import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = [
  "office-bills",
  "electricity",
  "internet",
  "stationary",
  "rent",
  "salaries",
  "marketing",
  "tools",
  "other",
] as const;

const ALLOWED_STATUS = ["recorded", "paid", "pending"] as const;

// Default typeCode mapping per category — used only when the client omits typeCode.
const DEFAULT_TYPE_CODE: Record<string, string> = {
  "office-bills": "OFFICE",
  electricity: "ELEC",
  internet: "NET",
  stationary: "STAT",
  rent: "RENT",
  salaries: "SAL",
  marketing: "MKT",
  tools: "TOOL",
  other: "OTH",
};

/**
 * GET /api/v1/admin/expenses
 *
 * List all company-side expenses, sorted by expenseDate desc.
 * Supports:
 *   ?category=office-bills   — filter by category
 *   ?search=electricity      — search title / description / typeCode
 *   ?page=1                  — pagination (default 1)
 *   ?limit=20                — items per page (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const category = searchParams.get("category")?.trim() || "";
  const search = searchParams.get("search")?.trim() || "";

  try {
    const where: any = {};
    if (category && ALLOWED_CATEGORIES.includes(category as any)) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { typeCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      db.expense.count({ where }),
      db.expense.findMany({
        where,
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ok({
      items: items.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        category: e.category,
        typeCode: e.typeCode,
        amount: e.amount,
        currency: e.currency,
        expenseDate: e.expenseDate,
        status: e.status,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    console.error("[admin/expenses] GET error:", e);
    return ok({ items: [], total: 0, page, limit, totalPages: 1 });
  }
}

/**
 * POST /api/v1/admin/expenses
 *
 * Create a new expense record. Required: title, amount (>0), category.
 * Optional: description, typeCode, currency, expenseDate, status.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  // ---- title ----
  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return error("Title is required", 422);
  }

  // ---- category ----
  const category =
    typeof body.category === "string" ? body.category.trim().toLowerCase() : "";
  if (!ALLOWED_CATEGORIES.includes(category as any)) {
    return error(
      `category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
      422,
    );
  }

  // ---- amount ----
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return error("amount is required and must be greater than 0", 422);
  }

  // ---- typeCode (auto-suggest from category if missing) ----
  const typeCode =
    typeof body.typeCode === "string" && body.typeCode.trim()
      ? body.typeCode.trim().toUpperCase()
      : DEFAULT_TYPE_CODE[category] || "OTH";

  // ---- description ----
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  // ---- currency ----
  const currency =
    typeof body.currency === "string" && body.currency.trim()
      ? body.currency.trim().toUpperCase()
      : "PKR";

  // ---- expenseDate (ISO string) ----
  let expenseDate =
    typeof body.expenseDate === "string" && body.expenseDate.trim()
      ? body.expenseDate.trim()
      : "";
  // Validate parseable date; fall back to today.
  const parsed = expenseDate ? new Date(expenseDate) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return error("expenseDate must be a valid ISO date string", 422);
  }
  expenseDate = parsed.toISOString();

  // ---- status ----
  const status =
    typeof body.status === "string" &&
    ALLOWED_STATUS.includes(body.status.toLowerCase() as any)
      ? body.status.toLowerCase()
      : "recorded";

  try {
    const expense = await db.expense.create({
      data: {
        title,
        description,
        category,
        typeCode,
        amount,
        currency,
        expenseDate,
        status,
      },
    });
    return ok({ expense });
  } catch (e) {
    console.error("[admin/expenses] POST error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to create expense",
      500,
    );
  }
}
