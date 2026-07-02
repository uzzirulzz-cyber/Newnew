"use client";

import * as React from "react";
import {
  RefreshCw,
  Plus,
  Check,
  Crown,
  Zap,
  Infinity as InfinityIcon,
  Pencil,
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

interface Plan {
  id: string;
  name: string;
  icon: typeof Zap;
  price: string;
  period: string;
  features: string[];
  subscribers: number;
  revenue: string;
  active: boolean;
  accent: "blue" | "purple" | "pink" | "cyan";
  popular?: boolean;
}

const INITIAL_PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly Pass",
    icon: Zap,
    price: "$9.99",
    period: "/month",
    features: ["All streaming channels", "1080p HD quality", "2 concurrent streams", "Email support", "Cancel anytime"],
    subscribers: 1280,
    revenue: "$12,787",
    active: true,
    accent: "blue",
  },
  {
    id: "quarterly",
    name: "Quarterly Pro",
    icon: RefreshCw,
    price: "$24.99",
    period: "/3 months",
    features: ["All Monthly features", "4K UHD on select channels", "4 concurrent streams", "Priority support", "Save 17%"],
    subscribers: 642,
    revenue: "$16,043",
    active: true,
    accent: "cyan",
  },
  {
    id: "yearly",
    name: "Yearly Premium",
    icon: Crown,
    price: "$89.99",
    period: "/year",
    features: ["All Quarterly features", "4K HDR everywhere", "6 concurrent streams", "24/7 phone support", "Save 25% + free IPTV box"],
    subscribers: 412,
    revenue: "$37,075",
    active: true,
    accent: "purple",
    popular: true,
  },
  {
    id: "lifetime",
    name: "Lifetime Access",
    icon: InfinityIcon,
    price: "$349",
    period: "one-time",
    features: ["All Yearly features", "Lifetime updates", "Unlimited streams", "Dedicated manager", "Early access to new channels"],
    subscribers: 88,
    revenue: "$30,712",
    active: false,
    accent: "pink",
  },
];

const ACCENT_BORDER: Record<Plan["accent"], string> = {
  blue: "border-blue-500/40",
  purple: "border-purple-500/40",
  pink: "border-pink-500/40",
  cyan: "border-cyan-500/40",
};

const ACCENT_BTN: Record<Plan["accent"], string> = {
  blue: "from-blue-600 to-blue-500",
  purple: "from-purple-600 to-purple-500",
  pink: "from-pink-600 to-pink-500",
  cyan: "from-cyan-600 to-cyan-500",
};

export function SubscriptionsModule() {
  const [plans, setPlans] = React.useState(INITIAL_PLANS);

  const toggle = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
    );
    const plan = plans.find((p) => p.id === id);
    notifyMock(`${plan?.name} ${plan?.active ? "deactivated" : "activated"}`);
  };

  const totalSubs = plans.reduce((s, p) => s + p.subscribers, 0);
  const mrr = plans.reduce((s, p) => {
    if (p.id === "monthly") return s + p.subscribers * 9.99;
    if (p.id === "quarterly") return s + (p.subscribers * 24.99) / 3;
    if (p.id === "yearly") return s + (p.subscribers * 89.99) / 12;
    return s;
  }, 0);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Subscriptions"
        description="Manage recurring plans and lifetime access tiers"
        icon={RefreshCw}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Create subscription plan")}>
            <Plus className="size-4" /> New Plan
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Active Subs" value={totalSubs.toLocaleString()} accent="blue" />
        <StatPill label="MRR" value={`$${Math.round(mrr).toLocaleString()}`} accent="green" />
        <StatPill label="ARR" value={`$${Math.round(mrr * 12).toLocaleString()}`} accent="purple" />
        <StatPill label="Churn Rate" value="2.4%" accent="pink" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <AdminCard
            key={plan.id}
            className={cn(
              "relative overflow-hidden",
              ACCENT_BORDER[plan.accent],
              plan.popular && "ring-2 ring-purple-500/50",
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-[9px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-bl-lg">
                Most Popular
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2.5">
                <div className={cn("grid size-9 place-items-center rounded-lg bg-gradient-to-br text-white", ACCENT_BTN[plan.accent])}>
                  <plan.icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{plan.name}</div>
                  <StatusBadge status={plan.active ? "active" : "inactive"} />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{plan.price}</span>
                <span className="text-xs text-white/50">{plan.period}</span>
              </div>

              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/70">
                    <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-white/50 uppercase">Subscribers</div>
                  <div className="text-sm font-bold text-white">{plan.subscribers.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/50 uppercase">Revenue</div>
                  <div className="text-sm font-bold text-emerald-300">{plan.revenue}</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => notifyMock(`Editing ${plan.name}`)}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    "flex-1 text-white border-0 bg-gradient-to-r",
                    ACCENT_BTN[plan.accent],
                  )}
                  onClick={() => toggle(plan.id)}
                >
                  {plan.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard>
        <AdminCardHeader
          title="Plan Settings"
          icon={RefreshCw}
          description="Global subscription configuration"
        />
        <div className="p-4 grid gap-3 md:grid-cols-2">
          <ToggleRow
            label="Auto-renewal"
            description="Allow subscriptions to auto-renew by default"
            checked={true}
            onChange={() => notifyMock("Auto-renewal toggled")}
          />
          <ToggleRow
            label="Free trial"
            description="Offer 7-day free trial for new subscribers"
            checked={true}
            onChange={() => notifyMock("Free trial toggled")}
          />
          <ToggleRow
            label="Dunning emails"
            description="Send retry emails on failed renewals"
            checked={true}
            onChange={() => notifyMock("Dunning toggled")}
          />
          <ToggleRow
            label="Pause subscriptions"
            description="Allow users to pause (not cancel) subscriptions"
            checked={false}
            onChange={() => notifyMock("Pause feature toggled")}
          />
        </div>
      </AdminCard>
    </div>
  );
}
