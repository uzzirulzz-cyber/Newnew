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
import { TrendingUp, Users, MousePointer, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const trafficData = [
  { date: "Jun 29", sessions: 4200, users: 3100, pageviews: 11200 },
  { date: "Jun 30", sessions: 5100, users: 3800, pageviews: 13600 },
  { date: "Jul 1", sessions: 4800, users: 3500, pageviews: 12400 },
  { date: "Jul 2", sessions: 6200, users: 4700, pageviews: 16800 },
  { date: "Jul 3", sessions: 5800, users: 4400, pageviews: 15200 },
  { date: "Jul 4", sessions: 7100, users: 5300, pageviews: 19300 },
  { date: "Jul 5", sessions: 6700, users: 4900, pageviews: 18100 },
];

const deviceData = [
  { name: "Mobile", value: 58, color: "oklch(0.55 0.22 260)" },
  { name: "Desktop", value: 32, color: "oklch(0.65 0.18 160)" },
  { name: "Tablet", value: 10, color: "oklch(0.7 0.2 40)" },
];

const topPages = [
  { page: "/home", views: 12400, bounce: "42%" },
  { page: "/products", views: 8700, bounce: "38%" },
  { page: "/checkout", views: 5200, bounce: "21%" },
  { page: "/blog", views: 4100, bounce: "65%" },
  { page: "/contact", views: 2900, bounce: "58%" },
];

export function AnalyticsModule() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.analytics(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your website and app performance.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Sessions",
            value: "39,900",
            change: "+14%",
            icon: <MousePointer size={18} className="text-blue-500" />,
            bg: "bg-blue-50 dark:bg-blue-950",
          },
          {
            title: "Unique Users",
            value: "29,700",
            change: "+11%",
            icon: <Users size={18} className="text-green-500" />,
            bg: "bg-green-50 dark:bg-green-950",
          },
          {
            title: "Page Views",
            value: "106,600",
            change: "+18%",
            icon: <TrendingUp size={18} className="text-purple-500" />,
            bg: "bg-purple-50 dark:bg-purple-950",
          },
          {
            title: "Avg. Session",
            value: "3m 42s",
            change: "+5%",
            icon: <Clock size={18} className="text-orange-500" />,
            bg: "bg-orange-50 dark:bg-orange-950",
          },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-green-500 mt-1">
                    {stat.change} this week
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="oklch(0.55 0.22 260)"
                  strokeWidth={2}
                  dot={false}
                  name="Sessions"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="oklch(0.65 0.18 160)"
                  strokeWidth={2}
                  dot={false}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {deviceData.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span>{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium text-muted-foreground">Page</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">
                    Views
                  </th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">
                    Bounce Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p) => (
                  <tr key={p.page} className="border-b last:border-0">
                    <td className="py-2.5 font-mono text-xs">{p.page}</td>
                    <td className="py-2.5 text-right">
                      {p.views.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {p.bounce}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
