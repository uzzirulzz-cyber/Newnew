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
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowRight,
} from "lucide-react";
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
  { month: "Jan", revenue: 32000, refunds: 1200 },
  { month: "Feb", revenue: 41000, refunds: 800 },
  { month: "Mar", revenue: 38000, refunds: 1500 },
  { month: "Apr", revenue: 52000, refunds: 900 },
  { month: "May", revenue: 48000, refunds: 1100 },
  { month: "Jun", revenue: 61000, refunds: 700 },
  { month: "Jul", revenue: 57000, refunds: 1000 },
];

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-600",
  refunded: "bg-gray-100 text-gray-600",
};

export function FinanceModule() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => api.adminRevenue(),
    staleTime: 30_000,
  });
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: () => api.adminTransactions(),
    staleTime: 30_000,
  });
  const transactions = txData?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Revenue overview and financial metrics
        </p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 dark:bg-green-950 rounded-lg">
                  <DollarSign size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">
                    ${Number(summary?.totalRevenue ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <TrendingUp size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sales Revenue</p>
                  <p className="text-xl font-bold">
                    ${Number(summary?.salesRevenue ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <CreditCard size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Subscriptions
                  </p>
                  <p className="text-xl font-bold">
                    $
                    {Number(summary?.subscriptionRevenue ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-950 rounded-lg">
                  <TrendingDown size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Refunds</p>
                  <p className="text-xl font-bold">
                    ${Number(summary?.refunds ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue vs Refunds</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`]} />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="oklch(0.55 0.22 260)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="refunds"
                name="Refunds"
                fill="oklch(0.577 0.245 27.325)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Button
            variant="link"
            className="text-xs text-primary flex items-center gap-1 h-auto p-0"
            onClick={() => toast.info("Opening reports...")}
          >
            View reports <ArrowRight size={12} />
          </Button>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium text-muted-foreground">
                      ID
                    </th>
                    <th className="text-left pb-2 font-medium text-muted-foreground hidden md:table-cell">
                      Customer
                    </th>
                    <th className="text-left pb-2 font-medium text-muted-foreground hidden sm:table-cell">
                      Type
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-center pb-2 font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((t: any) => (
                    <tr
                      key={t._id ?? t.id}
                      className="border-b last:border-0"
                    >
                      <td className="py-2.5 font-mono text-xs">
                        {t.transactionId ?? t.id}
                      </td>
                      <td className="py-2.5 hidden md:table-cell">
                        {t.customerName ?? "—"}
                      </td>
                      <td className="py-2.5 capitalize text-muted-foreground hidden sm:table-cell">
                        {t.type}
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        ${Number(t.amount ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[t.status] ?? ""}`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
