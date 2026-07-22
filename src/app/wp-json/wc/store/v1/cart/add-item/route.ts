import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    id: Date.now().toString(),
    quantity: body.quantity || 1,
    name: "Product",
    totals: { line_total: String(body.price || "0"), currency_code: "PKR", currency_symbol: "Rs" },
  }, { status: 201 });
}
