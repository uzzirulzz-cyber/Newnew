import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/payments/submissions
 * Lists all payment submissions for admin verification.
 * Query: ?status=pending|confirmed|rejected|all
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";

  const where: any = {};
  if (status !== "all") where.status = status;

  const submissions = await db.paymentSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return ok({ items: submissions, total: submissions.length });
}
