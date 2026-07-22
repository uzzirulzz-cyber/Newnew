import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /wp-json/wc/v3/system_status
 * Returns WooCommerce-compatible system status.
 */
export async function GET() {
  return NextResponse.json({
    environment: {
      version: "PlayBeat Digital 1.0",
      wp_version: "6.5",
      wc_version: "8.0.0",
      php_version: "8.2",
      server_info: "Next.js 16 + Vercel",
    },
    theme: {
      name: "PlayBeat Digital",
      version: "1.0.0",
      directory: "playbeat",
    },
    database: {
      wc_database_version: "8.0.0",
    },
    active_plugins: [
      { name: "PlayBeat Digital Gateway", version: "1.0.0" },
    ],
    settings: {
      currency: "PKR",
      currency_symbol: "Rs",
      currency_position: "left",
    },
  });
}
