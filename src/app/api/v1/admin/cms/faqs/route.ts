import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ----- GET /api/v1/admin/cms/faqs — list all (sorted by sortOrder asc) -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const items = await db.faq.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return ok({ items });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list FAQs",
      500,
    );
  }
}

// ----- POST /api/v1/admin/cms/faqs — create -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  if (typeof body.question !== "string" || !body.question.trim()) {
    return error("question is required", 422);
  }
  if (typeof body.answer !== "string" || !body.answer.trim()) {
    return error("answer is required", 422);
  }

  const question = body.question.trim();
  const answer = body.answer.trim();
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : "general";

  // sortOrder: default to next available sort order
  let sortOrder: number;
  if (
    typeof body.sortOrder === "number" &&
    Number.isFinite(body.sortOrder)
  ) {
    sortOrder = Math.floor(body.sortOrder);
  } else if (
    typeof body.sortOrder === "string" &&
    body.sortOrder.trim() &&
    Number.isFinite(Number(body.sortOrder))
  ) {
    sortOrder = Math.floor(Number(body.sortOrder));
  } else {
    // Append at the end
    const count = await db.faq.count();
    sortOrder = count; // 0-indexed next slot
  }

  const published =
    body.published === undefined ? true : Boolean(body.published);

  try {
    const faq = await db.faq.create({
      data: {
        question,
        answer,
        category,
        sortOrder,
        published,
      },
    });
    return ok({ faq }, 201);
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create FAQ",
      500,
    );
  }
}
