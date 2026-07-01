"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BadgeCheck,
  Star,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Send,
  Loader2,
  Store,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductCover } from "./product-cover";
import { StarRating } from "./star-rating";
import {
  api,
  formatMoney,
  formatDate,
  type Vendor,
} from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  accent?: "primary" | "accent";
}) {
  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "grid size-9 place-items-center rounded-lg",
            accent === "accent"
              ? "bg-accent/15 text-accent"
              : "bg-primary/15 text-primary"
          )}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <div className="text-lg font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function VendorHeader({ vendor }: { vendor: Vendor }) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <div className="pb-grid relative">
        <CardContent className="relative flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Store className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{vendor.storeName}</h2>
                {vendor.verified && (
                  <BadgeCheck className="size-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {vendor.description}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {vendor.rating.toFixed(2)} rating
                </span>
                {vendor.createdAt && (
                  <span>Since {formatDate(vendor.createdAt)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Package className="size-3.5" /> View store
            </Button>
            <Button size="sm">
              <TrendingUp className="size-3.5" /> Boost
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function RevenueChart({
  series,
}: {
  series: Array<{ date: string; revenue: number; orders: number }>;
}) {
  const data = React.useMemo(
    () =>
      series.map((s) => ({
        ...s,
        label: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(s.date)),
      })),
    [series]
  );

  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <DollarSign className="size-4 text-primary" />
          Revenue over time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="[&_.recharts-default-tooltip]:bg-card [&_.recharts-default-tooltip]:border [&_.recharts-default-tooltip]:rounded-lg [&_.recharts-default-tooltip]:text-xs h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -16, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.4)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                stroke="rgba(255,255,255,0.4)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => formatMoney(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsTable({
  products,
}: {
  products: Array<{
    id: string;
    title: string;
    type: string;
    effectivePrice: number;
    salesCount: number;
    rating: number;
    status: string;
    cover: any;
  }>;
}) {
  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-sm">Your products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ProductCover
                        cover={p.cover}
                        className="size-8 shrink-0"
                        iconSize={14}
                      />
                      <span className="line-clamp-1 max-w-[180px] text-sm font-medium">
                        {p.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {p.type.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {p.effectivePrice === 0
                      ? "Free"
                      : formatMoney(p.effectivePrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.salesCount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StarRating rating={p.rating} showValue size={12} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[10px]",
                        p.status === "PUBLISHED"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {p.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CouponsSection({
  coupons,
}: {
  coupons: Array<{
    code: string;
    type: string;
    value: number;
    minPurchase: number;
    active: boolean;
  }>;
}) {
  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-sm">Active coupons</CardTitle>
      </CardHeader>
      <CardContent>
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coupons yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3"
              >
                <div>
                  <div className="font-mono text-sm font-bold">{c.code}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.type === "PERCENTAGE" ? `${c.value}% off` : `$${c.value} off`}{" "}
                    · min ${c.minPurchase}
                  </div>
                </div>
                <Badge
                  className={cn(
                    "text-[10px]",
                    c.active
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {c.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReplyRow({
  review,
}: {
  review: { id: string; authorName: string; comment: string; rating: number };
}) {
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{review.authorName}</span>
        <StarRating rating={review.rating} size={12} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{review.comment}</p>
      <div className="mt-2 flex gap-2">
        <Input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply..."
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={sending || !reply.trim()}
          onClick={() => {
            setSending(true);
            setTimeout(() => {
              setSending(false);
              setReply("");
              toast.success("Reply sent");
            }, 600);
          }}
        >
          {sending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Send className="size-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function VendorStudio() {
  // Load vendors list, then load first verified vendor detail
  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.vendors(),
    staleTime: 60_000,
  });

  const vendors = vendorsData?.items ?? [];
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedSlug && vendors.length > 0) {
      // Prefer NovaLabs if present, else first
      const target =
        vendors.find((v) => v.slug === "novalabs") || vendors[0];
      setSelectedSlug(target.slug);
    }
  }, [vendors, selectedSlug]);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-detail", selectedSlug],
    queryFn: () => api.vendor(selectedSlug as string),
    enabled: !!selectedSlug,
    staleTime: 30_000,
  });

  const { data: dash } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.analytics(),
    staleTime: 60_000,
  });

  // Mock "recent reviews needing reply" using dash topProducts as proxy
  const mockReviews = (data?.products || []).slice(0, 3).map((p, i) => ({
    id: `mock-r-${i}`,
    authorName: ["Jordan P.", "Sam L.", "Mia R."][i] || "Customer",
    comment: `Quick question about ${p.title} — does the license cover team use?`,
    rating: 5 - (i % 2),
  }));

  if (vendorsLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:px-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl p-10 text-center text-sm text-muted-foreground">
        No vendor data available.
      </div>
    );
  }

  const vendor = data.vendor;
  const products = data.products;
  const coupons = data.coupons;
  const revenueSeries =
    dash?.revenueTimeseries?.slice(-30) || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6">
      {/* Vendor selector */}
      {vendors.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-scrollbar">
          {vendors.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedSlug(v.slug)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                selectedSlug === v.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:bg-accent/50"
              )}
            >
              {v.storeName}
            </button>
          ))}
        </div>
      )}

      <VendorHeader vendor={vendor} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label="Total sales"
          value={vendor.totalSales.toLocaleString()}
        />
        <StatCard
          icon={DollarSign}
          label="Total revenue"
          value={formatMoney(vendor.totalRevenue)}
          accent="accent"
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={vendor.rating.toFixed(2)}
        />
        <StatCard
          icon={Package}
          label="Products"
          value={products.length.toString()}
        />
      </div>

      <RevenueChart series={revenueSeries} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductsTable products={products} />
        </div>
        <div className="space-y-4">
          <CouponsSection coupons={coupons} />
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm">Reviews to reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">All caught up!</p>
              ) : (
                mockReviews.map((r) => <ReplyRow key={r.id} review={r} />)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
