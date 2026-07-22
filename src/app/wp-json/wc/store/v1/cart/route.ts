import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /wc/store/v1/cart — returns a fake empty cart (Store API compatible)
export async function GET() {
  return NextResponse.json({
    items: [],
    items_count: 0,
    items_weight: 0,
    needs_payment: true,
    needs_shipping: false,
    has_calculated_shipping: false,
    totals: {
      total_items: "0",
      total_items_tax: "0",
      total_fees: "0",
      total_fees_tax: "0",
      total_discount: "0",
      total_discount_tax: "0",
      total_shipping: "0",
      total_shipping_tax: "0",
      total_price: "0",
      total_tax: "0",
      tax_lines: [],
      currency_code: "PKR",
      currency_symbol: "Rs",
      currency_minor_unit: 2,
      currency_decimal_separator: ".",
      currency_thousand_separator: ",",
      currency_prefix: "Rs ",
      currency_suffix: "",
    },
    shipping_rates: [],
    coupons: [],
    fees: [],
    taxes: [],
    shipping_address: {},
    billing_address: {},
    errors: [],
    payment_methods: ["jazzcash", "bank-alfalah", "easypaisa", "paypal", "crypto"],
    payment_requirements: ["products"],
  });
}

// POST /wc/store/v1/cart — update cart
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, cart: body });
}
