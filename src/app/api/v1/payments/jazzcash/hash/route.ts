import { NextRequest, NextResponse } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { computeSecureHash } from "@/lib/jazzcash";

/**
 * POST /api/v1/payments/jazzcash/hash
 *
 * JazzCash HMAC-SHA256 Hash Calculator.
 *
 * Accepts a JSON body of pp_ / ppmpf_ parameters + an integrity salt, and
 * returns the computed HMAC-SHA256 secure hash (uppercase hex). This mirrors
 * the "Hash Calculator" feature on the JazzCash sandbox and the reference
 * implementation at github.com/aliabidzaidi/HashCalculator.
 *
 * Algorithm (per JazzCash spec):
 *   1. Collect all pp_ and ppmpf_ fields (exclude pp_SecureHash)
 *   2. Sort field names alphabetically (ASCII order)
 *   3. Skip empty/null values
 *   4. Join values with '&'
 *   5. Prepend the integrity salt + '&'
 *   6. HMAC-SHA256 with the salt as the key → hex → uppercase
 *
 * Body:
 *   { salt: string, params: Record<string, string> }
 *
 * Response:
 *   { hash: string, dataString: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { salt, params } = body;

  if (!salt || typeof salt !== "string") {
    return error("Integrity salt (salt) is required", 422);
  }
  if (!params || typeof params !== "object") {
    return error("Parameters object (params) is required", 422);
  }

  try {
    // Build the data string (mirrors computeSecureHash internals for transparency)
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== "pp_SecureHash" && (k.startsWith("pp_") || k.startsWith("ppmpf_")))
      .sort();

    const nonEmptyValues: string[] = [salt];
    for (const key of sortedKeys) {
      const val = params[key];
      if (val !== undefined && val !== null && val !== "") {
        nonEmptyValues.push(String(val));
      }
    }
    const dataString = nonEmptyValues.join("&");

    const hash = computeSecureHash(params, salt);

    return ok({
      hash,
      dataString,
      fieldCount: sortedKeys.length,
      algorithm: "HMAC-SHA256",
      encoding: "UTF-8 → hex → uppercase",
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Hash calculation failed",
      500,
    );
  }
}
