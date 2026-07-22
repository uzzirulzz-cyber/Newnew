import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/mobile/builds — list all MobileBuild records (newest first).
 * POST /api/v1/admin/mobile/builds — create a new build.
 *
 * If `active: true` is supplied on POST, all other builds for the same platform
 * are deactivated first (only one active build per platform).
 */

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

// ----- GET -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const builds = await db.mobileBuild.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok({ items: builds.map(serialize) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list mobile builds",
      500,
    );
  }
}

// ----- POST -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const version = typeof body.version === "string" ? body.version.trim() : "";
  if (!version) {
    return error("version is required", 422);
  }

  const platform = typeof body.platform === "string" ? body.platform : "";
  if (!PLATFORMS.includes(platform as any)) {
    return error(
      `platform must be one of: ${PLATFORMS.join(", ")}`,
      422,
    );
  }

  const buildType =
    typeof body.buildType === "string" && BUILD_TYPES.includes(body.buildType as any)
      ? body.buildType
      : "release";

  const status =
    typeof body.status === "string" && STATUSES.includes(body.status as any)
      ? body.status
      : "ready";

  const downloadUrl =
    typeof body.downloadUrl === "string" && body.downloadUrl.trim()
      ? body.downloadUrl.trim()
      : null;
  const changelog =
    typeof body.changelog === "string" && body.changelog.trim()
      ? body.changelog.trim()
      : null;
  const sizeRaw = body.size;
  const size =
    typeof sizeRaw === "number" && Number.isFinite(sizeRaw)
      ? sizeRaw
      : typeof sizeRaw === "string" && sizeRaw.trim()
        ? Number(sizeRaw)
        : null;
  const active = !!body.active;

  try {
    // If activating, deactivate all other builds for the same platform first.
    if (active) {
      await db.mobileBuild.updateMany({
        where: { platform, active: true },
        data: { active: false },
      });
    }

    const build = await db.mobileBuild.create({
      data: {
        version,
        platform,
        buildType,
        downloadUrl,
        changelog,
        size: size !== null && !Number.isNaN(size) ? size : null,
        status,
        active,
      },
    });
    return ok({ build: serialize(build) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create mobile build",
      500,
    );
  }
}
