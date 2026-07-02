"use client";

import * as React from "react";
import {
  FileText,
  Download,
  Calendar,
  FileSpreadsheet,
  FileType,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Tv,
  RefreshCw,
  UserCheck,
  Receipt,
  ArrowDownRight,
  Plus,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatPill,
  notifyExport,
  notifyComingSoon,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const REPORTS = [
  { id: "sales", name: "Sales Report", icon: ShoppingCart, desc: "Daily, weekly, monthly sales breakdown by product and category", accent: "from-blue-600 to-blue-500", lastRun: "2 hours ago" },
  { id: "revenue", name: "Revenue Report", icon: DollarSign, desc: "Gross/net revenue with refunds, fees, and tax breakdown", accent: "from-emerald-600 to-emerald-500", lastRun: "5 hours ago" },
  { id: "customer", name: "Customer Report", icon: Users, desc: "New vs returning customers, LTV, cohort analysis", accent: "from-purple-600 to-purple-500", lastRun: "1 day ago" },
  { id: "product", name: "Product Report", icon: Package, desc: "Best/worst sellers, inventory, sales velocity", accent: "from-cyan-600 to-cyan-500", lastRun: "3 hours ago" },
  { id: "iptv", name: "IPTV Usage Report", icon: Tv, desc: "Channel views, server load, viewer retention", accent: "from-pink-600 to-pink-500", lastRun: "12 hours ago" },
  { id: "subscription", name: "Subscription Report", icon: RefreshCw, desc: "MRR, ARR, churn, retention, plan distribution", accent: "from-amber-600 to-amber-500", lastRun: "1 day ago" },
  { id: "affiliate", name: "Affiliate Report", icon: UserCheck, desc: "Affiliate performance, conversions, payouts", accent: "from-blue-600 to-cyan-500", lastRun: "2 days ago" },
  { id: "tax", name: "Tax Report", icon: Receipt, desc: "VAT, GST, sales tax collected by region", accent: "from-purple-600 to-pink-500", lastRun: "1 week ago" },
  { id: "refund", name: "Refund Report", icon: ArrowDownRight, desc: "Refunds issued, reasons, chargeback analysis", accent: "from-rose-600 to-rose-500", lastRun: "4 hours ago" },
];

export function ReportsModule() {
  const [range, setRange] = React.useState("30d");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Reports"
        description="Generate and export detailed business reports"
        icon={FileText}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Custom report builder")}>
            <Plus className="size-4" /> Custom Report
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Reports Generated (30d)" value="148" accent="blue" />
        <StatPill label="Scheduled" value="12" accent="purple" />
        <StatPill label="Scheduled Failed" value="2" accent="pink" />
        <StatPill label="Total Exports" value="384" accent="green" />
      </div>

      {/* Date range */}
      <AdminCard>
        <AdminCardHeader
          title="Report Configuration"
          icon={Calendar}
          description="Set date range and output format for batch exports"
        />
        <div className="p-4 grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-white/70">Preset Range</Label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-white/70">From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-white/70">To</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex items-end">
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 w-full"
              onClick={() => notifyExport("ZIP (all reports)")}
            >
              <Download className="size-3.5" /> Export All
            </Button>
          </div>
        </div>
      </AdminCard>

      {/* Report grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <AdminCard key={r.id} className="group hover:border-blue-500/30 transition-colors">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className={cn("grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", r.accent)}>
                  <r.icon className="size-5" />
                </div>
                <span className="text-[10px] text-white/40">Last: {r.lastRun}</span>
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold text-white">{r.name}</div>
                <p className="mt-1 text-xs text-white/60 line-clamp-2">{r.desc}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => notifyExport(`PDF — ${r.name}`)}
                >
                  <FileText className="size-3.5" /> PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => notifyExport(`Excel — ${r.name}`)}
                >
                  <FileSpreadsheet className="size-3.5" /> Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => notifyExport(`CSV — ${r.name}`)}
                >
                  <FileType className="size-3.5" /> CSV
                </Button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
