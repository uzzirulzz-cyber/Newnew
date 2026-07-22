import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /wp-json/wc/v3/orders
 * Returns PlayBeat orders in WooCommerce REST API v3 format.
 */
export async function GET(request: NextRequest) {
  const orders = await db.order.findMany({
    include: { items: true, payment: true },
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  const wcOrders = orders.map((o) => ({
    id: o.id,
    number: o.orderNumber,
    status: o.status.toLowerCase(),
    date_created: o.createdAt.toISOString(),
    total: String(o.total),
    currency: "PKR",
    payment_method: o.payment?.provider || o.provider || "",
    payment_method_title: o.payment?.provider || o.provider || "",
    customer_note: "",
    billing: {
      email: o.customerEmail || "",
      first_name: o.customerName || "",
    },
    line_items: o.items.map((item) => ({
      id: item.id,
      name: item.title,
      quantity: 1,
      total: String(item.price),
    })),
  }));

  const response = NextResponse.json(wcOrders);
  response.headers.set("X-WP-Total", String(orders.length));
  response.headers.set("X-WP-TotalPages", "1");
  return response;
}
