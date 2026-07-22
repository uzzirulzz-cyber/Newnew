import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["email", "push", "social", "sms"]);
const ALLOWED_STATUS = new Set(["draft", "active", "paused", "completed"]);

/**
 * PATCH /api/v1/admin/campaigns/[id]
 * Body: partial { name, type, status, content, sentCount, openRate, clickCount }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!id) return error("Campaign id is required", 422);

  const body = await request.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body.type === "string" && ALLOWED_TYPES.has(body.type)) {
    data.type = body.type;
  }
  if (typeof body.status === "string" && ALLOWED_STATUS.has(body.status)) {
    data.status = body.status;
  }
  if (typeof body.content === "string") {
    data.content = body.content;
  }
  if (body.sentCount !== undefined && !Number.isNaN(Number(body.sentCount))) {
    data.sentCount = Number(body.sentCount);
  }
  if (body.openRate !== undefined && !Number.isNaN(Number(body.openRate))) {
    data.openRate = Number(body.openRate);
  }
  if (body.clickCount !== undefined && !Number.isNaN(Number(body.clickCount))) {
    data.clickCount = Number(body.clickCount);
  }

  if (Object.keys(data).length === 0) {
    return error("No valid fields provided for update", 422);
  }

  try {
    const existing = await db.marketingCampaign.findUnique({ where: { id } });
    if (!existing) return error("Campaign not found", 404);

    const updated = await db.marketingCampaign.update({
      where: { id },
      data,
    });

    return ok({
      campaign: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        status: updated.status,
        sentCount: updated.sentCount,
        openRate: updated.openRate,
        clickCount: updated.clickCount,
        content: updated.content,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      message: "Campaign updated",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update campaign",
      500,
    );
  }
}

/**
 * DELETE /api/v1/admin/campaigns/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!id) return error("Campaign id is required", 422);

  try {
    const existing = await db.marketingCampaign.findUnique({ where: { id } });
    if (!existing) return error("Campaign not found", 404);

    await db.marketingCampaign.delete({ where: { id } });

    return ok({
      deleted: true,
      id,
      message: "Campaign deleted",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete campaign",
      500,
    );
  }
}
