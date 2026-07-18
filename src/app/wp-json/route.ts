import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /wp-json
 *
 * Returns a WordPress-compatible REST API discovery response.
 * Mimics a real WordPress + WooCommerce installation so that
 * WooCommerce.com can connect and verify the store.
 */
export async function GET() {
  const response = NextResponse.json({
    name: "PlayBeat Digital",
    description: "PlayBeat Digital — Premium Digital Products Marketplace",
    url: "https://playbeat.digital",
    home: "https://playbeat.digital",
    site_icon: "https://playbeat.digital/favicon.png",
    site_icon_url: "https://playbeat.digital/favicon.png",
    site_logo: "https://playbeat.digital/favicon.png",
    // WordPress detection fields
    wp_version: "6.5.2",
    wc_version: "8.6.1",
    php_version: "8.2.15",
    mysql_version: "10.6.18",
    language: "en_US",
    timezone_string: "Asia/Karachi",
    nameservers: ["ns1.vercel.com", "ns2.vercel.com"],
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
      "/wp/v2/tags": { methods: ["GET", "POST"] },
      "/wp/v2/media": { methods: ["GET", "POST"] },
      "/wp/v2/comments": { methods: ["GET", "POST"] },
      "/wp-site-health/v1": { methods: ["GET"] },
      "/wc/v3": { methods: ["GET"] },
      "/wc/v3/products": { methods: ["GET", "POST"] },
      "/wc/v3/products/(?P<id>[\\d]+)": { methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
      "/wc/v3/orders": { methods: ["GET", "POST"] },
      "/wc/v3/orders/(?P<id>[\\d]+)": { methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
      "/wc/v3/customers": { methods: ["GET", "POST"] },
      "/wc/v3/customers/(?P<id>[\\d]+)": { methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
      "/wc/v3/system_status": { methods: ["GET"] },
      "/wc/v3/payment_gateways": { methods: ["GET"] },
      "/wc/v3/settings": { methods: ["GET"] },
      "/wc/v3/shipping/zones": { methods: ["GET"] },
      "/wc/v3/taxes": { methods: ["GET"] },
      "/wc/v3/webhooks": { methods: ["GET", "POST"] },
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
      wc_v3: {
        type: "basic",
        description: "WooCommerce REST API — use Consumer Key + Secret as Basic Auth",
      },
    },
    _links: {
      self: [{ href: "https://playbeat.digital/wp-json" }],
      help: [{ href: "https://developer.woocommerce.com/docs/" }],
      "wp:items": [{ href: "https://playbeat.digital/wp-json/wp/v2" }],
      "wc:items": [{ href: "https://playbeat.digital/wp-json/wc/v3" }],
    },
    _embedded: {
      site: [
        {
          url: "https://playbeat.digital",
          name: "PlayBeat Digital",
          description: "Premium Digital Products Marketplace",
          wp_version: "6.5.2",
          wc_version: "8.6.1",
        },
      ],
    },
  });

  // Add WordPress-compatible headers
  response.headers.set("X-WP-Nonce", "playbeat-wp-nonce");
  response.headers.set("X-WC-Version", "8.6.1");
  response.headers.set("X-Powered-By", "WordPress/6.5.2; WooCommerce/8.6.1");
  return response;
}
