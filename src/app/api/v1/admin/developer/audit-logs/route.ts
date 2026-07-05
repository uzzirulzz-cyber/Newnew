import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/developer/audit-logs
 *
 * Returns the last 100 audit log entries, newest first. The `metadata`
 * JSON-string column is parsed back into an object before returning.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok({
      items: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        actorName: l.actorName,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        ipAddress: l.ipAddress,
        metadata: safeParseRecord(l.metadata),
        createdAt: l.createdAt,
      })),
    });
  } catch (e) {
    console.error("[admin/developer/audit-logs] error:", e);
    return ok({ items: [] });
  }
}

function safeParseRecord(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
