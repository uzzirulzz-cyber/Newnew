import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/payments/submit
 *
 * Customer submits payment proof for manual payment methods (Bank Alfalah, Easypaisa).
 * Body (multipart/form-data):
 *   orderNumber    — order reference number
 *   method         — bank-alfalah | easypaisa | jazzcash
 *   amount         — payment amount in PKR
 *   customerName   — customer's name
 *   customerEmail  — customer's email
 *   transactionId  — transaction reference / TRN from bank/easypaisa
 *   screenshot     — (file) payment screenshot
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;

  const formData = await request.formData();
  const orderNumber = formData.get("orderNumber") as string;
  const method = formData.get("method") as string;
  const amount = Number(formData.get("amount") || 0);
  const customerName = formData.get("customerName") as string;
  const customerEmail = formData.get("customerEmail") as string;
  const transactionId = formData.get("transactionId") as string;
  const screenshot = formData.get("screenshot") as File | null;

  if (!orderNumber) return error("Order number is required", 422);
  if (!transactionId) return error("Transaction ID is required", 422);
  if (!customerEmail) return error("Email is required", 422);

  let screenshotUrl: string | null = null;

  // Save screenshot if provided
  if (screenshot && screenshot.size > 0) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(screenshot.type)) {
      return error("Screenshot must be an image (JPG, PNG, WebP, GIF)", 422);
    }
    if (screenshot.size > 10 * 1024 * 1024) {
      return error("Screenshot must be under 10MB", 422);
    }

    const ext = screenshot.name.split(".").pop() || "png";
    const filename = `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "payments");
    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await screenshot.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    screenshotUrl = `/uploads/payments/${filename}`;
  }

  try {
    // Find the order
    const order = await db.order.findFirst({ where: { orderNumber } });

    const submission = await db.paymentSubmission.create({
      data: {
        orderId: order?.id || null,
        orderNumber,
        method: method || "unknown",
        amount,
        currency: "PKR",
        customerName,
        customerEmail,
        transactionId,
        screenshotUrl,
        status: "pending",
      },
    });

    // Update order status to PENDING (if not already)
    if (order) {
      await db.order.update({
        where: { id: order.id },
        data: { status: "PENDING" },
      }).catch(() => {});
    }

    return ok({
      submission,
      message: "Payment proof submitted. Your order will be confirmed within 30 minutes after verification.",
    });
  } catch (e) {
    console.error("[payments/submit] Error:", e);
    return error("Failed to submit payment proof", 500);
  }
}
