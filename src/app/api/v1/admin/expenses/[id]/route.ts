import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

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

const UPDATEABLE_FIELDS = [
  "title",
  "description",
  "category",
  "typeCode",
  "amount",
  "currency",
  "expenseDate",
  "status",
] as const;

/**
 * GET /api/v1/admin/expenses/[id] — single expense record.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid expense id", 422);
  }

  try {
    const expense = await db.expense.findUnique({ where: { id } });
    if (!expense) {
      return error("Expense not found", 404);
    }
    return ok({ expense });
  } catch (e) {
    console.error("[admin/expenses/[id]] GET error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to fetch expense",
      500,
    );
  }
}

/**
 * PATCH /api/v1/admin/expenses/[id] — partial update.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid expense id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing) {
    return error("Expense not found", 404);
  }

  // Build update payload from allowed fields only.
  const data: any = {};
  for (const field of UPDATEABLE_FIELDS) {
    if (body[field] === undefined) continue;

    if (field === "title") {
      const t = typeof body.title === "string" ? body.title.trim() : "";
      if (!t) return error("title cannot be empty", 422);
      data.title = t;
    } else if (field === "description") {
      data.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    } else if (field === "category") {
      const c =
        typeof body.category === "string"
          ? body.category.trim().toLowerCase()
          : "";
      if (!ALLOWED_CATEGORIES.includes(c as any)) {
        return error(
          `category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
          422,
        );
      }
      data.category = c;
    } else if (field === "typeCode") {
      data.typeCode =
        typeof body.typeCode === "string" && body.typeCode.trim()
          ? body.typeCode.trim().toUpperCase()
          : existing.typeCode;
    } else if (field === "amount") {
      const a = Number(body.amount);
      if (!Number.isFinite(a) || a <= 0) {
        return error("amount must be greater than 0", 422);
      }
      data.amount = a;
    } else if (field === "currency") {
      data.currency =
        typeof body.currency === "string" && body.currency.trim()
          ? body.currency.trim().toUpperCase()
          : existing.currency;
    } else if (field === "expenseDate") {
      const parsed = new Date(body.expenseDate);
      if (Number.isNaN(parsed.getTime())) {
        return error("expenseDate must be a valid ISO date string", 422);
      }
      data.expenseDate = parsed.toISOString();
    } else if (field === "status") {
      const s =
        typeof body.status === "string" ? body.status.toLowerCase() : "";
      if (!ALLOWED_STATUS.includes(s as any)) {
        return error(
          `status must be one of: ${ALLOWED_STATUS.join(", ")}`,
          422,
        );
      }
      data.status = s;
    }
  }

  try {
    const expense = await db.expense.update({ where: { id }, data });
    return ok({ expense });
  } catch (e) {
    console.error("[admin/expenses/[id]] PATCH error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to update expense",
      500,
    );
  }
}

/**
 * DELETE /api/v1/admin/expenses/[id] — delete a single expense.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid expense id", 422);
  }

  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing) {
    return error("Expense not found", 404);
  }

  try {
    await db.expense.delete({ where: { id } });
    return ok({ success: true, id });
  } catch (e) {
    console.error("[admin/expenses/[id]] DELETE error:", e);
    return error(
      e instanceof Error ? e.message : "Failed to delete expense",
      500,
    );
  }
}
