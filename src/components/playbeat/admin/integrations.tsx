"use client";

import * as React from "react";
import {
  Plug,
  BarChart3,
  Database,
  Cloud,
  Github,
  MessageCircle,
  Slack,
  Boxes,
  Settings,
  Plus,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatPill,
  StatusBadge,
  notifyMock,
  notifyComingSoon,
} from "./shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  icon: typeof Plug;
  desc: string;
  category: string;
  connected: boolean;
  accent: "blue" | "purple" | "pink" | "cyan" | "green" | "amber";
  meta?: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "ga4", name: "Google Analytics 4", icon: BarChart3, desc: "Web traffic, conversions, audience insights", category: "Analytics", connected: true, accent: "amber", meta: "Property 489762161" },
  { id: "gtm", name: "Google Tag Manager", icon: Boxes, desc: "Manage analytics & marketing tags without code", category: "Analytics", connected: true, accent: "cyan" },
  { id: "meta", name: "Meta Pixel", icon: BarChart3, desc: "Facebook & Instagram ad attribution", category: "Marketing", connected: true, accent: "blue", meta: "Pixel 489762161686775" },
  { id: "cf", name: "Cloudflare", icon: Cloud, desc: "CDN, WAF, DDoS protection, edge caching", category: "Infrastructure", connected: true, accent: "amber" },
  { id: "firebase", name: "Firebase", icon: Database, desc: "Mobile analytics, push notifications, crash reporting", category: "Mobile", connected: true, accent: "amber" },
  { id: "s3", name: "AWS S3", icon: Database, desc: "Asset storage for media library & downloads", category: "Storage", connected: true, accent: "amber", meta: "Bucket: pb-assets" },
  { id: "github", name: "GitHub", icon: Github, desc: "Code repository, CI/CD, deployments", category: "Developer", connected: true, accent: "purple" },
  { id: "discord", name: "Discord", icon: MessageCircle, desc: "Community server & customer support channel", category: "Community", connected: false, accent: "purple" },
  { id: "telegram", name: "Telegram Bot", icon: MessageCircle, desc: "Order alerts & customer support automation", category: "Communication", connected: true, accent: "cyan", meta: "@playbeatbot" },
  { id: "slack", name: "Slack", icon: Slack, desc: "Internal team notifications & alerts", category: "Communication", connected: false, accent: "purple" },
];

const ACCENT_BG: Record<string, string> = {
  blue: "from-blue-600 to-blue-500",
  purple: "from-purple-600 to-purple-500",
  pink: "from-pink-600 to-pink-500",
  cyan: "from-cyan-600 to-cyan-500",
  green: "from-emerald-600 to-emerald-500",
  amber: "from-amber-500 to-yellow-500",
};

export function IntegrationsModule() {
  const [integrations, setIntegrations] = React.useState(INTEGRATIONS);

  const toggle = (id: string) => {
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)));
    const int = integrations.find((i) => i.id === id);
    notifyMock(`${int?.name} ${int?.connected ? "disconnected" : "connected"}`);
  };

  const connectedCount = integrations.filter((i) => i.connected).length;
  const categories = Array.from(new Set(integrations.map((i) => i.category)));

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Integrations"
        description="Connect third-party services to extend your marketplace"
        icon={Plug}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Integration marketplace")}>
            <Plus className="size-4" /> Browse Marketplace
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Connected" value={connectedCount} accent="green" />
        <StatPill label="Available" value={integrations.length} accent="blue" />
        <StatPill label="Categories" value={categories.length} accent="purple" />
        <StatPill label="Webhooks Active" value="3" accent="pink" />
      </div>

      {/* Grouped by category */}
      {categories.map((cat) => (
        <div key={cat} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {cat}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {integrations.filter((i) => i.category === cat).map((int) => (
              <AdminCard
                key={int.id}
                className={cn(int.connected && "ring-1 ring-emerald-500/30")}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg shrink-0",
                        ACCENT_BG[int.accent],
                      )}>
                        <int.icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white line-clamp-1">{int.name}</div>
                        <StatusBadge status={int.connected ? "active" : "inactive"} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-white/60 line-clamp-2">{int.desc}</p>
                  {int.meta && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                      <span className="text-white/50">ID: </span>
                      <span className="text-white font-mono">{int.meta}</span>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    {int.connected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => notifyMock(`Configuring ${int.name}`)}
                        >
                          <Settings className="size-3.5" /> Configure
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                          onClick={() => toggle(int.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0"
                        onClick={() => toggle(int.id)}
                      >
                        <Plus className="size-3.5" /> Connect
                      </Button>
                    )}
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
