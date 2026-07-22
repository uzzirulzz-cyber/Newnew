import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["email", "push", "social", "sms"]);
const ALLOWED_STATUS = new Set(["draft", "active", "paused", "completed"]);

/**
 * GET /api/v1/admin/campaigns
 * Returns all marketing campaigns (newest first).
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const campaigns = await db.marketingCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok({
      items: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        sentCount: c.sentCount,
        openRate: c.openRate,
        clickCount: c.clickCount,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to load campaigns",
      500,
    );
  }
}

/**
 * POST /api/v1/admin/campaigns
 * Body: { name: string, type: string, content?: string, status?: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { name, type, content, status } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return error("Campaign name is required", 422);
  }
  if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
    return error("Type must be one of: email, push, social, sms", 422);
  }

  const finalStatus =
    typeof status === "string" && ALLOWED_STATUS.has(status) ? status : "draft";

  try {
    const campaign = await db.marketingCampaign.create({
      data: {
        name: name.trim(),
        type,
        status: finalStatus,
        content: typeof content === "string" ? content : null,
      },
    });

    return ok(
      {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          sentCount: campaign.sentCount,
          openRate: campaign.openRate,
          clickCount: campaign.clickCount,
          content: campaign.content,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        },
        message: "Campaign created",
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create campaign",
      500,
    );
  }
}
