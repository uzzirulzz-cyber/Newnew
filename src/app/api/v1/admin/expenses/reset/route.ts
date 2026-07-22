import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/admin/expenses/reset
 *
 * Clears ALL expense records. Returns the count of deleted documents.
 */
export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 5); // strict limit — destructive
  if (limited) return limited;

  try {
    const result = await db.expense.deleteMany({});
    console.log("[admin/expenses/reset] Cleared:", result.count);
    return ok({
      cleared: result.count,
      message: `Cleared ${result.count} expense records.`,
    });
  } catch (e) {
    console.error("[admin/expenses/reset] Failed:", e);
    return error(
      e instanceof Error ? e.message : "Reset failed",
      500,
    );
  }
}
