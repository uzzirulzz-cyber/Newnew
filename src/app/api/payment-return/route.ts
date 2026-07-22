import { NextRequest, NextResponse } from "next/server";

/**
 * GET/POST /api/payment-return
 *
 * JazzCash LIVE payment return URL.
 * Receives the payment result from JazzCash after customer completes payment.
 * Redirects to storefront with success/failure status.
 */
async function handleReturn(params: Record<string, string>, requestUrl: string) {
  const status = params.pp_ResponseCode || params.ResponseCode || "";
  const isSuccess = status === "000";
  const txnRef = params.pp_TxnRefNo || params.TxnRefNo || "";
  const message = params.pp_ResponseMessage || params.ResponseMessage || "";
  const billRef = params.pp_BillReference || params.BillReference || "";

  // Update order in DB if we can find it
  if (billRef) {
    try {
      const { db } = await import("@/lib/db");
      const order = await db.order.findFirst({ where: { orderNumber: billRef } });
      if (order) {
        await db.order.update({
          where: { id: order.id },
          data: { status: isSuccess ? "COMPLETED" : "CANCELLED" },
        });
        const payment = await db.payment.findUnique({ where: { orderId: order.id } }).catch(() => null);
        if (payment) {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: isSuccess ? "COMPLETED" : "FAILED", transactionId: txnRef },
          });
        }
      }
    } catch {}
  }

  const origin = new URL(requestUrl).origin;
  const statusParam = isSuccess ? "success" : "failed";
  const redirectUrl = new URL(`/?payment=${statusParam}&ref=${txnRef}&msg=${encodeURIComponent(message)}`, origin);
  if (billRef) redirectUrl.searchParams.set("order", billRef);

  return NextResponse.redirect(redirectUrl, { status: 302 });
}

export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((v, k) => { params[k] = String(v); });
  return handleReturn(params, request.url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((v, k) => { params[k] = String(v); });
  return handleReturn(params, request.url);
}
