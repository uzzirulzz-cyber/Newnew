import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Strip the password field from a record before returning it to the client.
function sanitize<T extends { password?: string }>(acc: T): Omit<T, "password"> {
  if (!acc) return acc;
  const { password: _pw, ...rest } = acc;
  return rest as Omit<T, "password">;
}

// Fields the admin may update on a WordPress account.
const UPDATEABLE_FIELDS = ["firstName", "lastName", "status"] as const;

// ----- GET /api/v1/admin/wordpress/accounts/[id] -----

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid account id", 422);
  }

  try {
    const account = await db.wordPressAccount.findUnique({ where: { id } });
    if (!account) {
      return error("Account not found", 404);
    }
    return ok({ account: sanitize(account) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to fetch account",
      500,
    );
  }
}

// ----- PATCH /api/v1/admin/wordpress/accounts/[id] -----

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid account id", 422);
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  const existing = await db.wordPressAccount.findUnique({ where: { id } });
  if (!existing) {
    return error("Account not found", 404);
  }

  const data: any = {};
  for (const field of UPDATEABLE_FIELDS) {
    if (body[field] !== undefined) {
      data[field] =
        typeof body[field] === "string" && body[field].trim()
          ? body[field].trim()
          : null;
    }
  }

  // Optional password rotation
  if (body.password !== undefined && body.password !== null) {
    const pwd = typeof body.password === "string" ? body.password : "";
    if (pwd.length < 6) {
      return error("Password must be at least 6 characters", 422);
    }
    data.password = await bcrypt.hash(pwd, 10);
  }

  // Optional storeUrl + wpCustomerId
  if (body.storeUrl !== undefined) {
    data.storeUrl =
      typeof body.storeUrl === "string" && body.storeUrl.trim()
        ? body.storeUrl.trim()
        : null;
  }
  if (body.wpCustomerId !== undefined) {
    data.wpCustomerId =
      typeof body.wpCustomerId === "string" && body.wpCustomerId.trim()
        ? body.wpCustomerId.trim()
        : null;
  }

  try {
    const account = await db.wordPressAccount.update({
      where: { id },
      data,
    });
    return ok({ account: sanitize(account) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to update account",
      500,
    );
  }
}

// ----- DELETE /api/v1/admin/wordpress/accounts/[id] -----

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const { id } = await params;
  if (!OBJECT_ID_RE.test(id)) {
    return error("Invalid account id", 422);
  }

  const existing = await db.wordPressAccount.findUnique({ where: { id } });
  if (!existing) {
    return error("Account not found", 404);
  }

  try {
    await db.wordPressAccount.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to delete account",
      500,
    );
  }
}
