import { NextRequest } from "next/server";
import { ok, error, applyRateLimit, paginate } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/orders
 *
 * Returns ALL orders across ALL users (admin view). Supports:
 *   ?page=1     — pagination (default 1)
 *   ?limit=20   — items per page (default 20, max 100)
 *   ?status=    — filter by status (COMPLETED, PENDING, CANCELLED, etc.)
 *   ?search=    — search order number or customer email/name
 *   ?sort=      — newest | oldest | total_desc | total_asc
 *
 * This is DIFFERENT from /api/v1/orders which only returns the CURRENT
 * USER's orders. Admins need to see all orders.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const status = searchParams.get("status")?.trim() || "";
  const search = searchParams.get("search")?.trim() || "";
  const sort = searchParams.get("sort") || "newest";

  try {
    // Build where clause
    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerEmail: { contains: search } },
        { customerName: { contains: search } },
      ];
    }

    // Build orderBy
    let orderBy: any = { createdAt: "desc" };
    if (sort === "oldest") orderBy = { createdAt: "asc" };
    else if (sort === "total_desc") orderBy = { total: "desc" };
    else if (sort === "total_asc") orderBy = { total: "asc" };

    const [total, orders] = await Promise.all([
      db.order.count({ where }),
      db.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          payment: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ok({
      items: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        subtotal: o.subtotal,
        discount: o.discount,
        total: o.total,
        currency: o.currency,
        couponCode: o.couponCode,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        createdAt: o.createdAt,
        provider: o.payment?.provider ?? null,
        paymentStatus: o.payment?.status ?? null,
        paymentTransactionId: o.payment?.transactionId ?? null,
        itemCount: o.items.length,
        items: o.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          title: it.product?.title ?? "Product",
          price: it.price,
          licenseKey: it.licenseKey,
        })),
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    console.error("[admin/orders] error:", e);
    return ok({ items: [], page, limit, total: 0, totalPages: 1 });
  }
}
