import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/support/reply
 *
 * Appends a reply to a support ticket's `replies` JSON array.
 *
 * Body: {
 *   id: string,
 *   authorName: string,
 *   message: string,
 *   isStaff: boolean,
 * }
 *
 * The reply object shape is:
 *   { authorName, message, isStaff, createdAt: ISO string }
 *
 * Replies are stored as a JSON string column (PostgreSQL has no native
 * array-of-records type without a relation), so we read with JSON.parse
 * and write with JSON.stringify.
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { id, authorName, message, isStaff } = body;

  if (!id) return error("Ticket id is required", 422);
  if (!authorName) return error("authorName is required", 422);
  if (!message) return error("message is required", 422);

  try {
    const ticket = await db.supportTicket.findUnique({
      where: { id: String(id) },
      select: { id: true, ticketNumber: true, replies: true },
    });

    if (!ticket) return error("Ticket not found", 404);

    let replies: any[] = [];
    try {
      const parsed = JSON.parse(ticket.replies || "[]");
      if (Array.isArray(parsed)) replies = parsed;
    } catch {
      replies = [];
    }

    const newReply = {
      authorName: String(authorName),
      message: String(message),
      isStaff: Boolean(isStaff),
      createdAt: new Date().toISOString(),
    };
    replies.push(newReply);

    const updated = await db.supportTicket.update({
      where: { id: ticket.id },
      data: { replies: JSON.stringify(replies) },
    });

    return ok({
      ticket: {
        id: updated.id,
        ticketNumber: updated.ticketNumber,
        replies,
      },
      reply: newReply,
      message: "Reply added",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to add reply",
      500,
    );
  }
}
