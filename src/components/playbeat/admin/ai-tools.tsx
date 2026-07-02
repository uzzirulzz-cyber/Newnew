"use client";

import * as React from "react";
import {
  Sparkles,
  PenTool,
  FileText,
  Search,
  Mail,
  Image as ImageIcon,
  MessageSquare,
  Rocket,
  Plus,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatPill,
  notifyMock,
  notifyComingSoon,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    id: "product-writer",
    name: "AI Product Writer",
    icon: PenTool,
    desc: "Generate compelling product titles, descriptions, and marketing copy from a few bullet points.",
    accent: "from-blue-600 to-blue-500",
    uses: 482,
    category: "Content",
    lastUsed: "2 hours ago",
  },
  {
    id: "blog-generator",
    name: "Blog Post Generator",
    icon: FileText,
    desc: "Long-form SEO-optimized blog posts from a topic, outline, or keyword cluster.",
    accent: "from-purple-600 to-purple-500",
    uses: 312,
    category: "Content",
    lastUsed: "1 day ago",
  },
  {
    id: "seo-generator",
    name: "SEO Meta Generator",
    icon: Search,
    desc: "Bulk-generate meta titles, descriptions, and slug suggestions for any URL.",
    accent: "from-cyan-600 to-cyan-500",
    uses: 920,
    category: "SEO",
    lastUsed: "4 hours ago",
  },
  {
    id: "email-generator",
    name: "Email Campaign Writer",
    icon: Mail,
    desc: "High-converting email sequences, newsletters, and abandoned-cart reminders.",
    accent: "from-pink-600 to-pink-500",
    uses: 248,
    category: "Marketing",
    lastUsed: "3 days ago",
  },
  {
    id: "banner-generator",
    name: "AI Banner Generator",
    icon: ImageIcon,
    desc: "Design promotional banners, hero images, and social graphics with AI.",
    accent: "from-emerald-600 to-emerald-500",
    uses: 184,
    category: "Design",
    lastUsed: "5 hours ago",
  },
  {
    id: "reply-assistant",
    name: "Customer Reply Assistant",
    icon: MessageSquare,
    desc: "Draft professional support replies, refunds, and follow-ups instantly.",
    accent: "from-amber-600 to-amber-500",
    uses: 642,
    category: "Support",
    lastUsed: "20 minutes ago",
  },
];

const RECENT_GENERATIONS = [
  { tool: "AI Product Writer", output: "Netflix Premium 1 Month — 4K UHD", tokens: 482, when: "2h ago" },
  { tool: "SEO Meta Generator", output: "Meta for /chatgpt-plus", tokens: 184, when: "4h ago" },
  { tool: "Customer Reply Assistant", output: "Refund approval — order #PB-1024", tokens: 312, when: "20m ago" },
  { tool: "Email Campaign Writer", output: "Black Friday Mega Sale", tokens: 1840, when: "1d ago" },
];

export function AiToolsModule() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="AI Tools"
        description="AI-powered content generators for your marketplace"
        icon={Sparkles}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Custom AI workflow")}>
            <Plus className="size-4" /> Custom Workflow
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Total Generations" value="2,788" accent="blue" />
        <StatPill label="Tokens Used (30d)" value="1.4M" accent="purple" />
        <StatPill label="Active Tools" value="6" accent="green" />
        <StatPill label="Avg Time" value="2.4s" accent="pink" />
      </div>

      {/* AI tools grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((t) => (
          <AdminCard key={t.id} className="group hover:border-blue-500/30 transition-colors">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className={cn("grid size-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", t.accent)}>
                  <t.icon className="size-5" />
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5 text-white/60 uppercase tracking-wide">
                  {t.category}
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold text-white">{t.name}</div>
                <p className="mt-1 text-xs text-white/60 line-clamp-2">{t.desc}</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-white/40">
                <span>{t.uses} generations</span>
                <span>Last: {t.lastUsed}</span>
              </div>
              <Button
                size="sm"
                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0"
                onClick={() => notifyMock(`Launching ${t.name}…`)}
              >
                <Rocket className="size-3.5" /> Launch Tool
              </Button>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Recent generations */}
      <AdminCard>
        <AdminCardHeader
          title="Recent Generations"
          icon={Sparkles}
          description="Latest AI outputs across all tools"
        />
        <div className="p-0">
          <div className="divide-y divide-white/5">
            {RECENT_GENERATIONS.map((g, i) => (
              <div key={i} className="flex items-center gap-3 p-4 hover:bg-white/5">
                <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-blue-600/40 to-purple-600/40 text-white">
                  <Sparkles className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white line-clamp-1">{g.output}</div>
                  <div className="text-xs text-white/50">{g.tool} · {g.tokens} tokens</div>
                </div>
                <span className="text-xs text-white/40">{g.when}</span>
                <Button size="sm" variant="ghost" className="text-blue-300 hover:text-blue-200" onClick={() => notifyMock("Opening generation…")}>
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>
      </AdminCard>

      {/* Usage stats */}
      <AdminCard>
        <AdminCardHeader title="Usage This Month" icon={Sparkles} description="Token consumption by tool" />
        <div className="p-4 space-y-2.5">
          {TOOLS.map((t) => {
            const pct = Math.round((t.uses / 1000) * 100);
            return (
              <div key={t.id} className="flex items-center gap-3">
                <div className="w-40 text-xs text-white/70 truncate">{t.name}</div>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r", t.accent)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-12 text-right text-xs text-white/60 tabular-nums">{t.uses}</div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
