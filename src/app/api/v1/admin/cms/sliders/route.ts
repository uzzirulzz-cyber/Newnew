import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ----- GET /api/v1/admin/cms/sliders — list all -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const items = await db.slider.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok({ items });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list sliders",
      500,
    );
  }
}

// ----- POST /api/v1/admin/cms/sliders — create -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return error("name is required", 422);
  }

  const name = body.name.trim();

  // slides: accept array or JSON-string — store as JSON string
  let slidesStr = "[]";
  if (body.slides !== undefined && body.slides !== null) {
    if (typeof body.slides === "string") {
      try {
        JSON.parse(body.slides);
        slidesStr = body.slides;
      } catch {
        return error("slides must be valid JSON", 422);
      }
    } else if (Array.isArray(body.slides)) {
      slidesStr = JSON.stringify(body.slides);
    } else {
      return error("slides must be an array or JSON string", 422);
    }
  }

  const active =
    body.active === undefined ? true : Boolean(body.active);

  try {
    const slider = await db.slider.create({
      data: {
        name,
        slides: slidesStr,
        active,
      },
    });
    return ok({ slider }, 201);
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create slider",
      500,
    );
  }
}
