"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Users,
  ShoppingCart,
  RefreshCw,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Globe,
  Zap,
  Bell,
  Package,
  ArrowRight,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, formatPrice, formatShortDate } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"];

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  delay = 0,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  trend?: { value: string; up: boolean };
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1.5 text-2xl font-bold">{value}</p>
              {trend && (
                <div className="mt-1.5 flex items-center gap-1 text-xs">
                  {trend.up ? (
                    <TrendingUp className="size-3 text-green-400" />
                  ) : (
                    <TrendingDown className="size-3 text-red-400" />
                  )}
                  <span className={trend.up ? "text-green-400" : "text-red-400"}>
                    {trend.value}
                  </span>
                </div>
              )}
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10">
              <Icon className="size-5 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs backdrop-blur-xl">
      <p className="mb-1 font-medium text-white">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const qc = useQueryClient();
  const [resetting, setResetting] = React.useState(false);
  const { data: dash, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.analytics(),
    staleTime: 30_000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.adminOrders(),
    staleTime: 30_000,
  });

  const { data: notifData } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.notifications(),
    staleTime: 30_000,
  });

  const summary = dash?.summary;
  const recentOrders = (ordersData?.items || []).slice(0, 6);
  const notifications = (notifData?.items || []).slice(0, 5);
  const revenueData = (dash?.revenueTimeseries || []).slice(-14);
  const trafficData = dash?.trafficSources || [];
  const topProducts = dash?.topProducts || [];
  const topVendors = dash?.topVendors || [];

  const statusColor: Record<string, string> = {
    COMPLETED: "bg-green-500/15 text-green-400",
    PENDING: "bg-amber-500/15 text-amber-400",
    PAID: "bg-blue-500/15 text-blue-400",
    REFUNDED: "bg-red-500/15 text-red-400",
    CANCELLED: "bg-gray-500/15 text-gray-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of your PlayBeat Digital marketplace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
            disabled={resetting}
            onClick={async () => {
              if (
                !confirm(
                  "Reset all dashboard analytics to 0?\n\nThis permanently deletes ALL orders, payments, and notifications. Products, users, and coupons are preserved. This cannot be undone.",
                )
              )
                return;
              setResetting(true);
              try {
                const result = await api.resetAnalytics();
                qc.invalidateQueries({ queryKey: ["admin-analytics"] });
                qc.invalidateQueries({ queryKey: ["admin-orders"] });
                qc.invalidateQueries({ queryKey: ["admin-notifications"] });
                toast.success(
                  `Dashboard reset — cleared ${result.cleared.orders} orders, ${result.cleared.payments} payments, ${result.cleared.notifications} notifications.`,
                );
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : "Reset failed",
                );
              } finally {
                setResetting(false);
              }
            }}
          >
            {resetting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Reset to 0
          </Button>
          <Button
            variant="outline"
            className="border-white/10 bg-white/5"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["admin-analytics"] });
              qc.invalidateQueries({ queryKey: ["admin-orders"] });
              qc.invalidateQueries({ queryKey: ["admin-notifications"] });
              toast.success("Dashboard refreshed");
            }}
          >
            <Activity className="size-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard
              icon={DollarSign}
              label="Live Revenue"
              value={summary ? formatPrice(summary.liveRevenue || summary.revenue) : "—"}
              trend={{ value: "+12.5%", up: true }}
              delay={0}
            />
            <KpiCard
              icon={Users}
              label="Customers"
              value={summary ? String(summary.customers) : "—"}
              trend={{ value: "+8.2%", up: true }}
              delay={0.05}
            />
            <KpiCard
              icon={ShoppingCart}
              label="Orders"
              value={summary ? String(summary.orders) : "—"}
              trend={{ value: "+15.3%", up: true }}
              delay={0.1}
            />
            <KpiCard
              icon={Package}
              label="Products"
              value={summary ? String(summary.products) : "—"}
              delay={0.15}
            />
            <KpiCard
              icon={CreditCard}
              label="Payment Success"
              value={summary ? `${summary.paymentSuccessRate || 0}%` : "—"}
              trend={{ value: "+0.8%", up: true }}
              delay={0.2}
            />
            <KpiCard
              icon={TrendingUp}
              label="Conversion Rate"
              value={summary ? `${summary.conversionRate}%` : "—"}
              trend={{ value: "-0.3%", up: false }}
              delay={0.25}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue trend */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatShortDate(v)}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Traffic sources */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={trafficData}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {trafficData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {trafficData.map((t, i) => (
                <div key={t.source} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{t.source}</span>
                  <span className="font-medium">{t.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System status + Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Server", icon: Server, status: "Operational" },
              { label: "CDN", icon: Globe, status: "Operational" },
              { label: "Payment Gateway", icon: CreditCard, status: "Operational" },
              { label: "Database", icon: Activity, status: "Operational" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <s.icon className="size-4 text-muted-foreground" />
                  {s.label}
                </div>
                <Badge className="bg-green-500/15 text-green-400">
                  <span className="mr-1 size-1.5 rounded-full bg-green-400" />
                  {s.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { label: "Add Product", icon: Package },
              { label: "Create Coupon", icon: Zap },
              { label: "Send Newsletter", icon: Bell },
              { label: "View Reports", icon: TrendingUp },
            ].map((a) => (
              <Button
                key={a.label}
                variant="outline"
                className="h-auto flex-col gap-1 border-white/10 bg-white/5 py-3 text-xs"
                onClick={() => toast.message(`${a.label} — coming soon`)}
              >
                <a.icon className="size-4 text-blue-400" />
                {a.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Live Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No recent activity
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2 rounded-lg bg-white/5 p-2 text-xs"
                >
                  <div className="mt-0.5 size-2 shrink-0 rounded-full bg-blue-400" />
                  <div className="min-w-0">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + Top products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No orders yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.items.length} item(s) · {formatShortDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {formatPrice(o.total)}
                      </span>
                      <Badge className={statusColor[o.status] || "bg-gray-500/15"}>
                        {o.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No product data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={100}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v) => (v.length > 14 ? v.slice(0, 14) + "…" : v)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#ffffff08" }} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
