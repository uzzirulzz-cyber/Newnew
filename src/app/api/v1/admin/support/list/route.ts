import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/support/list
 *
 * Returns all support tickets. Supports:
 *   ?status=    — filter by status (open | in_progress | resolved | closed)
 *   ?priority=  — filter by priority (low | medium | high | urgent)
 *   ?search=    — search ticketNumber, subject, or customerName
 *
 * The `replies` field is stored as a JSON string in PostgreSQL and is
 * parsed back into an array before being returned to the client.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim() || "";
  const priority = searchParams.get("priority")?.trim() || "";
  const search = searchParams.get("search")?.trim() || "";

  try {
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: tickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
        assignedTo: t.assignedTo,
        replies: safeParseArray(t.replies),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (e) {
    console.error("[admin/support/list] error:", e);
    return ok({ items: [] });
  }
}

function safeParseArray(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
