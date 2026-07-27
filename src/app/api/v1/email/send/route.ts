import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { sendEmail, isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/email/send
 *
 * Sends an email from support@playbeat.digital.
 *
 * Body: { to, subject, html, text?, replyTo? }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  if (!(await isEmailConfigured())) {
    return error("Email is not configured — set SMTP settings first", 401);
  }

  const body = await request.json().catch(() => ({}));
  const to = String(body?.to ?? "").trim();
  const subject = String(body?.subject ?? "").trim();
  const html = String(body?.html ?? "").trim();

  if (!to) return error("Recipient (to) is required", 422);
  if (!subject) return error("Subject is required", 422);
  if (!html) return error("HTML content is required", 422);

  const result = await sendEmail({
    to,
    subject,
    html,
    text: body?.text ? String(body.text) : undefined,
    replyTo: body?.replyTo ? String(body.replyTo) : undefined,
  });

  if (result.ok) return ok(result);
  return error(result.message, 502);
}
