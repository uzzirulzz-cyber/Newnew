import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tiktok/leads
 *   ?status=new|contacted|converted|rejected|all  (default: all)
 *   ?search=  (name or email)
 *
 * Lists TikTok leads stored in the DB (received via webhook or polled).
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim() || "all";
  const search = searchParams.get("search")?.trim() || "";

  const where: any = {};
  if (status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { customerName: { contains: search } },
      { customerEmail: { contains: search } },
    ];
  }

  try {
    const leads = await db.tikTokLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok({ items: leads, total: leads.length });
  } catch (e) {
    console.error("[tiktok/leads] error:", e);
    return ok({ items: [], total: 0 });
  }
}

/**
 * PATCH /api/v1/tiktok/leads
 *   Body: { id, status, orderId? }
 *   Updates a lead's CRM status (new → contacted → converted → rejected).
 */
export async function PATCH(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const { id, status, orderId } = body;
  if (!id) return error("Lead id is required", 422);
  if (!["new", "contacted", "converted", "rejected"].includes(status)) {
    return error("Invalid status", 422);
  }
  try {
    const lead = await db.tikTokLead.update({
      where: { id: String(id) },
      data: { status: String(status), orderId: orderId || undefined },
    });
    return ok({ lead, message: `Lead marked as ${status}` });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Failed to update lead", 500);
  }
}
