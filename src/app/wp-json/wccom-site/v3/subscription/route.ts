import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /wp-json/wccom-site/v3/subscription
// WooCommerce.com checks this endpoint to verify the store has WC Helper plugin
export async function GET() {
  return NextResponse.json({
    active: true,
    subscriptions: [],
    site_id: "playbeat-digital",
    store_name: "PlayBeat Digital",
  });
}
