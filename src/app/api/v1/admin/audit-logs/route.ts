import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Parse the JSON `metadata` field on an AuditLog into an object.
function parseMeta(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, any>;
    }
  } catch {
    // ignore
  }
  return {};
}

function serialize(log: any) {
  return {
    id: log.id,
    userId: log.userId ?? null,
    actorName: log.actorName,
    action: log.action,
    resource: log.resource ?? null,
    resourceId: log.resourceId ?? null,
    ipAddress: log.ipAddress ?? null,
    metadata: parseMeta(log.metadata),
    createdAt: log.createdAt,
  };
}

// ----- GET /api/v1/admin/audit-logs — list (paginated, filterable) -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const url = new URL(request.url);
  const action = url.searchParams.get("action")?.trim() || "";
  const resource = url.searchParams.get("resource")?.trim() || "";
  const actorName = url.searchParams.get("actor")?.trim() || "";
  const search = url.searchParams.get("search")?.trim() || "";
  const pageRaw = parseInt(url.searchParams.get("page") || "1", 10);
  const limitRaw = parseInt(url.searchParams.get("limit") || "50", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

  const where: any = {};
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (actorName) where.actorName = actorName;
  if (search) {
    // MongoDB regex search across actorName + action
    where.OR = [
      { actorName: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
      { resource: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    return ok({
      items: items.map(serialize),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list audit logs",
      500,
    );
  }
}
