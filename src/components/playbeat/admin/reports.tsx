"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, Download, FileText } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const monthlyData = [
  { month: "Jan", sales: 32000, subscriptions: 8000, refunds: 1200 },
  { month: "Feb", sales: 41000, subscriptions: 9500, refunds: 800 },
  { month: "Mar", sales: 38000, subscriptions: 8800, refunds: 1500 },
  { month: "Apr", sales: 52000, subscriptions: 11000, refunds: 900 },
  { month: "May", sales: 48000, subscriptions: 10500, refunds: 1100 },
  { month: "Jun", sales: 61000, subscriptions: 12000, refunds: 700 },
];

const reportTypes = [
  {
    title: "Sales Report",
    description: "Detailed breakdown of all sales transactions",
    icon: <Receipt size={18} className="text-blue-500" />,
  },
  {
    title: "Revenue Report",
    description: "Monthly and yearly revenue analysis",
    icon: <FileText size={18} className="text-green-500" />,
  },
  {
    title: "Subscription Report",
    description: "Recurring revenue and churn analysis",
    icon: <FileText size={18} className="text-purple-500" />,
  },
  {
    title: "Refund Report",
    description: "All refunded transactions and reasons",
    icon: <FileText size={18} className="text-red-500" />,
  },
  {
    title: "Tax Report",
    description: "Tax collected by region and product type",
    icon: <FileText size={18} className="text-orange-500" />,
  },
  {
    title: "Gateway Report",
    description: "Performance by payment gateway",
    icon: <FileText size={18} className="text-teal-500" />,
  },
];

export function AdminReports() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => api.adminRevenue(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Financial reports and analytics exports
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: `$${Number(summary?.totalRevenue ?? 0).toLocaleString()}`,
            },
            {
              label: "Sales",
              value: `$${Number(summary?.salesRevenue ?? 0).toLocaleString()}`,
            },
            {
              label: "Subscriptions",
              value: `$${Number(summary?.subscriptionRevenue ?? 0).toLocaleString()}`,
            },
            {
              label: "Total Refunds",
              value: `$${Number(summary?.refunds ?? 0).toLocaleString()}`,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Revenue Breakdown (6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`]} />
              <Bar
                dataKey="sales"
                name="Sales"
                fill="oklch(0.55 0.22 260)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="subscriptions"
                name="Subscriptions"
                fill="oklch(0.65 0.18 160)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="refunds"
                name="Refunds"
                fill="oklch(0.577 0.245 27)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-semibold mb-3">Download Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {reportTypes.map((r) => (
            <Card
              key={r.title}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full gap-2 text-xs h-7"
                  onClick={() => toast.success(`Generating ${r.title}...`)}
                >
                  <Download size={12} />
                  Export CSV
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
