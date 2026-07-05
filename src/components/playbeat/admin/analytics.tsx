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
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users, ShoppingCart, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, formatPrice, formatShortDate } from "@/lib/api-client";

const CHART_COLORS = ["#7c3aed", "#06b6d4", "#f97316", "#ec4899", "#10b981"];

export function AnalyticsModule() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => api.analytics(),
    staleTime: 30_000,
  });

  const summary = dash?.summary;
  const revenueTimeseries = (dash?.revenueTimeseries || []).slice(-14);
  const topProducts = dash?.topProducts || [];
  const trafficSources = dash?.trafficSources || [];
  const paymentProviders = dash?.paymentProviders || [];

  // Build chart data from real revenue timeseries
  const trafficData = revenueTimeseries.map((d: any) => ({
    date: formatShortDate(d.date),
    revenue: d.revenue,
    orders: d.orders,
  }));

  // Build device data from real payment providers
  const deviceData = paymentProviders.length > 0
    ? paymentProviders.map((p: any, i: number) => ({
        name: p.name,
        value: p.value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
    : [];

  // Top products as pages table
  const topPages = topProducts.map((p: any) => ({
    page: p.title,
    views: p.sales,
    revenue: p.revenue,
  }));

  const stats = [
    {
      title: "Total Revenue",
      value: summary ? formatPrice(summary.revenue) : "—",
      icon: <DollarSign size={18} className="text-purple-500" />,
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Orders",
      value: summary ? String(summary.orders) : "—",
      icon: <ShoppingCart size={18} className="text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Customers",
      value: summary ? String(summary.customers) : "—",
      icon: <Users size={18} className="text-green-500" />,
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Products",
      value: summary ? String(summary.products) : "—",
      icon: <Package size={18} className="text-orange-500" />,
      bg: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time platform analytics — all data from the database.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Revenue chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full rounded-xl" />
            ) : trafficData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={false} name="Revenue (PKR)" />
                  <Line type="monotone" dataKey="orders" stroke="#06b6d4" strokeWidth={2} dot={false} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No revenue data yet. Orders will appear here once customers make purchases.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment providers pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Providers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[180px] w-full rounded-xl" />
            ) : deviceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {deviceData.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {deviceData.map((d: any) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span>{d.name}</span>
                      </div>
                      <span className="font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                No payment data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full rounded-xl" />
          ) : topPages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2 font-medium text-muted-foreground">Product</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Sales</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{p.page}</td>
                      <td className="py-2.5 text-right">{p.views}</td>
                      <td className="py-2.5 text-right text-purple-600 dark:text-purple-400 font-medium">
                        {formatPrice(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No sales data yet. Top products will appear here once orders are placed.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue bar chart */}
      {trafficData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
