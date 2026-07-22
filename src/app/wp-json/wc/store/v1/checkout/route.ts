import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    order_id: 0,
    status: "checkout",
    totals: { total_price: "0", currency_code: "PKR", currency_symbol: "Rs" },
    payment_methods: ["jazzcash", "bank-alfalah", "easypaisa", "paypal", "crypto"],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    order_id: Date.now(),
    status: "processing",
    number: `PB-${Date.now().toString(36).toUpperCase()}`,
    totals: { total_price: String(body.total || "0"), currency_code: "PKR" },
    payment_url: "https://playbeat.digital",
    redirect_url: "https://playbeat.digital/?payment=success",
  }, { status: 201 });
}
