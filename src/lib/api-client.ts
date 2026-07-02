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

// Conversion rate: 1 USD = 280 PKR. Adjust via PKR_RATE env if needed.
export const PKR_RATE = Number(process.env.NEXT_PUBLIC_PKR_RATE || 280);

export const CURRENCY_META: Record<
  Currency,
  { code: Currency; symbol: string; locale: string; rate: number; label: string }
> = {
  USD: { code: "USD", symbol: "$", locale: "en-US", rate: 1, label: "USD" },
  PKR: { code: "PKR", symbol: "Rs", locale: "en-PK", rate: PKR_RATE, label: "PKR" },
};

/**
 * Format a USD amount in the given display currency. PKR amounts are rounded
 * to the nearest whole rupee (no decimals) per local convention.
 */
export function formatPrice(
  usdAmount: number,
  currency: Currency = "USD",
): string {
  const meta = CURRENCY_META[currency];
  const converted = usdAmount * meta.rate;
  if (currency === "PKR") {
    return `Rs ${Math.round(converted).toLocaleString("en-PK")}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(usdAmount);
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
