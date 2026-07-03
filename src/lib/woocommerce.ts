/**
 * WooCommerce + WordPress integration helpers.
 *
 * Connects to an external WooCommerce store via the WC REST API (v3).
 * Credentials are stored in .env and never exposed to the client.
 *
 * Required env vars:
 *   WOOCOMMERCE_STORE_URL  — e.g. https://shop.playbeat.live
 *   WOOCOMMERCE_CONSUMER_KEY
 *   WOOCOMMERCE_CONSUMER_SECRET
 *
 * For WordPress (same site, WP REST API):
 *   WORDPRESS_API_URL  — e.g. https://playbeat.live/wp-json/wp/v2
 *   WORDPRESS_USERNAME  (optional, for authenticated endpoints)
 *   WORDPRESS_APP_PASSWORD  (optional)
 */

export function isWooCommerceConfigured(): boolean {
  return Boolean(
    process.env.WOOCOMMERCE_STORE_URL &&
      process.env.WOOCOMMERCE_CONSUMER_KEY &&
      process.env.WOOCOMMERCE_CONSUMER_SECRET,
  );
}

export function isWordPressConfigured(): boolean {
  return Boolean(process.env.WORDPRESS_API_URL);
}

/** Build the base WC API URL with auth. */
function wcUrl(path: string, params?: Record<string, string>): string {
  const base = process.env.WOOCOMMERCE_STORE_URL!.replace(/\/$/, "");
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY!;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET!;
  const url = new URL(`${base}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  status: string;
  type: string;
  stock_status: string;
  stock_quantity: number | null;
  images: Array<{ src: string; alt?: string }>;
  categories: Array<{ id: number; name: string }>;
  permalink: string;
  short_description: string;
}

export interface WCOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  payment_method_title: string;
  date_created: string;
  customer_note?: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country?: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
}

/** Fetch products from the connected WooCommerce store. */
export async function getWooCommerceProducts(): Promise<{
  configured: boolean;
  items: WCProduct[];
  error?: string;
}> {
  if (!isWooCommerceConfigured()) {
    return { configured: false, items: [] };
  }
  try {
    const res = await fetch(wcUrl("/products", { per_page: "100" }), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return {
        configured: true,
        items: [],
        error: `WooCommerce API error: ${res.status}`,
      };
    }
    const items = (await res.json()) as WCProduct[];
    return { configured: true, items };
  } catch (e) {
    return {
      configured: true,
      items: [],
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}

/** Fetch orders from the connected WooCommerce store. */
export async function getWooCommerceOrders(): Promise<{
  configured: boolean;
  items: WCOrder[];
  error?: string;
}> {
  if (!isWooCommerceConfigured()) {
    return { configured: false, items: [] };
  }
  try {
    const res = await fetch(
      wcUrl("/orders", { per_page: "50", orderby: "date", order: "desc" }),
      { headers: { Accept: "application/json" }, next: { revalidate: 60 } },
    );
    if (!res.ok) {
      return {
        configured: true,
        items: [],
        error: `WooCommerce API error: ${res.status}`,
      };
    }
    const items = (await res.json()) as WCOrder[];
    return { configured: true, items };
  } catch (e) {
    return {
      configured: true,
      items: [],
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}

export interface WPPost {
  id: number;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  status: string;
  author: number;
  featured_media?: number;
}

/** Fetch WordPress posts via the WP REST API. */
export async function getWordPressPosts(): Promise<{
  configured: boolean;
  items: WPPost[];
  error?: string;
}> {
  if (!isWordPressConfigured()) {
    return { configured: false, items: [] };
  }
  try {
    const base = process.env.WORDPRESS_API_URL!.replace(/\/$/, "");
    const url = new URL(`${base}/posts`);
    url.searchParams.set("per_page", "20");
    url.searchParams.set("_embed", "true");
    const headers: Record<string, string> = { Accept: "application/json" };
    // Optional authenticated request
    const user = process.env.WORDPRESS_USERNAME;
    const pass = process.env.WORDPRESS_APP_PASSWORD;
    if (user && pass) {
      headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
    }
    const res = await fetch(url.toString(), { headers, next: { revalidate: 60 } });
    if (!res.ok) {
      return {
        configured: true,
        items: [],
        error: `WordPress API error: ${res.status}`,
      };
    }
    const items = (await res.json()) as WPPost[];
    return { configured: true, items };
  } catch (e) {
    return {
      configured: true,
      items: [],
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}
