import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/social-media
 * Returns all social media accounts (stored in Settings table as JSON)
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const setting = await db.settings.findUnique({ where: { key: "social_media" } });
  const accounts = setting?.value ? JSON.parse(setting.value) : [];
  return ok({ accounts });
}

/**
 * PUT /api/v1/admin/social-media
 * Saves all social media accounts
 * Body: { accounts: SocialAccount[] }
 */
export async function PUT(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { accounts } = body;

  if (!Array.isArray(accounts)) {
    return error("Accounts must be an array", 422);
  }

  const json = JSON.stringify(accounts);

  // Upsert the setting
  const existing = await db.settings.findUnique({ where: { key: "social_media" } });
  if (existing) {
    await db.settings.update({
      where: { key: "social_media" },
      data: { value: json },
    });
  } else {
    await db.settings.create({
      data: { key: "social_media", value: json },
    });
  }

  return ok({ accounts, message: "Social media accounts saved" });
}
