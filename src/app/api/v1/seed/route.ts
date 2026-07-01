import { NextRequest } from "next/server";
import { runSeed } from "@/lib/seed";
import { ok, error, applyRateLimit } from "@/lib/api";

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;
  try {
    const result = await runSeed();
    return ok({ created: result.created, message: "Database seeded successfully." });
  } catch (e) {
    console.error("[seed] error:", e);
    return error("Failed to seed database", 500, String(e));
  }
}
