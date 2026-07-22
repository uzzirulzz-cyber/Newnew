"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe2,
  ShoppingBag,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { WooCommerceAccount } from "./woocommerce-account";

export function AdminWooCommerce() {
  const qc = useQueryClient();

  // Fetch real WC data (returns configured: false if not connected)
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["woocommerce-products"],
    queryFn: () => api.woocommerceProducts(),
    staleTime: 60_000,
  });
  const { data: ordersData } = useQuery({
    queryKey: ["woocommerce-orders"],
    queryFn: () => api.woocommerceOrders(),
    staleTime: 60_000,
  });

  const wcProducts = productsData?.items || [];
  const wcOrders = ordersData?.items || [];
  const connected = productsData?.configured ?? false;
  const error = productsData?.error || ordersData?.error;

  // Real revenue from WC orders
  const wcRevenue = wcOrders
    .filter((o: any) => o.status === "completed")
    .reduce((s: number, o: any) => s + parseFloat(o.total || "0"), 0);

  const handleSync = async () => {
    toast.success("Syncing WooCommerce data...");
    await qc.invalidateQueries({ queryKey: ["woocommerce-products"] });
    await qc.invalidateQueries({ queryKey: ["woocommerce-orders"] });
    toast.success("Sync complete!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">WooCommerce</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your WooCommerce integration
          </p>
        </div>
        <Button onClick={handleSync} className="gap-2" disabled={!connected}>
          <RefreshCw size={16} />
          Sync Now
        </Button>
      </div>

      {/* Customer accounts — login / create account / list */}
      <WooCommerceAccount />

      {/* Connection + Store Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe2 size={16} />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connected ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Connected
                  </span>
                  <Badge className="ml-auto bg-green-500/15 text-green-600 dark:text-green-400">
                    Live
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Store URL</span>
                    <span className="font-mono text-xs">
                      {process.env.NEXT_PUBLIC_WC_STORE_URL || "Connected store"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Products synced</span>
                    <span className="font-medium">{wcProducts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orders synced</span>
                    <span className="font-medium">{wcOrders.length}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Not Connected
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your WooCommerce store to sync products and orders.
                  Add these to your <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.env</code> file:
                </p>
                <pre className="text-[10px] bg-muted rounded-lg p-3 text-muted-foreground overflow-x-auto">
{`WOOCOMMERCE_STORE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx`}
                </pre>
                <a
                  href="https://woocommerce.com/woocommerce/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-purple-500 hover:text-purple-400"
                >
                  <ExternalLink size={12} />
                  Get WooCommerce
                </a>
              </>
            )}
            {error && connected && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-500">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag size={16} />
              Store Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="text-lg font-bold">{wcProducts.length}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-lg font-bold">{wcOrders.length}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-lg font-bold">
                  {wcRevenue > 0 ? `$${wcRevenue.toFixed(2)}` : "—"}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold">
                  {wcOrders.filter((o: any) => o.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Status — real data only */}
      {connected && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Products</p>
                    <p className="text-xs text-muted-foreground">Synced from WooCommerce</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{wcProducts.length}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Orders</p>
                    <p className="text-xs text-muted-foreground">Synced from WooCommerce</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{wcOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent WC Products */}
      {connected && wcProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wcProducts.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {p.images?.[0]?.src && (
                      <img src={p.images[0].src} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.status}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">${p.price || "0"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
