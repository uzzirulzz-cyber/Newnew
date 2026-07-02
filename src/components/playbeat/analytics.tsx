"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Store,
  Star,
  TrendingUp,
  Percent,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  api,
  formatMoney,
  formatNumber,
  type AnalyticsDashboard,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

const PALETTE = ["#10b981", "#f59e0b", "#06b6d4", "#a855f7", "#ec4899", "#22c55e", "#eab308", "#14b8a6"];

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  accent?: "primary" | "accent";
}) {
  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <div
            className={cn(
              "grid size-7 place-items-center rounded-md",
              accent === "accent"
                ? "bg-accent/15 text-accent"
                : "bg-primary/15 text-primary"
            )}
          >
            <Icon className="size-3.5" />
          </div>
        </div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: p.color || p.fill }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono">
            {typeof p.value === "number" && p.name?.toLowerCase().includes("revenue")
              ? formatMoney(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Analytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => api.analytics(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:px-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl p-10 text-center text-sm text-muted-foreground">
        Couldn&apos;t load analytics. Please try again later.
      </div>
    );
  }

  const d: AnalyticsDashboard = data;
  const revenueSeries = d.revenueTimeseries.map((s) => ({
    ...s,
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(s.date)),
  }));

  const categoryData = d.revenueByCategory.map((c) => ({
    name: c.name,
    revenue: Math.round(c.revenue),
    orders: c.orders,
  }));

  const providerData = d.paymentProviders.map((p) => ({
    name: p.name.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
    value: p.value,
  }));

  const trafficData = d.trafficSources.map((t) => ({
    name: t.source,
    value: t.value,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Real-time store performance & revenue insights.
          </p>
        </div>
        <Badge className="bg-primary/15 text-primary">
          <TrendingUp className="size-3" />
          Last 30 days
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label="Revenue"
          value={formatMoney(d.summary.revenue)}
          accent="accent"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Orders"
          value={formatNumber(d.summary.orders)}
        />
        <KpiCard
          icon={Users}
          label="Customers"
          value={formatNumber(d.summary.customers)}
        />
        <KpiCard
          icon={Package}
          label="Products"
          value={formatNumber(d.summary.products)}
        />
        <KpiCard
          icon={Store}
          label="Vendors"
          value={formatNumber(d.summary.vendors)}
        />
        <KpiCard
          icon={DollarSign}
          label="AOV"
          value={formatMoney(d.summary.aov)}
        />
        <KpiCard
          icon={Percent}
          label="Conversion rate"
          value={`${d.summary.conversionRate}%`}
          accent="accent"
        />
        <KpiCard
          icon={Star}
          label="Avg rating"
          value={d.summary.avgRating.toFixed(2)}
        />
      </div>

      {/* Revenue chart */}
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="size-4 text-primary" />
            Revenue trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueSeries}
                margin={{ left: -8, right: 8, top: 4 }}
              >
                <defs>
                  <linearGradient id="aRev" x1="0" y1="0" x2="0" y2="1">
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
                  interval={5}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#aRev)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by category */}
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm">Revenue by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment providers */}
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm">Payment providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {providerData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top products */}
        <Card className="bg-card/60 backdrop-blur lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Top products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.topProducts.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {p.title}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.sales}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatMoney(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Traffic sources */}
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm">Traffic sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                  >
                    {trafficData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top vendors */}
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm">Top vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {d.topVendors.map((v, i) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-md bg-muted/40 text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      {v.storeName}
                      {v.verified && (
                        <BadgeCheck className="size-3.5 text-primary" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.totalSales} sales · ★ {v.rating.toFixed(2)}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {formatMoney(v.totalRevenue)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
