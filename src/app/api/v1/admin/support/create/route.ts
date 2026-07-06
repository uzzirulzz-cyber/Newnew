import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/support/create
 *
 * Creates a new support ticket.
 *
 * Body: {
 *   customerName: string,
 *   customerEmail: string,
 *   subject: string,
 *   description: string,
 *   priority?: "low" | "medium" | "high" | "urgent",  // default "medium"
 *   category?: string,
 * }
 *
 * Auto-generates a ticketNumber of the form `TKT-XXXX` where XXXX is a
 * zero-padded 4-digit number based on (current ticket count + 1). Status
 * starts at "open" and replies is initialized to "[]".
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { customerName, customerEmail, subject, description, priority, category } = body;

  if (!customerName) return error("customerName is required", 422);
  if (!customerEmail) return error("customerEmail is required", 422);
  if (!subject) return error("subject is required", 422);
  if (!description) return error("description is required", 422);

  try {
    // Generate next ticket number based on current count
    const count = await db.supportTicket.count();
    const ticketNumber = `TKT-${String(count + 1).padStart(4, "0")}`;

    const ticket = await db.supportTicket.create({
      data: {
        ticketNumber,
        customerName: String(customerName),
        customerEmail: String(customerEmail),
        subject: String(subject),
        description: String(description),
        priority: priority || "medium",
        category: category || null,
        status: "open",
        replies: "[]",
      },
    });

    return ok(
      {
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          customerName: ticket.customerName,
          customerEmail: ticket.customerEmail,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          replies: [],
          createdAt: ticket.createdAt,
        },
        message: `Ticket ${ticket.ticketNumber} created`,
      },
      201,
    );
  } catch (e: any) {
    // Retry ticket number generation on uniqueness collision
    if (e?.code === "P2002") {
      try {
        const count = await db.supportTicket.count();
        const ticketNumber = `TKT-${String(count + 1).padStart(4, "0")}`;
        const ticket = await db.supportTicket.create({
          data: {
            ticketNumber,
            customerName: String(customerName),
            customerEmail: String(customerEmail),
            subject: String(subject),
            description: String(description),
            priority: priority || "medium",
            category: category || null,
            status: "open",
            replies: "[]",
          },
        });
        return ok(
          {
            ticket: {
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              customerName: ticket.customerName,
              customerEmail: ticket.customerEmail,
              subject: ticket.subject,
              status: ticket.status,
              priority: ticket.priority,
              category: ticket.category,
              replies: [],
              createdAt: ticket.createdAt,
            },
            message: `Ticket ${ticket.ticketNumber} created`,
          },
          201,
        );
      } catch (e2) {
        return error(
          e2 instanceof Error ? e2.message : "Failed to create ticket",
          500,
        );
      }
    }
    return error(
      e instanceof Error ? e.message : "Failed to create ticket",
      500,
    );
  }
}
