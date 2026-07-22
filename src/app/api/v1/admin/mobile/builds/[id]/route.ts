import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const PLATFORMS = ["ios", "android", "both"] as const;
const BUILD_TYPES = ["debug", "release"] as const;
const STATUSES = ["building", "ready", "failed"] as const;

function serialize(b: any) {
  return {
    id: b.id,
    version: b.version,
    platform: b.platform,
    buildType: b.buildType,
    downloadUrl: b.downloadUrl ?? null,
    changelog: b.changelog ?? null,
    size: b.size ?? null,
    status: b.status,
    active: !!b.active,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt ?? b.createdAt,
  };
}

// ----- GET /api/v1/admin/mobile/builds/[id] -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid build id", 422);
  }

  try {
    const build = await db.mobileBuild.findUnique({ where: { id } });
    if (!build) return error("Build not found", 404);
    return ok({ build: serialize(build) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to fetch build",
      500,
    );
  }
}

// ----- PATCH /api/v1/admin/mobile/builds/[id] -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid build id", 422);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  try {
    const existing = await db.mobileBuild.findUnique({ where: { id } });
    if (!existing) return error("Build not found", 404);

    const data: any = {};

    if (typeof body.version === "string" && body.version.trim()) {
      data.version = body.version.trim();
    }
    if (typeof body.platform === "string" && PLATFORMS.includes(body.platform as any)) {
      data.platform = body.platform;
    }
    if (typeof body.buildType === "string" && BUILD_TYPES.includes(body.buildType as any)) {
      data.buildType = body.buildType;
    }
    if (typeof body.status === "string" && STATUSES.includes(body.status as any)) {
      data.status = body.status;
    }
    if (body.downloadUrl !== undefined) {
      data.downloadUrl =
        typeof body.downloadUrl === "string" && body.downloadUrl.trim()
          ? body.downloadUrl.trim()
          : null;
    }
    if (body.changelog !== undefined) {
      data.changelog =
        typeof body.changelog === "string" && body.changelog.trim()
          ? body.changelog.trim()
          : null;
    }
    if (body.size !== undefined) {
      const s = body.size;
      data.size =
        typeof s === "number" && Number.isFinite(s)
          ? s
          : typeof s === "string" && s.trim()
            ? Number(s)
            : null;
      if (data.size !== null && Number.isNaN(data.size)) data.size = null;
    }
    if (body.active !== undefined) {
      data.active = !!body.active;
    }

    // If activating, deactivate all other builds for the same platform first.
    if (data.active === true) {
      await db.mobileBuild.updateMany({
        where: {
          platform: data.platform || existing.platform,
          active: true,
          id: { not: id },
        },
        data: { active: false },
      });
    }

    const updated = await db.mobileBuild.update({ where: { id }, data });
    return ok({ build: serialize(updated) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update build",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/mobile/builds/[id] -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid build id", 422);
  }

  try {
    const existing = await db.mobileBuild.findUnique({ where: { id } });
    if (!existing) return error("Build not found", 404);

    await db.mobileBuild.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete build",
      500,
    );
  }
}
