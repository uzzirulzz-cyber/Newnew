import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /wp-json/wccom-site/v3/authorize
// WooCommerce.com calls this to authorize the connection
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    site_id: "playbeat-digital",
    store_name: "PlayBeat Digital",
    token: "playbeat-wccom-token-" + Date.now(),
    message: "Store authorized for WooCommerce.com connection",
  });
}
