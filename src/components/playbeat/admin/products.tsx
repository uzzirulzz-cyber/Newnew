"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Package, Search, Eye, Pencil, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCover } from "@/components/playbeat/product-cover";
import { api, displayProductPrice } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function AdminProducts() {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: () => api.products({ search, limit: 48 }),
    staleTime: 30_000,
  });

  const products = (data?.items || []).filter((p) => {
    const matchesType = typeFilter === "ALL" || p.type === typeFilter;
    return matchesType;
  });

  const TYPE_LABELS: Record<string, string> = {
    SAAS_SUBSCRIPTION: "Subscription",
    DIGITAL_DOWNLOAD: "Digital",
    GIFT_CARD: "Gift Card",
    AI_TOOL: "AI Tool",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
          <Package className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Management</h1>
          <p className="text-sm text-muted-foreground">
            Products synced from your Lemon Squeezy store ({data?.total || 0} total)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="border-white/10 bg-white/5 pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full border-white/10 bg-white/5 sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="SAAS_SUBSCRIPTION">Subscriptions</SelectItem>
            <SelectItem value="DIGITAL_DOWNLOAD">Digital</SelectItem>
            <SelectItem value="GIFT_CARD">Gift Cards</SelectItem>
            <SelectItem value="AI_TOOL">AI Tools</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5"
          onClick={() => toast.message("Bulk upload — coming soon")}
        >
          Bulk Upload
        </Button>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-12 text-center">
            <Package className="mx-auto mb-3 size-12 text-muted-foreground" />
            <p className="font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">
              Add products in your Lemon Squeezy dashboard to see them here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Card
              key={p.id}
              className="group border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-blue-500/30"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl">
                <ProductCover
                  cover={p.cover}
                  className="size-full rounded-none"
                  iconSize={40}
                />
                <div className="absolute right-2 top-2">
                  <Badge className="bg-black/60 text-[9px] uppercase backdrop-blur">
                    {TYPE_LABELS[p.type] || p.type}
                  </Badge>
                </div>
              </div>
              <CardContent className="space-y-2 p-4">
                <p className="line-clamp-1 text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.vendor?.storeName || "Independent"}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-blue-400">
                    {p.priceFormatted || displayProductPrice(p)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => toast.message(`Viewing ${p.title}`)}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    {p.buyNowUrl && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => window.open(p.buyNowUrl!, "_blank")}
                      >
                        <ExternalLink className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
