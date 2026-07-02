"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, type LucideIcon } from "lucide-react";

// ===== Color system =====
// The admin panel uses a distinct blue/purple/black palette — not the
// storefront's emerald/gold. Recharts colors follow the spec.
export const CHART_COLORS = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  green: "#10b981",
  amber: "#f59e0b",
} as const;

export const CHART_PALETTE = [
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.cyan,
  CHART_COLORS.green,
  CHART_COLORS.amber,
] as const;

// ===== Mock toast helpers =====
export function notifyComingSoon(feature: string) {
  toast.info(`${feature} — feature coming soon`, {
    description: "This module is wired up with realistic mock data.",
  });
}

export function notifyExport(format: string) {
  toast.success(`Exporting ${format}…`, {
    description: "Your export will download shortly (mock).",
  });
}

export function notifyMock(action: string) {
  toast.success(action, { description: "Mock action performed." });
}

// ===== Layout primitives =====

/** Glassmorphism card — the base container for every admin panel surface. */
export function AdminCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl text-white",
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function AdminCardHeader({
  title,
  icon: Icon,
  action,
  description,
}: {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  description?: string;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="grid size-8 place-items-center rounded-lg bg-blue-500/15 text-blue-400 shrink-0">
            <Icon className="size-4" />
          </div>
        )}
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-white truncate">
            {title}
          </CardTitle>
          {description && (
            <p className="text-xs text-white/50 mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </CardHeader>
  );
}

export function ModuleHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20">
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-white/60 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ===== KPI card =====
export interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  accent?: "blue" | "purple" | "pink" | "cyan" | "green" | "amber";
  spark?: number[];
}

const ACCENT_CLASS: Record<
  NonNullable<KpiCardProps["accent"]>,
  { bg: string; text: string; spark: string }
> = {
  blue: { bg: "bg-blue-500/15", text: "text-blue-400", spark: CHART_COLORS.blue },
  purple: { bg: "bg-purple-500/15", text: "text-purple-400", spark: CHART_COLORS.purple },
  pink: { bg: "bg-pink-500/15", text: "text-pink-400", spark: CHART_COLORS.pink },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-400", spark: CHART_COLORS.cyan },
  green: { bg: "bg-emerald-500/15", text: "text-emerald-400", spark: CHART_COLORS.green },
  amber: { bg: "bg-amber-500/15", text: "text-amber-400", spark: CHART_COLORS.amber },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "blue",
  spark,
}: KpiCardProps) {
  const a = ACCENT_CLASS[accent];
  return (
    <AdminCard className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white tracking-tight truncate">
              {value}
            </p>
          </div>
          <div className={cn("grid size-9 place-items-center rounded-lg shrink-0", a.bg, a.text)}>
            <Icon className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                trend.up ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {trend.up ? "▲" : "▼"} {trend.value}
            </span>
          ) : (
            <span className="text-xs text-white/40">—</span>
          )}
          {spark && spark.length > 1 && (
            <Sparkline data={spark} color={a.spark} />
          )}
        </div>
      </CardContent>
    </AdminCard>
  );
}

export function KpiSkeleton() {
  return (
    <AdminCard>
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-3 w-20 bg-white/10" />
        <Skeleton className="h-7 w-28 bg-white/10" />
        <Skeleton className="h-3 w-16 bg-white/10" />
      </CardContent>
    </AdminCard>
  );
}

// ===== Sparkline (tiny inline chart) =====
export function Sparkline({
  data,
  color = CHART_COLORS.blue,
  width = 64,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const id = React.useId();
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${id})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ===== Status badge (color-coded) =====
const STATUS_STYLES: Record<string, string> = {
  // Generic states
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  operational: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  verified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  processing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  refunded: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  suspended: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  inactive: "bg-white/10 text-white/60 border-white/15",
  draft: "bg-white/10 text-white/60 border-white/15",
  expired: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const key = status.toLowerCase();
  const cls =
    STATUS_STYLES[key] || "bg-white/10 text-white/70 border-white/15";
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] uppercase tracking-wide", cls)}
    >
      {label || status}
    </Badge>
  );
}

// Role badge (admin users)
const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  VENDOR: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  CUSTOMER: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  AFFILIATE: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

export function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_STYLES[role] || "bg-white/10 text-white/60 border-white/15";
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] uppercase tracking-wide", cls)}
    >
      {role}
    </Badge>
  );
}

// ===== Empty state =====
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-white/5 border border-white/10 text-white/40">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-white/50 max-w-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ===== Loading skeletons =====
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full bg-white/10" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AdminCard key={i}>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-3 w-20 bg-white/10" />
            <Skeleton className="h-7 w-28 bg-white/10" />
            <Skeleton className="h-3 w-16 bg-white/10" />
          </CardContent>
        </AdminCard>
      ))}
    </div>
  );
}

// ===== Module transition wrapper =====
export function ModuleTransition({
  children,
  moduleKey,
}: {
  children: React.ReactNode;
  moduleKey: string;
}) {
  return (
    <motion.div
      key={moduleKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}

// ===== Search input (with icon) =====
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <svg
        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:border-blue-500/50"
      />
    </div>
  );
}

// ===== Toggle row (for settings/cards) =====
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && (
          <div className="text-xs text-white/50 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-white/15",
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

// ===== Primary action button (gradient) =====
export function GradientButton({
  children,
  className,
  loading,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button
      className={cn(
        "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-600/20",
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin mr-1.5" />}
      {children}
    </Button>
  );
}

// ===== Simple list stat =====
export function StatPill({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  accent?: keyof typeof ACCENT_CLASS;
}) {
  const a = ACCENT_CLASS[accent];
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-white/50">
        {label}
      </div>
      <div className={cn("mt-0.5 text-lg font-bold", a.text)}>{value}</div>
    </div>
  );
}
