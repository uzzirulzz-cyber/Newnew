import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/support/update
 *
 * Updates the status of a support ticket.
 *
 * Body: {
 *   id: string,
 *   status: "open" | "in_progress" | "resolved" | "closed",
 * }
 */
const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, status } = body;

  if (!id) return error("Ticket id is required", 422);
  if (!status) return error("status is required", 422);
  if (!ALLOWED_STATUSES.includes(String(status))) {
    return error(
      `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      422,
    );
  }

  try {
    const ticket = await db.supportTicket.update({
      where: { id: String(id) },
      data: { status: String(status) },
    });

    return ok({
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
      },
      message: `Ticket ${ticket.ticketNumber} updated to "${ticket.status}"`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update ticket",
      500,
    );
  }
}
