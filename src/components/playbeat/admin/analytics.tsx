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
  BarChart3,
  Globe,
  Monitor,
  Search,
  Smartphone,
  Tablet,
  TrendingUp,
  Users,
  Zap,
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
import { Download } from "lucide-react";

const VISITORS = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  visitors: 1800 + Math.round(Math.sin(i * 0.5) * 600) + i * 40,
  unique: 1200 + Math.round(Math.sin(i * 0.5) * 400) + i * 28,
}));

const FUNNEL = [
  { stage: "Visitors", value: 48200, pct: "100%" },
  { stage: "Product View", value: 18420, pct: "38.2%" },
  { stage: "Add to Cart", value: 8240, pct: "17.1%" },
  { stage: "Checkout", value: 4180, pct: "8.7%" },
  { stage: "Purchase", value: 2140, pct: "4.4%" },
];

const DEVICES = [
  { name: "Desktop", value: 48, icon: Monitor, color: CHART_COLORS.blue },
  { name: "Mobile", value: 38, icon: Smartphone, color: CHART_COLORS.purple },
  { name: "Tablet", value: 14, icon: Tablet, color: CHART_COLORS.cyan },
];

const BROWSERS = [
  { name: "Chrome", value: 58, color: CHART_COLORS.blue },
  { name: "Safari", value: 22, color: CHART_COLORS.purple },
  { name: "Firefox", value: 8, color: CHART_COLORS.cyan },
  { name: "Edge", value: 9, color: CHART_COLORS.green },
  { name: "Opera", value: 3, color: CHART_COLORS.amber },
];

const TOP_KEYWORDS = [
  { kw: "netflix subscription pakistan", clicks: 1840, conv: 142 },
  { kw: "chatgpt plus buy", clicks: 1240, conv: 88 },
  { kw: "cheap ai tools", clicks: 920, conv: 64 },
  { kw: "playbeat digital", clicks: 820, conv: 312 },
  { kw: "buy spotify premium", clicks: 680, conv: 38 },
  { kw: "iptv subscription", clicks: 540, conv: 28 },
  { kw: "claude pro price", clicks: 420, conv: 22 },
];

const COUNTRIES = [
  { country: "United States", code: "US", visitors: 18420, rev: 18420 },
  { country: "Pakistan", code: "PK", visitors: 12820, rev: 12110 },
  { country: "United Kingdom", code: "GB", visitors: 6840, rev: 8740 },
  { country: "Germany", code: "DE", visitors: 4180, rev: 5630 },
  { country: "Canada", code: "CA", visitors: 3210, rev: 4210 },
  { country: "Australia", code: "AU", visitors: 2840, rev: 3180 },
  { country: "UAE", code: "AE", visitors: 2120, rev: 2940 },
];

export function AnalyticsModule() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Analytics"
        description="Deep-dive into traffic, conversion, and customer behavior"
        icon={BarChart3}
        actions={
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyExport("PDF")}>
            <Download className="size-4" /> Export
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Visitors (30d)" value="48,200" icon={Users} accent="blue" trend={{ value: "8.4%", up: true }} spark={[28, 32, 35, 38, 42, 48]} />
        <KpiCard label="Unique" value="32,140" icon={Monitor} accent="purple" trend={{ value: "5.2%", up: true }} spark={[22, 24, 26, 28, 30, 32]} />
        <KpiCard label="Conversion" value="4.44%" icon={Zap} accent="green" trend={{ value: "0.6%", up: true }} spark={[3.8, 4.0, 4.1, 4.2, 4.4, 4.4]} />
        <KpiCard label="Bounce Rate" value="42.8%" icon={TrendingUp} accent="amber" trend={{ value: "1.2%", up: false }} spark={[44, 43, 43, 42, 43, 42]} />
        <KpiCard label="Avg Session" value="3m 24s" icon={Monitor} accent="cyan" trend={{ value: "0.4%", up: true }} spark={[180, 192, 200, 196, 204, 204]} />
        <KpiCard label="LTV" value="$182.40" icon={Users} accent="pink" trend={{ value: "3.8%", up: true }} spark={[160, 168, 172, 176, 180, 182]} />
      </div>

      {/* Visitors chart */}
      <AdminCard>
        <AdminCardHeader
          title="Visitors — last 30 days"
          icon={Users}
          description="Total (blue) vs unique (purple) visitors"
        />
        <div className="p-4 pt-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={VISITORS} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} interval={4} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white" }}
              />
              <Line type="monotone" dataKey="visitors" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="unique" stroke={CHART_COLORS.purple} strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Conversion funnel */}
        <AdminCard className="lg:col-span-2">
          <AdminCardHeader
            title="Conversion Funnel"
            icon={TrendingUp}
            description="Visitor → purchase journey"
          />
          <div className="p-4 pt-2 space-y-2.5">
            {FUNNEL.map((f, i) => {
              const width = (f.value / FUNNEL[0].value) * 100;
              return (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/80 font-medium">{f.stage}</span>
                    <span className="text-white/60">
                      {f.value.toLocaleString()} <span className="text-white/40">· {f.pct}</span>
                    </span>
                  </div>
                  <div className="h-8 rounded-lg bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center justify-end pr-3 text-[10px] font-semibold text-white"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${CHART_PALETTE[i % CHART_PALETTE.length]}, ${CHART_PALETTE[(i + 1) % CHART_PALETTE.length]})`,
                      }}
                    >
                      {f.pct}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="text-xs text-emerald-200">
                <span className="font-bold">4.44%</span> overall conversion rate · <span className="font-bold">$182.40</span> LTV
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Device breakdown */}
        <AdminCard>
          <AdminCardHeader
            title="Device Breakdown"
            icon={Monitor}
            description="By sessions"
          />
          <div className="p-4 pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={DEVICES} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                  {DEVICES.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white" }}
                  formatter={(v: any) => `${v}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {DEVICES.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-white/70">
                    <d.icon className="size-3.5" style={{ color: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-white">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Browsers + Top countries */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader title="Browsers" icon={Globe} description="By sessions" />
          <div className="p-4 pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={BROWSERS} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white" }}
                  formatter={(v: any) => `${v}%`}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                  {BROWSERS.map((b, i) => (
                    <Cell key={i} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="Top Countries" icon={Globe} description="By visitors" />
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Country</TableHead>
                  <TableHead className="text-white/60 text-right">Visitors</TableHead>
                  <TableHead className="text-white/60 text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COUNTRIES.map((c) => (
                  <TableRow key={c.code} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <span className="flex items-center gap-2.5 text-sm text-white">
                        <span className="grid size-7 place-items-center rounded-md bg-white/10 text-[10px] font-bold text-white/80">
                          {c.code}
                        </span>
                        {c.country}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-white/80">{c.visitors.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-emerald-300">${c.rev.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminCard>
      </div>

      {/* Search keywords */}
      <AdminCard>
        <AdminCardHeader
          title="Top Search Keywords"
          icon={Search}
          description="Organic search queries bringing traffic"
        />
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Keyword</TableHead>
                <TableHead className="text-white/60 text-right">Clicks</TableHead>
                <TableHead className="text-white/60 text-right">Conversions</TableHead>
                <TableHead className="text-white/60 text-right">Conv. Rate</TableHead>
                <TableHead className="text-white/60">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOP_KEYWORDS.map((k) => {
                const cr = ((k.conv / k.clicks) * 100).toFixed(1);
                return (
                  <TableRow key={k.kw} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium text-white">{k.kw}</TableCell>
                    <TableCell className="text-right tabular-nums text-white/80">{k.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-white/80">{k.conv}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-blue-300">{cr}%</TableCell>
                    <TableCell>
                      <span className="text-xs text-emerald-300">▲ trending</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      {/* Customer LTV */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="LTV — Customer" value="$182.40" accent="blue" />
        <StatPill label="LTV — Vendor" value="$2,840" accent="purple" />
        <StatPill label="LTV — Affiliate" value="$840" accent="pink" />
        <StatPill label="Repeat Rate" value="32.4%" accent="green" />
      </div>
    </div>
  );
}
