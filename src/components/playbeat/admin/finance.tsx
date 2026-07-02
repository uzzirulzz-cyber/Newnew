"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  FileSpreadsheet,
  FileType,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  KpiCard,
  CHART_COLORS,
  CHART_PALETTE,
  StatPill,
  notifyExport,
} from "./shared";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EXPENSE_DATA = [
  { name: "Server / CDN", value: 8420 },
  { name: "Payment Fees", value: 6210 },
  { name: "Affiliate Payouts", value: 4830 },
  { name: "Vendor Payouts", value: 12480 },
  { name: "Marketing", value: 3240 },
  { name: "Tools", value: 1820 },
];

const PROFIT_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  revenue: 28000 + Math.round(Math.sin(i * 0.6) * 4000) + i * 1200,
  profit: 9200 + Math.round(Math.sin(i * 0.6) * 1800) + i * 480,
}));

const COMMISSIONS = [
  { id: "v1", name: "PixelForge Studio", role: "Vendor", rate: "85%", amount: "$4,820", status: "paid" },
  { id: "v2", name: "NovaLabs", role: "Vendor", rate: "80%", amount: "$3,210", status: "pending" },
  { id: "a1", name: "Sarah K. (affiliate)", role: "Affiliate", rate: "15%", amount: "$1,840", status: "paid" },
  { id: "v3", name: "SecureStack", role: "Vendor", rate: "85%", amount: "$2,440", status: "paid" },
  { id: "a2", name: "TechReviews PK", role: "Affiliate", rate: "20%", amount: "$2,990", status: "pending" },
  { id: "v4", name: "Lumen Games", role: "Vendor", rate: "75%", amount: "$1,810", status: "paid" },
];

export function FinanceModule() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Finance"
        description="Track revenue, expenses, profit, and payouts"
        icon={DollarSign}
        actions={
          <>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyExport("PDF")}>
              <FileText className="size-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyExport("Excel")}>
              <FileSpreadsheet className="size-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyExport("CSV")}>
              <FileType className="size-4" /> CSV
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Gross Revenue" value="$48,210" icon={DollarSign} accent="green" trend={{ value: "12.4%", up: true }} spark={[28, 32, 30, 38, 42, 48]} />
        <KpiCard label="Net Profit" value="$18,640" icon={TrendingUp} accent="blue" trend={{ value: "8.1%", up: true }} spark={[8, 10, 11, 13, 16, 18]} />
        <KpiCard label="Expenses" value="$12,640" icon={TrendingDown} accent="pink" trend={{ value: "3.2%", up: false }} spark={[10, 11, 12, 11, 12, 12]} />
        <KpiCard label="Refunds" value="$840" icon={ArrowDownRight} accent="amber" trend={{ value: "1.1%", up: false }} spark={[1.2, 0.9, 1.0, 0.8, 0.9, 0.8]} />
        <KpiCard label="Commissions" value="$4,830" icon={ArrowUpRight} accent="purple" trend={{ value: "4.4%", up: true }} spark={[3.2, 3.8, 4.1, 4.3, 4.6, 4.8]} />
        <KpiCard label="Avg Order" value="$38.40" icon={DollarSign} accent="cyan" trend={{ value: "0.8%", up: true }} spark={[34, 36, 37, 38, 38, 38]} />
      </div>

      {/* Profit trend */}
      <AdminCard>
        <AdminCardHeader
          title="Revenue vs Profit — 12 months"
          icon={TrendingUp}
          description="Monthly trend with profit overlay"
        />
        <div className="p-4 pt-2">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={PROFIT_DATA} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white" }}
                formatter={(v: any) => `$${Number(v).toLocaleString()}`}
              />
              <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="profit" stroke={CHART_COLORS.purple} strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Expense breakdown */}
        <AdminCard>
          <AdminCardHeader
            title="Expense Breakdown"
            icon={TrendingDown}
            description="By category (this month)"
          />
          <div className="p-4 pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={EXPENSE_DATA} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
                  {EXPENSE_DATA.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white" }}
                  formatter={(v: any) => `$${Number(v).toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {EXPENSE_DATA.map((e, i) => (
                <div key={e.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-white/70">
                    <span className="size-2 rounded-full" style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                    {e.name}
                  </span>
                  <span className="text-white">${e.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>

        {/* Refund stats */}
        <AdminCard>
          <AdminCardHeader
            title="Refund Summary"
            icon={ArrowDownRight}
            description="Last 30 days"
          />
          <div className="p-4 pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Total" value="$840" accent="pink" />
              <StatPill label="Count" value="22" accent="blue" />
              <StatPill label="Avg" value="$38.18" accent="purple" />
              <StatPill label="Rate" value="1.7%" accent="cyan" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60 mb-1.5">By reason</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-white/70">Customer changed mind</span><span className="text-white">42%</span></div>
                <div className="flex justify-between"><span className="text-white/70">Duplicate charge</span><span className="text-white">23%</span></div>
                <div className="flex justify-between"><span className="text-white/70">Product not received</span><span className="text-white">19%</span></div>
                <div className="flex justify-between"><span className="text-white/70">Other</span><span className="text-white">16%</span></div>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Quick stats */}
        <AdminCard>
          <AdminCardHeader
            title="This Month"
            icon={DollarSign}
            description="Quick financial snapshot"
          />
          <div className="p-4 pt-2 space-y-2.5">
            {[
              { label: "Gross sales", value: "$48,210", accent: "text-emerald-300" },
              { label: "Less: refunds", value: "−$840", accent: "text-rose-300" },
              { label: "Less: payment fees", value: "−$2,890", accent: "text-rose-300" },
              { label: "Less: commissions", value: "−$4,830", accent: "text-rose-300" },
              { label: "Less: operating", value: "−$13,260", accent: "text-rose-300" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-xs text-white/60">{r.label}</span>
                <span className={`text-sm font-semibold ${r.accent}`}>{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
              <span className="text-xs font-semibold text-emerald-200">Net profit</span>
              <span className="text-sm font-bold text-emerald-300">$26,390</span>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Commissions table */}
      <AdminCard>
        <AdminCardHeader
          title="Affiliate & Vendor Commissions"
          icon={ArrowUpRight}
          description="Outstanding and paid commissions"
          action={
            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyExport("CSV")}>
              <Download className="size-3.5" /> Export
            </Button>
          }
        />
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Recipient</TableHead>
                <TableHead className="text-white/60">Role</TableHead>
                <TableHead className="text-white/60">Rate</TableHead>
                <TableHead className="text-white/60 text-right">Amount</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMMISSIONS.map((c) => (
                <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{c.name}</TableCell>
                  <TableCell className="text-xs">
                    <span className={c.role === "Vendor" ? "text-emerald-300" : "text-cyan-300"}>{c.role}</span>
                  </TableCell>
                  <TableCell className="text-white/70">{c.rate}</TableCell>
                  <TableCell className="text-right font-semibold text-white">{c.amount}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] uppercase font-semibold ${c.status === "paid" ? "text-emerald-300" : "text-amber-300"}`}>
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={c.status === "paid"}
                      onClick={() => notifyExport("payout receipt")}
                      className="text-blue-300 hover:text-blue-200 disabled:opacity-40"
                    >
                      {c.status === "paid" ? "View receipt" : "Pay now"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>
    </div>
  );
}
