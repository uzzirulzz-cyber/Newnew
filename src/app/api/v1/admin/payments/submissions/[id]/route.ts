import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/payments/submissions/[id]
 * Body: { status: "confirmed" | "rejected", adminNote?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, adminNote } = body;

  if (!["confirmed", "rejected"].includes(status)) {
    return error("Status must be 'confirmed' or 'rejected'", 422);
  }

  const submission = await db.paymentSubmission.update({
    where: { id },
    data: { status, adminNote: adminNote || null },
  });

  // If confirmed, update the linked order to COMPLETED
  if (status === "confirmed" && submission.orderId) {
    await db.order.update({
      where: { id: submission.orderId },
      data: { status: "COMPLETED" },
    }).catch(() => {});

    if (submission.orderId) {
      const order = await db.order.findUnique({
        where: { id: submission.orderId },
        include: { payment: true },
      });
      if (order?.paymentId) {
        await db.payment.update({
          where: { id: order.paymentId },
          data: { status: "COMPLETED", provider: submission.method.toUpperCase() },
        }).catch(() => {});
      }
    }
  }

  return ok({ submission, message: `Payment ${status}` });
}
