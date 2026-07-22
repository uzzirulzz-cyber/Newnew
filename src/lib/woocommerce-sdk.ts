import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

/**
 * WooCommerce REST API SDK wrapper.
 *
 * Uses the official @woocommerce/woocommerce-rest-api package.
 *
 * Required env vars:
 *   WOOCOMMERCE_STORE_URL       — e.g. https://shop.playbeat.live
 *   WOOCOMMERCE_CONSUMER_KEY    — ck_xxxxx
 *   WOOCOMMERCE_CONSUMER_SECRET — cs_xxxxx
 *
 * If not configured, all functions return empty results.
 */

let client: any = null;

function getClient(): any {
  if (client) return client;

  const url = process.env.WOOCOMMERCE_STORE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!url || !consumerKey || !consumerSecret) {
    return null;
  }

  client = new WooCommerceRestApi({
    url,
    consumerKey,
    consumerSecret,
    version: "wc/v3",
  });

  return client;
}

export function isWooCommerceConfigured(): boolean {
  return Boolean(
    process.env.WOOCOMMERCE_STORE_URL &&
    process.env.WOOCOMMERCE_CONSUMER_KEY &&
    process.env.WOOCOMMERCE_CONSUMER_SECRET
  );
}

// === Products ===

export async function getProducts(perPage = 50, page = 1): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/products", { per_page: perPage, page });
    return res.data;
  } catch (e) {
    console.error("[woocommerce] getProducts error:", e);
    return [];
  }
}

export async function getProduct(id: number): Promise<any | null> {
  const wc = getClient();
  if (!wc) return null;

  try {
    const res = await wc.get(`/products/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function createProduct(data: any): Promise<any | null> {
  const wc = getClient();
  if (!wc) return null;

  try {
    const res = await wc.post("/products", data);
    return res.data;
  } catch (e) {
    console.error("[woocommerce] createProduct error:", e);
    return null;
  }
}

// === Orders ===

export async function getOrders(perPage = 50, page = 1): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/orders", { per_page: perPage, page });
    return res.data;
  } catch (e) {
    console.error("[woocommerce] getOrders error:", e);
    return [];
  }
}

// === Customers ===

export async function getCustomers(perPage = 50): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/customers", { per_page: perPage });
    return res.data;
  } catch (e) {
    console.error("[woocommerce] getCustomers error:", e);
    return [];
  }
}

export async function createCustomer(data: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}): Promise<any | null> {
  const wc = getClient();
  if (!wc) return null;

  try {
    const res = await wc.post("/customers", data);
    return res.data;
  } catch (e) {
    console.error("[woocommerce] createCustomer error:", e);
    return null;
  }
}

// === Connection test ===

export async function testConnection(
  url?: string,
  key?: string,
  secret?: string,
): Promise<{ success: boolean; message: string; storeName?: string }> {
  const storeUrl = url || process.env.WOOCOMMERCE_STORE_URL;
  const consumerKey = key || process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = secret || process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    return { success: false, message: "WooCommerce credentials not configured" };
  }

  try {
    const wc = new WooCommerceRestApi({
      url: storeUrl,
      consumerKey,
      consumerSecret,
      version: "wc/v3",
    });

    const res = await wc.get("/system_status");
    return {
      success: true,
      message: `Connected to ${res.data?.theme?.name || "WooCommerce store"}`,
      storeName: res.data?.theme?.name,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.response?.data?.message || e?.message || "Connection failed",
    };
  }
}

// === Settings API ===
// https://developer.woocommerce.com/docs/extensions/settings-and-config/settings-api/

export async function getSettings(group: string = "general"): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get(`/settings/${group}`);
    return res.data;
  } catch (e) {
    console.error("[woocommerce] getSettings error:", e);
    return [];
  }
}

export async function updateSetting(group: string, id: string, value: any): Promise<any | null> {
  const wc = getClient();
  if (!wc) return null;

  try {
    const res = await wc.post(`/settings/${group}/${id}`, { value });
    return res.data;
  } catch (e) {
    console.error("[woocommerce] updateSetting error:", e);
    return null;
  }
}

export async function getSettingGroups(): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/settings");
    return res.data;
  } catch {
    return [];
  }
}

// === Payment Token API ===
// https://developer.woocommerce.com/docs/features/payments/payment-token-api/

export async function getPaymentTokens(customerId: number): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get(`/customers/${customerId}/payment-tokens`);
    return res.data;
  } catch (e) {
    console.error("[woocommerce] getPaymentTokens error:", e);
    return [];
  }
}

export async function deletePaymentToken(customerId: number, tokenId: string): Promise<boolean> {
  const wc = getClient();
  if (!wc) return false;

  try {
    await wc.delete(`/customers/${customerId}/payment-tokens/${tokenId}`, { force: true });
    return true;
  } catch {
    return false;
  }
}

// === Payment Gateways ===

export async function getPaymentGateways(): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/payment_gateways");
    return res.data;
  } catch {
    return [];
  }
}

export async function updatePaymentGateway(id: string, data: { enabled?: boolean; title?: string; description?: string }): Promise<any | null> {
  const wc = getClient();
  if (!wc) return null;

  try {
    const res = await wc.post(`/payment_gateways/${id}`, data);
    return res.data;
  } catch {
    return null;
  }
}

// === Shipping Zones ===

export async function getShippingZones(): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/shipping/zones");
    return res.data;
  } catch {
    return [];
  }
}

// === Tax Rates ===

export async function getTaxRates(): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/taxes");
    return res.data;
  } catch {
    return [];
  }
}

// === Webhooks ===

export async function getWebhooks(): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/webhooks");
    return res.data;
  } catch {
    return [];
  }
}

export async function createWebhook(data: {
  name: string;
  topic: string;
  delivery_url: string;
}): Promise<any | null> {
  const wc = getClient();
  if (!wc) return null;

  try {
    const res = await wc.post("/webhooks", data);
    return res.data;
  } catch {
    return null;
  }
}

// === Reports / Analytics ===

export async function getSalesReport(period: string = "month"): Promise<any | null> {
  const wc = getClient();
  if (!wc) return null;

  try {
    const res = await wc.get("/reports/sales", { period });
    return res.data;
  } catch {
    return null;
  }
}

export async function getOrdersReport(
  perPage: number = 100,
  status: string = "completed",
): Promise<any[]> {
  const wc = getClient();
  if (!wc) return [];

  try {
    const res = await wc.get("/reports/orders/totals", { per_page: perPage, status });
    return res.data;
  } catch {
    return [];
  }
}

// === System Status ===

export async function getSystemStatus(): Promise<any | null> {
  const wc = getClient();
  if (!wc) return null;

  try {
    const res = await wc.get("/system_status");
    return res.data;
  } catch {
    return null;
  }
}
