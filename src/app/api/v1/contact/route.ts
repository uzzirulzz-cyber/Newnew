import { NextRequest } from "next/server";
import { ok, error, applyRateLimit, validate, v } from "@/lib/api";

/**
 * POST /api/v1/contact
 *
 * Accepts a contact form submission and (for now) just acknowledges it.
 * Wire this up to persist to a ContactMessage model / send an email once
 * the persistence layer exists.
 *
 * Body: { firstName?, lastName?, email?, message? }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON body", 400);
  }

  const result = validate<{
    firstName?: string;
    lastName?: string;
    email?: string;
    message?: string;
  }>(body, {
    email: (val) => {
      if (val === undefined || val === null || val === "") return null;
      return typeof val === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
        ? null
        : "Invalid email address";
    },
    message: (val) => {
      if (val === undefined || val === null || val === "") return "Message is required";
      if (typeof val !== "string") return "Message must be a string";
      if (val.trim().length < 10) return "Message must be at least 10 characters";
      return null;
    },
  });

  if (!result.valid) {
    return error("Validation failed", 422, result.errors);
  }

  // TODO: persist to a ContactMessage model and/or email the team.
  // For now we just acknowledge receipt.
  const _ignored = v.required;
  void _ignored;

  return ok({
    success: true,
    message: "Thanks for reaching out — we'll get back to you within one business day.",
    received: {
      name: [result.data.firstName, result.data.lastName].filter(Boolean).join(" ") || "Anonymous",
      email: result.data.email ?? null,
      message: result.data.message ?? null,
      receivedAt: new Date().toISOString(),
    },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
