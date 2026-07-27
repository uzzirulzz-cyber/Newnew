/**
 * Email sending service for PlayBeat Digital.
 *
 * Uses nodemailer with SMTP. The from address is support@playbeat.digital.
 * SMTP credentials are stored in the `email_config` Settings row (DB-backed,
 * configurable from the admin panel) with env var fallback.
 *
 * Required config:
 *   smtpHost     — e.g. mail.playbeat.digital (cPanel mail server)
 *   smtpPort     — 465 (SSL) or 587 (TLS)
 *   smtpUser     — support@playbeat.digital
 *   smtpPassword — the email account password
 *   fromName     — "PlayBeat Digital"
 *   fromEmail    — support@playbeat.digital
 */

import nodemailer from "nodemailer";
import { db } from "@/lib/db";

const SETTING_KEY = "email_config";

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  updatedAt?: string;
}

/** Load email config from DB; fall back to env vars. */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const setting = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (parsed?.smtpHost && parsed?.smtpUser) {
        return {
          smtpHost: String(parsed.smtpHost),
          smtpPort: Number(parsed.smtpPort) || 465,
          smtpUser: String(parsed.smtpUser),
          smtpPassword: String(parsed.smtpPassword || ""),
          fromName: String(parsed.fromName || "PlayBeat Digital"),
          fromEmail: String(parsed.fromEmail || "support@playbeat.digital"),
          updatedAt: parsed.updatedAt,
        };
      }
    }
  } catch {
    // fall through
  }
  // Env fallback
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return {
      smtpHost: process.env.SMTP_HOST,
      smtpPort: Number(process.env.SMTP_PORT) || 465,
      smtpUser: process.env.SMTP_USER,
      smtpPassword: process.env.SMTP_PASSWORD || "",
      fromName: process.env.SMTP_FROM_NAME || "PlayBeat Digital",
      fromEmail: process.env.SMTP_FROM_EMAIL || "support@playbeat.digital",
    };
  }
  return null;
}

export async function isEmailConfigured(): Promise<boolean> {
  return Boolean(await getEmailConfig());
}

/** Save email config to the DB. */
export async function saveEmailConfig(config: Partial<EmailConfig>): Promise<EmailConfig> {
  const existing = await getEmailConfig();
  const merged: EmailConfig = {
    smtpHost: config.smtpHost ?? existing?.smtpHost ?? "",
    smtpPort: config.smtpPort ?? existing?.smtpPort ?? 465,
    smtpUser: config.smtpUser ?? existing?.smtpUser ?? "",
    smtpPassword: config.smtpPassword ?? existing?.smtpPassword ?? "",
    fromName: config.fromName ?? existing?.fromName ?? "PlayBeat Digital",
    fromEmail: config.fromEmail ?? existing?.fromEmail ?? "support@playbeat.digital",
    updatedAt: new Date().toISOString(),
  };
  const value = JSON.stringify(merged);
  const row = await db.settings.findUnique({ where: { key: SETTING_KEY } });
  if (row) {
    await db.settings.update({ where: { key: SETTING_KEY }, data: { value } });
  } else {
    await db.settings.create({ data: { key: SETTING_KEY, value } });
  }
  return merged;
}

/** Clear stored email config. */
export async function clearEmailConfig(): Promise<void> {
  try {
    const row = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (row) await db.settings.delete({ where: { key: SETTING_KEY } });
  } catch {
    // best-effort
  }
}

/** Create a nodemailer transport from the stored config. */
async function createTransport(): Promise<nodemailer.Transporter> {
  const config = await getEmailConfig();
  if (!config) throw new Error("Email is not configured");

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465, // true for 465, false for 587
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  });
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/** Send an email from support@playbeat.digital. */
export async function sendEmail(params: SendEmailParams): Promise<{
  ok: boolean;
  message: string;
  messageId?: string;
}> {
  const config = await getEmailConfig();
  if (!config) {
    return { ok: false, message: "Email is not configured — set SMTP settings first" };
  }

  try {
    const transport = await createTransport();
    const info = await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, " "),
      replyTo: params.replyTo || config.fromEmail,
    });
    return {
      ok: true,
      message: `Email sent to ${params.to}`,
      messageId: info.messageId,
    };
  } catch (e: any) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to send email",
    };
  }
}

/** Test the SMTP connection (verify credentials without sending an email). */
export async function testEmailConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const config = await getEmailConfig();
  if (!config) return { ok: false, message: "Not configured" };
  try {
    const transport = await createTransport();
    await transport.verify();
    return { ok: true, message: `SMTP connection verified — ${config.smtpHost}:${config.smtpPort}` };
  } catch (e: any) {
    return { ok: false, message: e instanceof Error ? e.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

/** Order confirmation email template. */
export function orderConfirmationEmail(order: {
  orderNumber: string;
  customerName: string;
  total: number;
  currency: string;
  items: Array<{ title: string; price: number; quantity: number }>;
  provider?: string;
}): { subject: string; html: string } {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;">${item.title}</td><td style="text-align:right;">Rs ${item.price.toLocaleString()}</td></tr>`,
    )
    .join("");

  return {
    subject: `Order ${order.orderNumber} confirmed — PlayBeat Digital`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a2e;color:#fff;padding:20px;text-align:center;">
          <h1 style="margin:0;">PlayBeat Digital</h1>
          <p style="margin:5px 0 0;opacity:0.7;">Premium Digital Products</p>
        </div>
        <div style="padding:20px;">
          <h2>Order Confirmed!</h2>
          <p>Hi ${order.customerName},</p>
          <p>Your order <strong>${order.orderNumber}</strong> has been confirmed. Here are the details:</p>
          <table style="width:100%;border-collapse:collapse;margin:15px 0;">
            <thead>
              <tr style="border-bottom:2px solid #eee;">
                <th style="text-align:left;padding:8px 0;">Product</th>
                <th style="text-align:right;padding:8px 0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="border-top:2px solid #eee;font-weight:bold;">
                <td style="padding:12px 0;">Total</td>
                <td style="text-align:right;">Rs ${order.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <p style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;font-size:13px;">
            💡 Your license keys and download links will be delivered once payment is verified.
          </p>
          <p style="margin-top:20px;font-size:12px;color:#666;">
            PlayBeat Digital — https://playbeat.digital<br>
            Support: support@playbeat.digital
          </p>
        </div>
      </div>
    `,
  };
}

/** Payment confirmation email template. */
export function paymentConfirmedEmail(order: {
  orderNumber: string;
  customerName: string;
  total: number;
  items: Array<{ title: string; licenseKey?: string }>;
}): { subject: string; html: string } {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<div style="padding:10px 0;border-bottom:1px solid #eee;">
          <strong>${item.title}</strong>
          ${item.licenseKey ? `<br><code style="background:#f5f5f5;padding:4px 8px;border-radius:4px;font-size:12px;">${item.licenseKey}</code>` : ""}
        </div>`,
    )
    .join("");

  return {
    subject: `Payment verified — ${order.orderNumber} — PlayBeat Digital`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a2e;color:#fff;padding:20px;text-align:center;">
          <h1 style="margin:0;">PlayBeat Digital</h1>
        </div>
        <div style="padding:20px;">
          <h2>✅ Payment Verified!</h2>
          <p>Hi ${order.customerName},</p>
          <p>Your payment for order <strong>${order.orderNumber}</strong> has been verified. Here are your products:</p>
          ${itemsHtml}
          <p style="margin-top:20px;">Thank you for shopping with PlayBeat Digital!</p>
          <p style="font-size:12px;color:#666;">
            Need help? Contact us at support@playbeat.digital<br>
            https://playbeat.digital
          </p>
        </div>
      </div>
    `,
  };
}
