import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { parseCallback } from "@/lib/easypaisa";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/v1/payments/easypaisa/callback
 *
 * Easypaisa sends the payment result here (postBackURL).
 * We parse the callback, update the order, and redirect to the storefront.
 */
async function handleCallback(params: Record<string, string>, requestUrl: string) {
  const result = parseCallback(params);
  const origin = new URL(requestUrl).origin;

  // Update order in DB
  if (result.orderId) {
    try {
      const order = await db.order.findFirst({
        where: { orderNumber: result.orderId },
      });
      if (order) {
        await db.order.update({
          where: { id: order.id },
          data: { status: result.success ? "COMPLETED" : "CANCELLED" },
        });
        if (order.paymentId) {
          await db.payment.update({
            where: { id: order.paymentId },
            data: {
              status: result.success ? "COMPLETED" : "FAILED",
              provider: "EASYPAISA",
              paymentId: result.transactionId,
            },
          }).catch(() => {});
        }
      }
    } catch (dbErr) {
      console.error("[easypaisa/callback] DB update failed:", dbErr);
    }
  }

  const statusParam = result.success ? "success" : "failed";
  const msgParam = encodeURIComponent(result.message);
  const redirectUrl = new URL(`/?payment=${statusParam}&msg=${msgParam}`, origin);
  if (result.orderId) redirectUrl.searchParams.set("order", result.orderId);

  return NextResponse.redirect(redirectUrl, { status: 302 });
}

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((v, k) => {
    params[k] = String(v);
  });
  return handleCallback(params, request.url);
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 30);
  if (limited) return limited;

  // Easypaisa may send form data or JSON
  const contentType = request.headers.get("content-type") || "";
  let params: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    const json = await request.json().catch(() => ({}));
    for (const [k, v] of Object.entries(json)) {
      params[k] = String(v);
    }
  } else {
    const formData = await request.formData().catch(() => new FormData());
    formData.forEach((v, k) => {
      params[k] = String(v);
    });
  }

  return handleCallback(params, request.url);
}
