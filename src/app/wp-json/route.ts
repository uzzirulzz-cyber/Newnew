import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /wp-json
 *
 * Returns a WordPress-compatible REST API discovery response.
 * Mimics a real WordPress + WooCommerce installation exactly.
 */
export async function GET() {
  const response = NextResponse.json({
    name: "PlayBeat Digital",
    description: "PlayBeat Digital — Premium Digital Products Marketplace",
    url: "https://playbeat.digital",
    home: "https://playbeat.digital",
    gmt_offset: "5",
    timezone_string: "Asia/Karachi",
    namespaces: [
      "oembed/1.0",
      "wp/v2",
      "wp-site-health/v1",
      "wc/v3",
      "wc/store/v1",
      "wc/store",
      "wc-telemetry",
      "woocommerce/v1",
    ],
    routes: {
      "/": { methods: ["GET"], _links: { self: [{ href: "https://playbeat.digital/wp-json" }] } },
      "/oembed/1.0": { methods: ["GET"] },
      "/oembed/1.0/embed": { methods: ["GET"] },
      "/wp/v2": { methods: ["GET"] },
      "/wp/v2/posts": { methods: ["GET", "POST"] },
      "/wp/v2/pages": { methods: ["GET", "POST"] },
      "/wp/v2/users": { methods: ["GET", "POST"] },
      "/wp/v2/categories": { methods: ["GET", "POST"] },
      "/wp/v2/media": { methods: ["GET", "POST"] },
      "/wp-site-health/v1": { methods: ["GET"] },
      "/wc/v3": { methods: ["GET"] },
      "/wc/v3/products": { methods: ["GET", "POST"] },
      "/wc/v3/orders": { methods: ["GET", "POST"] },
      "/wc/v3/customers": { methods: ["GET", "POST"] },
      "/wc/v3/system_status": { methods: ["GET"] },
      "/wc/v3/payment_gateways": { methods: ["GET"] },
      "/wc/v3/settings": { methods: ["GET"] },
      "/wc/store/v1/products": { methods: ["GET"] },
      "/wc/store/v1/cart": { methods: ["GET", "POST"] },
      "/wc/store/v1/checkout": { methods: ["GET", "POST"] },
    },
    authentication: {
      "application-passwords": {
        endpoints: {
          authorization: "https://playbeat.digital/wp-admin/authorize-application",
        },
      },
    },
    site_logo: "https://playbeat.digital/favicon.png",
    site_icon: "https://playbeat.digital/favicon.png",
    site_icon_url: "https://playbeat.digital/favicon.png",
    _links: {
      self: [{ href: "https://playbeat.digital/wp-json" }],
      help: [{ href: "https://developer.wordpress.org/rest-api/" }],
    },
  });

  response.headers.set("X-WP-Nonce", "playbeat-wp-nonce");
  return response;
}
