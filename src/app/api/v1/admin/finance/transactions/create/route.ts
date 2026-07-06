import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * POST /api/v1/admin/finance/transactions/create
 *
 * Creates a new transaction record (manual entry by admin).
 *
 * Body: {
 *   transactionId: string,
 *   type: string,                 // sale | refund | subscription | withdrawal
 *   amount: number,
 *   currency?: string,            // defaults to "PKR"
 *   customerName?: string,
 *   customerEmail?: string,
 *   gateway?: string,
 *   status: string,               // completed | pending | failed | refunded
 *   description?: string,
 * }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const {
    transactionId,
    type,
    amount,
    currency,
    customerName,
    customerEmail,
    gateway,
    status,
    description,
  } = body;

  if (!transactionId) return error("transactionId is required", 422);
  if (!type) return error("type is required", 422);
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return error("A valid amount is required", 422);
  }
  if (!status) return error("status is required", 422);

  try {
    const transaction = await db.transaction.create({
      data: {
        transactionId: String(transactionId),
        type: String(type),
        amount: Number(amount),
        currency: currency ? String(currency) : "PKR",
        customerName: customerName ? String(customerName) : null,
        customerEmail: customerEmail ? String(customerEmail) : null,
        gateway: gateway ? String(gateway) : null,
        status: String(status),
        description: description ? String(description) : null,
      },
    });

    return ok(
      {
        transaction,
        message: `Transaction ${transaction.transactionId} created`,
      },
      201,
    );
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to create transaction",
      500,
    );
  }
}
