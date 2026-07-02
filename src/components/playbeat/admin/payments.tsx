"use client";

import * as React from "react";
import {
  CreditCard,
  Check,
  Settings,
  Wallet,
  Bitcoin,
  Building,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatusBadge,
  ToggleRow,
  notifyMock,
  notifyComingSoon,
  StatPill,
} from "./shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Gateway {
  id: string;
  name: string;
  icon: typeof CreditCard;
  desc: string;
  enabled: boolean;
  settlement: string;
  mode: "live" | "sandbox";
  fees: string;
  accent: "blue" | "purple" | "pink" | "cyan" | "green" | "amber";
}

const INITIAL: Gateway[] = [
  {
    id: "lemonsqueezy",
    name: "Lemon Squeezy",
    icon: Wallet,
    desc: "Primary merchant of record for digital products",
    enabled: true,
    settlement: "Daily · USD",
    mode: "live",
    fees: "5% + $0.50",
    accent: "amber",
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: CreditCard,
    desc: "Cards, Apple Pay, Google Pay, ACH",
    enabled: false,
    settlement: "Weekly · USD",
    mode: "sandbox",
    fees: "2.9% + $0.30",
    accent: "blue",
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: Wallet,
    desc: "PayPal balance & credit",
    enabled: false,
    settlement: "Monthly · USD",
    mode: "sandbox",
    fees: "3.49% + $0.49",
    accent: "cyan",
  },
  {
    id: "paddle",
    name: "Paddle",
    icon: Building,
    desc: "Merchant of record for SaaS",
    enabled: false,
    settlement: "Weekly · USD",
    mode: "sandbox",
    fees: "5% + $0.50",
    accent: "pink",
  },
  {
    id: "jazzcash",
    name: "JazzCash",
    icon: Wallet,
    desc: "Pakistan mobile wallet payments",
    enabled: true,
    settlement: "Daily · PKR",
    mode: "live",
    fees: "1.5% + Rs 5",
    accent: "purple",
  },
  {
    id: "easypaisa",
    name: "EasyPaisa",
    icon: Wallet,
    desc: "Pakistan mobile wallet & retail",
    enabled: true,
    settlement: "Daily · PKR",
    mode: "live",
    fees: "1.2% + Rs 3",
    accent: "green",
  },
  {
    id: "crypto",
    name: "Crypto",
    icon: Bitcoin,
    desc: "BTC, ETH, USDT, USDC via Coinbase Commerce",
    enabled: false,
    settlement: "Instant · Multi",
    mode: "sandbox",
    fees: "1.0% flat",
    accent: "amber",
  },
];

const ACCENT_BG: Record<string, string> = {
  blue: "from-blue-600 to-blue-500",
  purple: "from-purple-600 to-purple-500",
  pink: "from-pink-600 to-pink-500",
  cyan: "from-cyan-600 to-cyan-500",
  green: "from-emerald-600 to-emerald-500",
  amber: "from-amber-500 to-yellow-500",
};

export function PaymentsModule() {
  const [gateways, setGateways] = React.useState(INITIAL);

  const toggle = (id: string) => {
    setGateways((prev) =>
      prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)),
    );
    const g = gateways.find((x) => x.id === id);
    notifyMock(`${g?.name} ${g?.enabled ? "disabled" : "enabled"}`);
  };

  const activeCount = gateways.filter((g) => g.enabled).length;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Payment Gateways"
        description="Configure and manage your payment providers"
        icon={CreditCard}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Add custom gateway")}>
            Add Gateway
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Active Gateways" value={activeCount} accent="blue" />
        <StatPill label="Total Volume" value="$48,210" accent="green" />
        <StatPill label="Avg Settlement" value="2.4 days" accent="purple" />
        <StatPill label="Failed Today" value="0.8%" accent="pink" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gateways.map((g) => (
          <AdminCard
            key={g.id}
            className={cn(
              "relative",
              g.enabled && "ring-1 ring-emerald-500/30",
            )}
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("grid size-10 place-items-center rounded-lg bg-gradient-to-br text-white", ACCENT_BG[g.accent])}>
                    <g.icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{g.name}</div>
                    <StatusBadge status={g.enabled ? "active" : "inactive"} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    g.enabled ? "bg-emerald-500" : "bg-white/15",
                  )}
                  aria-pressed={g.enabled}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                      g.enabled && "translate-x-5",
                    )}
                  />
                </button>
              </div>

              <p className="mt-3 text-xs text-white/60 line-clamp-2">{g.desc}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-white/50 uppercase">Fees</div>
                  <div className="text-xs font-medium text-white">{g.fees}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/50 uppercase">Settlement</div>
                  <div className="text-xs font-medium text-white">{g.settlement.split(" · ")[0]}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/50 uppercase">Mode</div>
                  <div className={cn(
                    "text-xs font-semibold",
                    g.mode === "live" ? "text-emerald-300" : "text-amber-300",
                  )}>
                    {g.mode.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => notifyMock(`Configuring ${g.name}`)}
                >
                  <Settings className="size-3.5" /> Configure
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => notifyMock(`Viewing ${g.name} transactions`)}
                >
                  Transactions
                </Button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard>
        <AdminCardHeader
          title="Gateway Settings"
          icon={Settings}
          description="Global payment configuration"
        />
        <div className="p-4 grid gap-3 md:grid-cols-2">
          <ToggleRow
            label="3D Secure"
            description="Require SCA for EU card payments"
            checked={true}
            onChange={() => notifyMock("3D Secure toggled")}
          />
          <ToggleRow
            label="Auto-capture"
            description="Capture funds immediately on authorization"
            checked={true}
            onChange={() => notifyMock("Auto-capture toggled")}
          />
          <ToggleRow
            label="Failed payment retry"
            description="Retry failed payments up to 3 times"
            checked={true}
            onChange={() => notifyMock("Retry toggled")}
          />
          <ToggleRow
            label="Test mode"
            description="Force all gateways into sandbox mode"
            checked={false}
            onChange={() => notifyMock("Test mode toggled")}
          />
        </div>
      </AdminCard>
    </div>
  );
}
