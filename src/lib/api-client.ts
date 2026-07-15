"use client";

// ===== Types =====

export interface ProductCover {
  type: "gradient" | "image";
  colors?: [string, string];
  icon?: string;
  seed?: string;
  image?: string;
}

export interface VendorRef {
  id: string;
  storeName: string;
  slug: string;
  verified: boolean;
  rating: number;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  type: string;
  status: string;
  price: number;
  discountPrice: number | null;
  currency: string;
  sku: string;
  stock: number | null;
  cover: ProductCover;
  tags: string[];
  licenseType: string | null;
  downloadFile: string | null;
  fileSize: string | null;
  version: string | null;
  changelog: Array<{ version: string; date: string; notes: string }>;
  featured: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  vendor: VendorRef | null;
  category: CategoryRef | null;
  effectivePrice: number;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
  buyNowUrl?: string | null;
  priceFormatted?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  productCount: number;
}

export interface Vendor {
  id: string;
  storeName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  verified: boolean;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  createdAt?: string;
}

export interface VendorDetail extends Vendor {
  products: Product[];
  coupons: Array<{
    code: string;
    type: string;
    value: number;
    minPurchase: number;
    active: boolean;
  }>;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  verified: boolean;
  vendorReply: string | null;
  createdAt: string;
  authorName: string;
}

export interface RatingBreakdown {
  star: number;
  count: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  configured?: boolean;
  message?: string;
}

export interface AffiliateStats {
  affiliate: {
    id: string;
    code: string;
    referralLink: string;
    commissionRate: number;
    status: string;
  };
  stats: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    totalEarnings: number;
    balance: number;
    pendingPayout: number;
  };
  timeseries: Array<{ date: string; clicks: number; conversions: number }>;
  payouts: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
  }>;
  topProducts: Array<{ title: string; conversions: number; earnings: number }>;
}

export interface AnalyticsDashboard {
  summary: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    vendors: number;
    reviews: number;
    aov: number;
    conversionRate: number;
    avgRating: number;
  };
  revenueTimeseries: Array<{ date: string; revenue: number; orders: number }>;
  revenueByCategory: Array<{ name: string; revenue: number; orders: number }>;
  paymentProviders: Array<{ name: string; value: number }>;
  topProducts: Array<{ title: string; sales: number; revenue: number; vendor: string }>;
  topVendors: Array<{
    id: string;
    storeName: string;
    slug: string;
    verified: boolean;
    totalSales: number;
    totalRevenue: number;
    rating: number;
  }>;
  trafficSources: Array<{ source: string; value: number }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
  vendor: { storeName: string; totalRevenue: number } | null;
  affiliate: { code: string; earnings: number } | null;
  orderCount: number;
  reviewCount: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  licenseKey: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  createdAt: string;
  provider: string | null;
  paymentStatus?: string;
  items: OrderItem[];
}

export interface LemonSqueezyCheckout {
  checkoutUrl: string;
  order: Order;
  live: boolean;
  message: string;
}

export interface CouponValidation {
  coupon: {
    code: string;
    type: string;
    value: number;
    minPurchase: number;
    active: boolean;
  };
  discount: number;
  subtotal: number;
  total: number;
}

// ===== API client =====

const BASE = "/api/v1";

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      ...options,
    });
  } catch (e) {
    throw new Error("Network error. Please try again.");
  }

  let json: ApiResult<T> | null = null;
  try {
    json = (await res.json()) as ApiResult<T>;
  } catch {
    throw new Error(`Server returned status ${res.status}`);
  }

  if (!res.ok || !json?.success) {
    const msg = json?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!json.data) {
    throw new Error("Empty response from server");
  }
  return json.data;
}

// ===== Endpoint helpers =====

export interface ProductQuery {
  search?: string;
  category?: string;
  type?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  featured?: string;
  page?: number;
  limit?: number;
}

export function buildProductQuery(q: ProductQuery): string {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.category) params.set("category", q.category);
  if (q.type) params.set("type", q.type);
  if (q.sort) params.set("sort", q.sort);
  if (q.minPrice) params.set("minPrice", q.minPrice);
  if (q.maxPrice) params.set("maxPrice", q.maxPrice);
  if (q.featured) params.set("featured", q.featured);
  if (q.page) params.set("page", String(q.page));
  if (q.limit) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const api = {
  products: (q: ProductQuery = {}) =>
    apiFetch<Paginated<Product>>(`/products${buildProductQuery(q)}`),
  featuredProducts: () =>
    apiFetch<{ items: Product[] }>(`/products/featured`),
  product: (slug: string) =>
    apiFetch<{
      product: Product;
      reviews: Review[];
      ratingBreakdown: RatingBreakdown[];
    }>(`/products/${encodeURIComponent(slug)}`),
  categories: () => apiFetch<{ items: Category[] }>(`/categories`),
  vendors: () => apiFetch<{ items: Vendor[] }>(`/vendors`),
  vendor: (slug: string) =>
    apiFetch<{ vendor: VendorDetail; products: Product[]; coupons: VendorDetail["coupons"] }>(
      `/vendors/${encodeURIComponent(slug)}`
    ),
  affiliates: () => apiFetch<AffiliateStats>(`/affiliates/stats`),
  analytics: () => apiFetch<AnalyticsDashboard>(`/analytics/dashboard`),
  notifications: () => apiFetch<{ items: Notification[] }>(`/notifications`),
  adminUsers: () => apiFetch<{ items: AdminUser[] }>(`/admin/users`),
  adminOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sort?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    if (params?.sort) qs.set("sort", params.sort);
    const q = qs.toString();
    return apiFetch<{ items: Order[]; page: number; limit: number; total: number; totalPages: number }>(
      `/admin/orders${q ? `?${q}` : ""}`,
    );
  },
  adminSettingsGet: () =>
    apiFetch<{ settings: Record<string, any> }>(`/admin/settings`),
  adminSettingsPut: (payload: Record<string, any>) =>
    apiFetch<{ saved: string[]; message: string }>(`/admin/settings`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  adminProductCreate: (payload: {
    title: string;
    type: string;
    price: number;
    discountPrice?: number;
    shortDescription?: string;
    description?: string;
    categorySlug?: string;
    vendorId?: string;
    sku?: string;
    stock?: number;
    tags?: string[];
    licenseType?: string;
    downloadFile?: string;
    fileSize?: number;
    version?: string;
    cover?: string;
    images?: string[];
    featured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
  }) =>
    apiFetch<{ product: any; message: string }>(`/admin/products/create`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminProductUpdate: (payload: {
    id: string;
    [key: string]: any;
  }) =>
    apiFetch<{ product: any; message: string }>(`/admin/products/update`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminProductDelete: (id: string) =>
    apiFetch<{ deleted: boolean; title: string; message: string }>(
      `/admin/products/delete`,
      { method: "POST", body: JSON.stringify({ id }) },
    ),
  adminProductImageUpload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${BASE}/admin/products/upload-image`, {
      method: "POST",
      body: fd,
      // NOTE: do not set Content-Type — fetch will set the multipart boundary.
    })
      .then(async (res) => {
        const json = (await res.json()) as ApiResult<{
          url: string;
          name: string;
          originalName: string;
          size: number;
          mimeType: string;
        }>;
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(
            json?.error?.message || `Upload failed (${res.status})`,
          );
        }
        return json.data;
      })
      .catch((e) => {
        throw e instanceof Error
          ? e
          : new Error("Network error during upload");
      });
  },

  // ===== Admin demo seeder + order status update =====
  adminSeedDemo: () =>
    apiFetch<{ products: number; orders: number; message?: string }>(
      `/admin/seed-demo`,
      { method: "POST" },
    ),
  adminOrderUpdateStatus: (id: string, status: string) =>
    apiFetch<{ order: any; message?: string }>(
      `/admin/orders/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    ),

  // ===== Support Tickets =====
  adminSupportList: (params?: { status?: string; priority?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.priority) qs.set("priority", params.priority);
    if (params?.search) qs.set("search", params.search);
    return apiFetch<{ items: any[] }>(`/admin/support/list${qs.toString() ? `?${qs}` : ""}`);
  },
  adminSupportCreate: (payload: { customerName: string; customerEmail: string; subject: string; description: string; priority: string; category?: string }) =>
    apiFetch<{ ticket: any; message: string }>(`/admin/support/create`, { method: "POST", body: JSON.stringify(payload) }),
  adminSupportUpdate: (payload: { id: string; status: string }) =>
    apiFetch<{ ticket: any; message: string }>(`/admin/support/update`, { method: "POST", body: JSON.stringify(payload) }),
  adminSupportReply: (payload: { id: string; authorName: string; message: string; isStaff: boolean }) =>
    apiFetch<{ ticket: any; message: string }>(`/admin/support/reply`, { method: "POST", body: JSON.stringify(payload) }),

  // ===== Subscriptions =====
  adminSubscriptionsList: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    return apiFetch<{ items: any[] }>(`/admin/subscriptions/list${qs.toString() ? `?${qs}` : ""}`);
  },
  adminSubscriptionCreate: (payload: any) =>
    apiFetch<{ subscription: any; message: string }>(`/admin/subscriptions/create`, { method: "POST", body: JSON.stringify(payload) }),
  adminSubscriptionUpdate: (payload: { id: string; status: string }) =>
    apiFetch<{ subscription: any; message: string }>(`/admin/subscriptions/update`, { method: "POST", body: JSON.stringify(payload) }),

  // ===== IPTV =====
  adminIptvChannels: (params?: { status?: string; category?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    return apiFetch<{ items: any[] }>(`/admin/iptv/channels${qs.toString() ? `?${qs}` : ""}`);
  },
  adminIptvChannelCreate: (payload: any) =>
    apiFetch<{ channel: any; message: string }>(`/admin/iptv/channels/create`, { method: "POST", body: JSON.stringify(payload) }),
  adminIptvChannelUpdate: (payload: any) =>
    apiFetch<{ channel: any; message: string }>(`/admin/iptv/channels/update`, { method: "POST", body: JSON.stringify(payload) }),
  adminIptvChannelDelete: (id: string) =>
    apiFetch<{ deleted: boolean; message: string }>(`/admin/iptv/channels/delete`, { method: "POST", body: JSON.stringify({ id }) }),
  adminIptvSubscribers: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    return apiFetch<{ items: any[] }>(`/admin/iptv/subscribers${qs.toString() ? `?${qs}` : ""}`);
  },
  adminIptvSubscriberCreate: (payload: any) =>
    apiFetch<{ subscriber: any; message: string }>(`/admin/iptv/subscribers/create`, { method: "POST", body: JSON.stringify(payload) }),
  adminIptvSubscriberUpdate: (payload: { id: string; status: string }) =>
    apiFetch<{ subscriber: any; message: string }>(`/admin/iptv/subscribers/update`, { method: "POST", body: JSON.stringify(payload) }),
  adminIptvSubscriberAction: (id: string, action: "activate" | "suspend" | "delete") =>
    apiFetch<{ subscriber?: any; success?: boolean; message?: string }>(`/admin/iptv/subscribers/${id}/action`, { method: "PATCH", body: JSON.stringify({ action }) }),
  adminIptvChannelToggle: (id: string) =>
    apiFetch<{ channel: any; message?: string }>(`/admin/iptv/channels/${id}/toggle`, { method: "PATCH" }),
  adminIptvStats: () =>
    apiFetch<{
      totalChannels: number;
      activeChannels: number;
      errorChannels: number;
      totalSubscribers: number;
      activeSubscribers: number;
      expiredSubscribers: number;
      suspendedSubscribers: number;
    }>(`/admin/iptv/stats`),

  // ===== Finance =====
  adminTransactions: (params?: { status?: string; type?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.type) qs.set("type", params.type);
    if (params?.search) qs.set("search", params.search);
    return apiFetch<{ items: any[] }>(`/admin/finance/transactions${qs.toString() ? `?${qs}` : ""}`);
  },
  adminRevenue: () =>
    apiFetch<{ totalRevenue: number; salesRevenue: number; subscriptionRevenue: number; refunds: number; transactionCount: number }>(`/admin/finance/revenue`),
  adminPaymentGateways: () =>
    apiFetch<{ items: any[] }>(`/admin/finance/gateways`),
  adminGatewayToggle: (payload: { id: string; enabled: boolean }) =>
    apiFetch<{ gateway: any; message: string }>(`/admin/finance/gateways/toggle`, { method: "POST", body: JSON.stringify(payload) }),
  adminGatewayTestMode: (payload: { id: string; testMode: boolean }) =>
    apiFetch<{ gateway: any; message: string }>(`/admin/finance/gateways/test-mode`, { method: "POST", body: JSON.stringify(payload) }),

  // ===== Developer =====
  adminApiKeys: () =>
    apiFetch<{ items: any[] }>(`/admin/developer/api-keys`),
  adminApiKeyCreate: (payload: { name: string; permissions: string[]; expiresAt?: string }) =>
    apiFetch<{ apiKey: any; message: string }>(`/admin/developer/api-keys/create`, { method: "POST", body: JSON.stringify(payload) }),
  adminApiKeyRevoke: (id: string) =>
    apiFetch<{ apiKey: any; message: string }>(`/admin/developer/api-keys/revoke`, { method: "POST", body: JSON.stringify({ id }) }),
  adminWebhooks: () =>
    apiFetch<{ items: any[] }>(`/admin/developer/webhooks`),
  adminWebhookCreate: (payload: { name: string; url: string; events: string[] }) =>
    apiFetch<{ webhook: any; message: string }>(`/admin/developer/webhooks/create`, { method: "POST", body: JSON.stringify(payload) }),
  adminWebhookToggle: (payload: { id: string; status: string }) =>
    apiFetch<{ webhook: any; message: string }>(`/admin/developer/webhooks/toggle`, { method: "POST", body: JSON.stringify(payload) }),
  adminWebhookDelete: (id: string) =>
    apiFetch<{ deleted: boolean; message: string }>(`/admin/developer/webhooks/delete`, { method: "POST", body: JSON.stringify({ id }) }),
  adminAuditLogs: () =>
    apiFetch<{ items: any[] }>(`/admin/developer/audit-logs`),

  // ===== Media (admin) =====
  adminMediaList: (params?: { type?: string; folder?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.folder) qs.set("folder", params.folder);
    if (params?.search) qs.set("search", params.search);
    return apiFetch<{ items: any[] }>(`/admin/media/list${qs.toString() ? `?${qs}` : ""}`);
  },
  adminMediaAdd: (payload: { name: string; url: string; type: string; size: number; mimeType?: string; folder?: string; tags?: string[] }) =>
    apiFetch<{ file: any; message: string }>(`/admin/media/add`, { method: "POST", body: JSON.stringify(payload) }),
  adminMediaDelete: (id: string) =>
    apiFetch<{ deleted: boolean; message: string }>(`/admin/media/delete`, { method: "POST", body: JSON.stringify({ id }) }),

  validateCoupon: (code: string, subtotal: number) =>
    apiFetch<CouponValidation>(`/coupons/validate`, {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    }),
  placeOrder: (payload: {
    items: Array<{ productId: string }>;
    customerName: string;
    customerEmail: string;
    couponCode?: string;
    provider?: string;
    affiliateCode?: string;
  }) =>
    apiFetch<{ order: Order; message: string }>(`/orders`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  checkoutLemonSqueezy: (payload: {
    items: Array<{ productId: string }>;
    customerName: string;
    customerEmail: string;
    couponCode?: string;
    affiliateCode?: string;
  }) =>
    apiFetch<LemonSqueezyCheckout>(`/checkout/lemon-squeezy`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitReview: (payload: {
    productId: string;
    rating: number;
    title?: string;
    comment: string;
  }) =>
    apiFetch<{ review: Review; message: string }>(`/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (email: string, password: string) =>
    apiFetch<{ user: { id: string; name: string; email: string; role: string }; token: string }>(
      `/auth/login`,
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  register: (name: string, email: string, password: string) =>
    apiFetch<{ user: { id: string; name: string; email: string }; token: string }>(
      `/auth/register`,
      { method: "POST", body: JSON.stringify({ name, email, password }) }
    ),
  // ===== WooCommerce =====
  woocommerceProducts: () =>
    apiFetch<{
      configured: boolean;
      items: Array<{
        id: number;
        name: string;
        price: string;
        regular_price: string;
        sale_price: string;
        status: string;
        type: string;
        stock_status: string;
        stock_quantity: number | null;
        images: Array<{ src: string }>;
        categories: Array<{ id: number; name: string }>;
        permalink: string;
        short_description: string;
      }>;
      error?: string;
    }>(`/woocommerce/products`),
  woocommerceTest: (payload: {
    storeUrl: string;
    consumerKey: string;
    consumerSecret: string;
  }) =>
    apiFetch<{
      success: boolean;
      storeUrl: string;
      productCount: number;
      sampleProducts: Array<{
        id: number;
        name: string;
        price: string;
        status: string;
        stock_status: string;
        permalink: string;
      }>;
      storeInfo: {
        version: string;
        wordpressVersion: string;
        theme: string;
        currency: string;
        country: string;
      } | null;
      message: string;
    }>(`/woocommerce/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  woocommerceOrders: () =>
    apiFetch<{
      configured: boolean;
      items: Array<{
        id: number;
        number: string;
        status: string;
        total: string;
        currency: string;
        payment_method_title: string;
        date_created: string;
        billing: { first_name: string; last_name: string; email: string };
        line_items: Array<{ name: string; quantity: number; total: string }>;
      }>;
      error?: string;
    }>(`/woocommerce/orders`),
  // ===== WordPress =====
  wordpressPlugins: (search?: string, browse?: string) =>
    apiFetch<{
      items: Array<{
        slug: string;
        name: string;
        version: string;
        author: string;
        rating: number;
        num_ratings: number;
        downloads: number;
        active_installs: number;
        last_updated: string;
        short_description: string;
        homepage: string;
        download_link: string;
        icons: { svg: string | null; "1x": string | null; "2x": string | null };
        banner: { low: string | null; high: string | null };
        requires: string;
        tested: string;
        requires_php: string;
      }>;
      total: number;
      pages: number;
      browse: string;
      search: string;
      wordpressOrgUrl: string;
    }>(`/wordpress/plugins${search ? `?search=${encodeURIComponent(search)}` : browse ? `?browse=${browse}` : ""}`),
  wordpressPosts: () =>
    apiFetch<{
      configured: boolean;
      items: Array<{
        id: number;
        date: string;
        title: { rendered: string };
        excerpt: { rendered: string };
        link: string;
        status: string;
      }>;
      error?: string;
    }>(`/wordpress/posts`),
  // ===== JazzCash =====
  jazzcashCreate: (payload: {
    amount: number;
    description: string;
    billReference: string;
    customerEmail?: string;
    customerMobile?: string;
  }) =>
    apiFetch<{
      gatewayUrl: string;
      params: Record<string, string>;
      txnRefNo: string;
      sandbox: boolean;
      message: string;
    }>(`/payments/jazzcash/create`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  // ===== Payment Gateways =====
  paymentGateways: () =>
    apiFetch<{
      gateways: Array<{
        id: string;
        name: string;
        description: string;
        fees: string;
        settlement: string;
        active: boolean;
        mode: string;
        configKeys: string[];
        color: string;
        icon: string;
      }>;
      summary: {
        total: number;
        active: number;
        inactive: number;
        live: number;
        sandbox: number;
      };
    }>(`/payments/gateways`),
  // ===== Media Library =====
  mediaList: () =>
    apiFetch<{
      files: Array<{
        name: string;
        url: string;
        size: number;
        folder: string;
        type: string;
        modified: string;
      }>;
      total: number;
      totalSize: number;
      totalSizeFormatted: string;
      folders: Array<{ name: string; count: number }>;
    }>(`/media/list`),

  // ===== Admin product list (with filters) =====
  adminProducts: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    return apiFetch<Paginated<Product>>(
      `/admin/products${qs.toString() ? `?${qs}` : ""}`,
    );
  },

  // ===== Coupons (admin) =====
  couponsList: () => apiFetch<{ items: any[] }>(`/admin/coupons`),
  couponCreate: (payload: any) =>
    apiFetch<{ coupon: any; message: string }>(`/admin/coupons/create`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  couponUpdate: (payload: any) =>
    apiFetch<{ coupon: any; message: string }>(`/admin/coupons/update`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  couponDelete: (id: string) =>
    apiFetch<{ deleted: boolean; message: string }>(`/admin/coupons/delete`, {
      method: "POST",
      body: JSON.stringify({ id }),
    }),

  // ===== Reset analytics (dangerous!) =====
  resetAnalytics: () =>
    apiFetch<{
      cleared: {
        orders: number;
        payments: number;
        notifications: number;
      };
    }>(`/admin/analytics/reset`, { method: "POST" }),

  // ===== Website Builder — public CMS endpoints =====
  blogPosts: () => apiFetch<{ items: any[] }>(`/blog/posts`),
  blogPost: (slug: string) =>
    apiFetch<{ post: any }>(`/blog/posts/${encodeURIComponent(slug)}`),
  faqList: () => apiFetch<{ items: any[] }>(`/faq`),
  careersList: () => apiFetch<{ items: any[] }>(`/careers`),
  career: (slug: string) =>
    apiFetch<{ job: any }>(`/careers/${encodeURIComponent(slug)}`),
  contactSubmit: (payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    message?: string;
    [key: string]: unknown;
  }) =>
    apiFetch<{ success: boolean }>(`/contact`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  staticPage: (slug: string) =>
    apiFetch<{ page: any }>(`/pages/${encodeURIComponent(slug)}`),

  // ===== Website Builder (admin) =====
  websiteBuilderGet: () =>
    apiFetch<{ config: any }>(`/admin/website-builder`),
  websiteBuilderPut: (payload: any) =>
    apiFetch<{ saved: boolean; message: string; updatedAt?: string }>(
      `/admin/website-builder`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),

  // Payment submissions (manual payment proof)
  adminPaymentSubmissions: (status?: string) =>
    apiFetch<{ items: any[]; total: number }>(
      `/admin/payments/submissions${status ? `?status=${status}` : ""}`,
    ),
  adminPaymentSubmissionAction: (id: string, status: "confirmed" | "rejected") =>
    apiFetch<{ submission: any }>(`/admin/payments/submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ===== Utilities =====

export const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatMoney(n: number): string {
  return moneyFormatter.format(n);
}

// ===== Currency system (PKR for Pakistan, USD elsewhere) =====

export type Currency = "USD" | "PKR";

// Prices in the database are ALREADY in PKR. No conversion needed.
// This rate is kept for reference only — it is NOT used to convert prices.
export const PKR_RATE = Number(process.env.NEXT_PUBLIC_PKR_RATE || 280);

export const CURRENCY_META: Record<
  Currency,
  { code: Currency; symbol: string; locale: string; rate: number; label: string }
> = {
  USD: { code: "USD", symbol: "$", locale: "en-US", rate: 1, label: "USD" },
  PKR: { code: "PKR", symbol: "Rs", locale: "en-PK", rate: 1, label: "PKR" },
};

/**
 * Format a price for display.
 *
 * IMPORTANT: Prices in the database are ALREADY in PKR.
 * Do NOT multiply by any exchange rate — just format the number.
 *
 * Example: formatPrice(1674, "PKR") → "Rs 1,674"
 */
export function formatPrice(
  amount: number,
  currency: Currency = "PKR",
): string {
  if (currency === "PKR") {
    return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format an amount that is ALREADY in the given currency (no conversion).
 * Use this for PKR prices — does NOT multiply by 280.
 */
export function formatInCurrency(
  amount: number,
  currency: Currency = "PKR",
): string {
  return formatPrice(amount, currency);
}

/**
 * Auto-detect the preferred currency from the browser timezone.
 * Pakistan (Asia/Karachi) → PKR, everything else → USD.
 */
export function detectCurrency(): Currency {
  if (typeof Intl === "undefined") return "USD";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return tz === "Asia/Karachi" ? "PKR" : "USD";
  } catch {
    return "USD";
  }
}

/**
 * Display a product's price correctly.
 *
 * Lemon Squeezy products already have their price in the store's currency
 * (e.g. PKR for the Pakistan store) and include a `priceFormatted` string
 * from the LS API (e.g. "PKR480/month"). We MUST use that directly — never
 * run it through formatPrice() which assumes the input is USD.
 *
 * For DB-seeded products (analytics only), use formatPrice() with the
 * display currency.
 */
export function displayProductPrice(
  product: { priceFormatted?: string | null; effectivePrice: number },
  currency: Currency = "USD",
): string {
  if (product.priceFormatted) return product.priceFormatted;
  return formatPrice(product.effectivePrice, currency);
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
