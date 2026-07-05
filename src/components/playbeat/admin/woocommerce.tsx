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
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const syncItems = [
  {
    label: "Products",
    count: 248,
    synced: 246,
    lastSync: "2 minutes ago",
    status: "ok",
  },
  {
    label: "Orders",
    count: 1842,
    synced: 1842,
    lastSync: "5 minutes ago",
    status: "ok",
  },
  {
    label: "Customers",
    count: 3201,
    synced: 3198,
    lastSync: "10 minutes ago",
    status: "warning",
  },
  {
    label: "Categories",
    count: 32,
    synced: 32,
    lastSync: "1 hour ago",
    status: "ok",
  },
];

export function AdminWooCommerce() {
  const qc = useQueryClient();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">WooCommerce</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your WooCommerce integration
          </p>
        </div>
        <Button
          onClick={async () => {
            qc.invalidateQueries({ queryKey: ["woocommerce-products"] });
            qc.invalidateQueries({ queryKey: ["woocommerce-orders"] });
            toast.success("Sync started!");
          }}
          className="gap-2"
        >
          <RefreshCw size={16} />
          Sync Now
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe2 size={16} />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-600">
                Connected
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Store URL</span>
                <span className="font-mono text-xs">mystore.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WC Version</span>
                <span>8.4.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Version</span>
                <span>v3</span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 gap-2 w-full"
              onClick={() => toast.info("Opening settings...")}
            >
              <Settings size={14} />
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag size={16} />
              Store Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Products", value: String(wcProducts.length || 248) },
                { label: "Orders Today", value: String(wcOrders.length || 34) },
                { label: "Revenue (MTD)", value: "$12,400" },
                { label: "Customers", value: "3,201" },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {item.status === "ok" ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Last sync: {item.lastSync}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {item.synced.toLocaleString()} /{" "}
                    {item.count.toLocaleString()}
                  </p>
                  {item.synced < item.count && (
                    <p className="text-xs text-yellow-600">
                      {item.count - item.synced} pending
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
