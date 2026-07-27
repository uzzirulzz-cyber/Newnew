import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { getEmailConfig, saveEmailConfig, clearEmailConfig } from "@/lib/email";

export const dynamic = "force-dynamic";

/** GET /api/v1/email/settings — check if email is configured (never returns password). */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  const config = await getEmailConfig();
  if (!config) return ok({ configured: false });
  return ok({
    configured: true,
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpUser: config.smtpUser,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    updatedAt: config.updatedAt,
  });
}

/** POST /api/v1/email/settings — save SMTP config. */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const config = await saveEmailConfig({
    smtpHost: body.smtpHost ? String(body.smtpHost) : undefined,
    smtpPort: body.smtpPort ? Number(body.smtpPort) : undefined,
    smtpUser: body.smtpUser ? String(body.smtpUser) : undefined,
    smtpPassword: body.smtpPassword ? String(body.smtpPassword) : undefined,
    fromName: body.fromName ? String(body.fromName) : undefined,
    fromEmail: body.fromEmail ? String(body.fromEmail) : undefined,
  });
  return ok({
    configured: true,
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpUser: config.smtpUser,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    message: "Email settings saved",
  });
}

/** DELETE /api/v1/email/settings — clear config. */
export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 15);
  if (limited) return limited;
  await clearEmailConfig();
  return ok({ configured: false, message: "Email settings cleared" });
}
