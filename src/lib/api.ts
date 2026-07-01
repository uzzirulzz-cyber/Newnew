import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export function ok<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status: number = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { message, details } },
    { status },
  );
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return {
    items: paged,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// Apply rate limiting to a request; returns a response (error) or null (ok).
export function applyRateLimit(
  request: Request,
  limit = 60,
): NextResponse | null {
  const ip = getClientIp(request);
  const result = rateLimit(ip, limit);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Too many requests. Please slow down.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }
  return null;
}

// Simple zod-free validator
export function validate<T>(
  body: unknown,
  rules: Record<string, (v: any, all: any) => string | null>,
): { valid: true; data: T } | { valid: false; errors: Record<string, string> } {
  const obj = (body ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  // Pass through all original fields, then override with validated values.
  const data: Record<string, unknown> = { ...obj };
  for (const [key, rule] of Object.entries(rules)) {
    const err = rule((obj as any)[key], obj);
    if (err) {
      errors[key] = err;
    } else {
      data[key] = (obj as any)[key];
    }
  }
  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, data: data as T };
}

export const v = {
  required:
    (label: string) =>
    (val: unknown) =>
      val === undefined || val === null || val === "" ? `${label} is required` : null,
  email:
    () =>
    (val: unknown) =>
      typeof val === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
        ? null
        : "Invalid email address",
  minLen:
    (n: number, label = "Value") =>
    (val: unknown) =>
      typeof val === "string" && val.length >= n ? null : `${label} must be at least ${n} characters`,
  number:
    (label = "Value") =>
    (val: unknown) =>
      typeof val === "number" && !Number.isNaN(val) ? null : `${label} must be a number`,
  in:
    (choices: string[], label = "Value") =>
    (val: unknown) =>
      typeof val === "string" && choices.includes(val) ? null : `${label} is invalid`,
};
