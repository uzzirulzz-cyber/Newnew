"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Search,
  Eye,
  Download,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, formatPrice, formatShortDate } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["ALL", "COMPLETED", "PENDING", "PAID", "REFUNDED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-500/15 text-green-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  PAID: "bg-blue-500/15 text-blue-400",
  REFUNDED: "bg-red-500/15 text-red-400",
  CANCELLED: "bg-gray-500/15 text-gray-400",
};

export function AdminOrders() {
  const [search, setSearch] = React.useState("");
  const [statusTab, setStatusTab] = React.useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders-list"],
    queryFn: () => api.orders(),
    staleTime: 30_000,
  });

  const orders = (data?.items || []).filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.title.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusTab === "ALL" || o.status === statusTab;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
          <ShoppingCart className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
          <p className="text-sm text-muted-foreground">
            {data?.items.length || 0} total orders
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab === "ALL"
              ? data?.items.length || 0
              : data?.items.filter((o) => o.status === tab).length || 0;
          return (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                statusTab === tab
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number or product..."
          className="border-white/10 bg-white/5 pl-9"
        />
      </div>

      {/* Orders table */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4">Order #</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
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
                        {o.orderNumber}
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs">
                          <p className="line-clamp-1 text-xs">
                            {o.items.map((i) => i.title).join(", ")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {o.items.length} item(s)
                          </p>
                        </div>
                      </td>
                      <td className="p-4 font-bold">{formatPrice(o.total)}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px]">
                          {o.provider || "—"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={STATUS_COLORS[o.status] || "bg-gray-500/15"}>
                          {o.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {formatShortDate(o.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => toast.message(`Viewing ${o.orderNumber}`)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => toast.message("Invoice downloaded")}
                          >
                            <Download className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => toast.message("Refund initiated")}
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
