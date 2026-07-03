"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart as WooCommerceIcon,
  ShoppingCart,
  Search,
  Package,
  TrendingUp,
  DollarSign,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400",
  processing: "bg-blue-500/15 text-blue-400",
  pending: "bg-amber-500/15 text-amber-400",
  cancelled: "bg-red-500/15 text-red-400",
  refunded: "bg-purple-500/15 text-purple-400",
  failed: "bg-red-500/15 text-red-400",
  publish: "bg-green-500/15 text-green-400",
  draft: "bg-gray-500/15 text-gray-400",
  instock: "bg-green-500/15 text-green-400",
  outofstock: "bg-red-500/15 text-red-400",
  onbackorder: "bg-amber-500/15 text-amber-400",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function AdminWooCommerce() {
  const [tab, setTab] = React.useState<"products" | "orders">("products");
  const [search, setSearch] = React.useState("");

  const productsQ = useQuery({
    queryKey: ["wc-products"],
    queryFn: () => api.woocommerceProducts(),
    staleTime: 60_000,
  });
  const ordersQ = useQuery({
    queryKey: ["wc-orders"],
    queryFn: () => api.woocommerceOrders(),
    staleTime: 60_000,
  });

  const configured = productsQ.data?.configured ?? false;
  const error = productsQ.data?.error || ordersQ.data?.error;
  const products = (productsQ.data?.items || []).filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const orders = (ordersQ.data?.items || []).filter(
    (o) =>
      !search ||
      o.number.includes(search) ||
      `${o.billing.first_name} ${o.billing.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + parseFloat(o.total || "0"), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
          <WooCommerceIcon className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">WooCommerce</h1>
          <p className="text-sm text-muted-foreground">
            Sync products, orders, and customers from your WooCommerce store
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5"
          onClick={() => {
            productsQ.refetch();
            ordersQ.refetch();
            toast.success("Syncing WooCommerce data...");
          }}
        >
          <RefreshCw className="size-4" /> Sync
        </Button>
      </div>

      {/* Not configured state */}
      {!configured && !productsQ.isLoading && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="size-8 text-amber-400" />
            <div className="flex-1">
              <p className="font-semibold">WooCommerce is not connected</p>
              <p className="text-sm text-muted-foreground">
                Add these env vars to your <code>.env</code> file to connect your
                WooCommerce store:
              </p>
              <pre className="mt-2 rounded-lg bg-black/40 p-3 text-[11px] text-muted-foreground">
{`WOOCOMMERCE_STORE_URL=https://shop.playbeat.live
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx`}
              </pre>
              <p className="mt-2 text-xs text-muted-foreground">
                Get your API keys at: WooCommerce → Settings → Advanced → REST API
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {configured && error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="size-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {configured && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="size-3.5" /> Products
              </div>
              <p className="mt-1 text-2xl font-bold text-blue-400">
                {productsQ.data?.items.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShoppingCart className="size-3.5" /> Orders
              </div>
              <p className="mt-1 text-2xl font-bold text-purple-400">
                {ordersQ.data?.items.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="size-3.5" /> Revenue
              </div>
              <p className="mt-1 text-2xl font-bold text-green-400">
                {totalRevenue > 0 ? `$${totalRevenue.toFixed(2)}` : "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="size-3.5" /> Completed
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-400">
                {orders.filter((o) => o.status === "completed").length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {configured && (
        <div className="flex gap-2">
          {(["products", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {configured && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="border-white/10 bg-white/5 pl-9"
          />
        </div>
      )}

      {/* Products table */}
      {configured && tab === "products" && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Product</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-right">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {productsQ.isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="p-4">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.images?.[0]?.src ? (
                              <img
                                src={p.images[0].src}
                                alt={p.name}
                                className="size-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="grid size-10 place-items-center rounded-lg bg-white/5">
                                <Package className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.categories?.[0]?.name || "Uncategorized"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {p.sale_price ? (
                            <div>
                              <span className="font-bold text-green-400">
                                ${p.sale_price}
                              </span>
                              <span className="ml-1 text-xs text-muted-foreground line-through">
                                ${p.regular_price}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold">
                              {p.price ? `$${p.price}` : "—"}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[p.status] || "bg-gray-500/15"}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[p.stock_status] || "bg-gray-500/15"}>
                            {p.stock_status?.replace(/([A-Z])/g, " $1").trim() || "—"}
                          </Badge>
                        </td>
                        <td className="p-4 capitalize text-muted-foreground">
                          {p.type}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => window.open(p.permalink, "_blank")}
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders table */}
      {configured && tab === "orders" && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersQ.isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="p-4">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="p-4 font-mono text-xs font-medium">
                          #{o.number}
                        </td>
                        <td className="p-4">
                          <p className="font-medium">
                            {o.billing.first_name} {o.billing.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {o.billing.email}
                          </p>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {o.line_items?.length || 0} item(s)
                        </td>
                        <td className="p-4 font-bold">
                          {o.total} {o.currency}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {o.payment_method_title || "—"}
                        </td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[o.status] || "bg-gray-500/15"}>
                            {o.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(o.date_created).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
