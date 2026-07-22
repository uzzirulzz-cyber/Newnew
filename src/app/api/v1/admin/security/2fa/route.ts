import { NextRequest } from "next/server";
import crypto from "crypto";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Generate a base32 (RFC 4648) string — the format every TOTP authenticator
// app expects. We use the standard alphabet (no padding) and uppercase.
function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += alphabet[(value << (5 - bits)) & 31];
  }
  return out;
}

// ----- POST /api/v1/admin/security/2fa — enable 2FA (generate TOTP secret + QR URL) -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  try {
    // Find or create the singleton SecuritySetting record.
    let settings = await db.securitySetting.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!settings) {
      settings = await db.securitySetting.create({ data: {} });
    }

    // Generate a fresh 20-byte TOTP secret.
    const secretBytes = crypto.randomBytes(20);
    const secret = base32Encode(secretBytes);

    // Build the otpauth:// URI that authenticator apps scan via QR code.
    const label = encodeURIComponent("PlayBeat:admin");
    const issuer = encodeURIComponent("PlayBeat");
    const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    // Generate a simple QR code data URL. We use Google Chart API's REST
    // endpoint to render a PNG QR code; this is then embedded directly as the
    // `qrUrl` returned to the client. (The frontend can use either `otpauth`
    // or `qrUrl` — `qrUrl` is a drop-in <img src> ready URL.)
    const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(otpauth)}`;

    // Persist the secret + flip the enabled flag. The admin still has to
    // verify with a TOTP code in the UI, but the backend treats "secret
    // present + enabled" as enrolled.
    const updated = await db.securitySetting.update({
      where: { id: settings.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    return ok({
      secret,
      otpauth,
      qrUrl,
      enabled: !!updated.twoFactorEnabled,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to enable 2FA",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/security/2fa — disable 2FA -----

export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  try {
    const settings = await db.securitySetting.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!settings) {
      // No settings row yet — treat as already disabled.
      return ok({ success: true, enabled: false });
    }

    await db.securitySetting.update({
      where: { id: settings.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return ok({ success: true, enabled: false });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to disable 2FA",
      500,
    );
  }
}
