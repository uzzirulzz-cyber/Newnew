"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MousePointerClick,
  Target,
  Percent,
  DollarSign,
  Wallet,
  Link2,
  Copy,
  Loader2,
  Send,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  formatDate,
} from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  hint?: string;
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
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function AffiliateHub() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["affiliate-stats"],
    queryFn: () => api.affiliates(),
    staleTime: 30_000,
  });

  const [copied, setCopied] = React.useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:px-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl p-10 text-center text-sm text-muted-foreground">
        Couldn&apos;t load your affiliate dashboard. Try again later.
      </div>
    );
  }

  const { affiliate, stats, timeseries, payouts, topProducts } = data;
  const chartData = timeseries
    .filter((t) => t.clicks > 0 || t.conversions > 0)
    .map((t) => ({
      ...t,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(t.date)),
    }));

  const copyLink = () => {
    navigator.clipboard?.writeText(affiliate.referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6">
      {/* Header */}
      <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
        <div className="pb-grid relative">
          <CardContent className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge className="mb-2 bg-primary/15 text-primary">
                {affiliate.status}
              </Badge>
              <h2 className="text-xl font-bold">Affiliate dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Earn {affiliate.commissionRate}% commission on every converted
                sale.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-2">
                <Link2 className="size-4 text-primary" />
                <Input
                  readOnly
                  value={affiliate.referralLink}
                  className="h-7 w-56 border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
                />
                <Button size="sm" variant="outline" onClick={copyLink}>
                  {copied ? (
                    <Send className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  Copy
                </Button>
              </div>
              <Badge className="bg-accent text-accent-foreground">
                {affiliate.commissionRate}% commission
              </Badge>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={MousePointerClick}
          label="Total clicks"
          value={formatNumber(stats.totalClicks)}
        />
        <StatCard
          icon={Target}
          label="Conversions"
          value={formatNumber(stats.totalConversions)}
        />
        <StatCard
          icon={Percent}
          label="Conversion rate"
          value={`${stats.conversionRate}%`}
          accent="accent"
        />
        <StatCard
          icon={DollarSign}
          label="Total earnings"
          value={formatMoney(stats.totalEarnings)}
          accent="accent"
        />
        <StatCard
          icon={Wallet}
          label="Pending balance"
          value={formatMoney(stats.balance)}
        />
      </div>

      {/* Chart */}
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="size-4 text-primary" />
            Clicks &amp; conversions (30d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No activity in the last 30 days.
            </p>
          ) : (
            <div className="[&_.recharts-default-tooltip]:bg-card [&_.recharts-default-tooltip]:border [&_.recharts-default-tooltip]:rounded-lg [&_.recharts-default-tooltip]:text-xs h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ left: -16, right: 8, top: 4 }}
                >
                  <defs>
                    <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#clickGrad)"
                    name="Clicks"
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#f59e0b" }}
                    name="Conversions"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top products */}
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm">Top referring products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No conversions yet.
              </p>
            ) : (
              topProducts.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-md bg-muted/40 text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="line-clamp-1 max-w-[200px] text-sm font-medium">
                      {p.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {p.conversions} conv
                    </span>
                    <span className="font-semibold text-primary">
                      {formatMoney(p.earnings)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payouts */}
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Payout history</CardTitle>
            <Button
              size="sm"
              variant="outline"
              disabled={stats.balance <= 0}
              onClick={() => toast.success("Payout requested — we'll email you")}
            >
              <Wallet className="size-3.5" />
              Request payout
            </Button>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payouts yet.</p>
            ) : (
              <div className="overflow-x-auto pb-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {formatMoney(p.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.method}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-[10px]",
                              p.status === "COMPLETED"
                                ? "bg-primary/15 text-primary"
                                : p.status === "PENDING"
                                ? "bg-accent/20 text-accent"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {p.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(p.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
