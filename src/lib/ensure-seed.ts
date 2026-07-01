import { db } from "@/lib/db";
import { runSeed } from "@/lib/seed";

// Auto-seed guard: ensures the database has demo data on first request.
let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const count = await db.product.count();
      if (count === 0) {
        await runSeed();
      }
    } catch (e) {
      // Reset promise so a later request can retry
      seedPromise = null;
      console.error("[ensure-seed] failed:", e);
    }
  })();
  return seedPromise;
}
