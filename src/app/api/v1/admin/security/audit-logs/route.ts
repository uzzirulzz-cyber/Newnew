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

// Security-related action/resource prefixes. We scope the developer audit log
// endpoint to these so the Security tab shows only security-relevant events.
const SECURITY_ACTIONS = [
  "security.update",
  "security.2fa.enable",
  "security.2fa.disable",
  "security.firewall.add",
  "security.firewall.update",
  "security.firewall.delete",
  "security.ipwhitelist.update",
  "security.passwordpolicy.update",
  "security.session.update",
  "user.login",
  "user.logout",
  "user.login.failed",
  "user.suspended",
  "apikey.create",
  "apikey.revoke",
  "apikey.update",
];

// ----- GET /api/v1/admin/security/audit-logs — security-scoped audit logs -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const url = new URL(request.url);
  const pageRaw = parseInt(url.searchParams.get("page") || "1", 10);
  const limitRaw = parseInt(url.searchParams.get("limit") || "50", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

  const where: any = {
    OR: SECURITY_ACTIONS.flatMap((a) => [
      { action: a },
      { action: { contains: a, mode: "insensitive" } },
    ]),
  };

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
      e instanceof Error ? e.message : "Failed to list security audit logs",
      500,
    );
  }
}
