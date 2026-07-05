import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/finance/transactions
 *
 * Returns all transactions (admin view). Supports:
 *   ?status=  — filter by status (completed | pending | failed | refunded)
 *   ?type=    — filter by type (sale | refund | subscription | withdrawal)
 *   ?search=  — match transactionId or customerName (case-insensitive)
 *
 * Ordered by createdAt desc.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim() || "";
  const type = searchParams.get("type")?.trim() || "";
  const search = searchParams.get("search")?.trim() || "";

  try {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { transactionId: { contains: search } },
        { customerName: { contains: search } },
      ];
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok({ items: transactions });
  } catch (e) {
    console.error("[admin/finance/transactions] error:", e);
    return ok({ items: [] });
  }
}
