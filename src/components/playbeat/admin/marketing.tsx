"use client";

import * as React from "react";
import {
  Megaphone,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  Plus,
  Send,
  Users,
  TrendingUp,
  MousePointer,
  Eye,
  Gift,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatPill,
  ToggleRow,
  notifyMock,
  notifyComingSoon,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { CHART_COLORS, CHART_PALETTE } from "./shared";
import { cn } from "@/lib/utils";

const CAMPAIGNS = [
  { id: "c1", name: "Black Friday Mega Sale", channel: "Email", sent: 12480, opened: 6240, clicked: 1820, status: "completed" },
  { id: "c2", name: "New IPTV Plans Launch", channel: "WhatsApp", sent: 4820, opened: 4180, clicked: 1240, status: "completed" },
  { id: "c3", name: "Holiday Greeting", channel: "SMS", sent: 8420, opened: 0, clicked: 412, status: "completed" },
  { id: "c4", name: "Valentine AI Tools Promo", channel: "Push", sent: 12420, opened: 0, clicked: 820, status: "scheduled" },
  { id: "c5", name: "Weekly Newsletter #42", channel: "Email", sent: 0, opened: 0, clicked: 0, status: "draft" },
];

const CHANNELS = [
  { id: "email", name: "Email", icon: Mail, count: "12,480", color: "from-blue-600 to-blue-500", desc: "Newsletter, promos, transactional" },
  { id: "sms", name: "SMS", icon: MessageSquare, count: "8,420", color: "from-purple-600 to-purple-500", desc: "Bulk SMS via Twilio" },
  { id: "whatsapp", name: "WhatsApp", icon: Smartphone, count: "4,820", color: "from-emerald-600 to-emerald-500", desc: "WhatsApp Business API" },
  { id: "push", name: "Push", icon: Bell, count: "12,420", color: "from-pink-600 to-pink-500", desc: "Web & mobile push" },
];

const CAMPAIGN_CHART = [
  { name: "Email", sent: 12480, opened: 6240 },
  { name: "WhatsApp", sent: 4820, opened: 4180 },
  { name: "SMS", sent: 8420, opened: 0 },
  { name: "Push", sent: 12420, opened: 0 },
];

export function MarketingModule() {
  const [composing, setComposing] = React.useState(false);
  const [channel, setChannel] = React.useState("email");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Marketing"
        description="Campaigns, newsletters, and affiliate program"
        icon={Megaphone}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => setComposing(true)}>
            <Plus className="size-4" /> New Campaign
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Subscribers" value="12,480" accent="blue" />
        <StatPill label="Open Rate" value="48.2%" accent="green" />
        <StatPill label="Click Rate" value="14.8%" accent="purple" />
        <StatPill label="Revenue" value="$8,420" accent="pink" />
      </div>

      {/* Channel cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CHANNELS.map((c) => (
          <AdminCard key={c.id} className="hover:border-blue-500/30 transition-colors">
            <button onClick={() => { setChannel(c.id); setComposing(true); }} className="w-full text-left p-5">
              <div className="flex items-start justify-between">
                <div className={cn("grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", c.color)}>
                  <c.icon className="size-5" />
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5 text-white/60">
                  Active
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="text-2xl font-bold text-white mt-1">{c.count}</div>
                <div className="text-[10px] text-white/50 mt-1">{c.desc}</div>
              </div>
            </button>
          </AdminCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Campaign chart */}
        <AdminCard className="lg:col-span-2">
          <AdminCardHeader title="Campaign Performance" icon={TrendingUp} description="Sent vs opened by channel" />
          <div className="p-4 pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={CAMPAIGN_CHART} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white" }}
                />
                <Bar dataKey="sent" radius={[6, 6, 0, 0]} barSize={24} fill={CHART_COLORS.blue} />
                <Bar dataKey="opened" radius={[6, 6, 0, 0]} barSize={24} fill={CHART_COLORS.purple} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Affiliate program */}
        <AdminCard>
          <AdminCardHeader title="Affiliate Program" icon={Gift} description="Partner referrals" />
          <div className="p-4 pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Active Affiliates" value="148" accent="cyan" />
              <StatPill label="Conversions" value="2,140" accent="green" />
              <StatPill label="Paid Out" value="$18,420" accent="purple" />
              <StatPill label="Pending" value="$4,820" accent="amber" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60 mb-1">Top affiliate this month</div>
              <div className="text-sm font-medium text-white">Sarah K. (sarahk10)</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: "82%" }} />
                </div>
                <span className="text-xs text-emerald-300">$1,840</span>
              </div>
            </div>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Affiliate program setup")}>
              Manage affiliates
            </Button>
          </div>
        </AdminCard>
      </div>

      {/* Campaign table */}
      <AdminCard>
        <AdminCardHeader title="Recent Campaigns" icon={Megaphone} description={`${CAMPAIGNS.length} campaigns`} />
        <div className="p-0">
          <div className="divide-y divide-white/5">
            {CAMPAIGNS.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-white/5">
                <div className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-blue-600/40 to-purple-600/40 text-white">
                  {c.channel === "Email" ? <Mail className="size-4" /> :
                   c.channel === "SMS" ? <MessageSquare className="size-4" /> :
                   c.channel === "WhatsApp" ? <Smartphone className="size-4" /> :
                   <Bell className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white line-clamp-1">{c.name}</div>
                  <div className="text-xs text-white/50">
                    {c.channel} · {c.sent.toLocaleString()} sent
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-white/70">
                    <Eye className="size-3.5" /> {c.opened.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-white/70">
                    <MousePointer className="size-3.5" /> {c.clicked.toLocaleString()}
                  </span>
                </div>
                <Badge variant="outline" className={cn(
                  "text-[10px] uppercase",
                  c.status === "completed" && "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
                  c.status === "scheduled" && "border-amber-500/30 bg-amber-500/15 text-amber-300",
                  c.status === "draft" && "border-white/15 bg-white/10 text-white/60",
                )}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </AdminCard>

      {/* Composer */}
      {composing && (
        <AdminCard>
          <AdminCardHeader
            title="Campaign Composer"
            icon={Send}
            description={`Channel: ${channel.toUpperCase()}`}
            action={
              <Button variant="ghost" size="sm" className="text-white/60" onClick={() => setComposing(false)}>
                Close
              </Button>
            }
          />
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Subject / Title</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. 🎉 Black Friday Mega Sale — 50% off everything!"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Message body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your campaign message…"
                rows={5}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("Campaign scheduled")}>
                <Send className="size-3.5" /> Schedule Campaign
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Test email sent to your address")}>
                Send Test
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("Audience segment picker")}>
                <Users className="size-3.5" /> Choose audience
              </Button>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Marketing settings */}
      <AdminCard>
        <AdminCardHeader title="Marketing Settings" icon={Megaphone} description="Automation & opt-in" />
        <div className="p-4 grid gap-3 md:grid-cols-2">
          <ToggleRow label="Welcome email" description="Send on new signup" checked={true} onChange={() => notifyMock("Welcome email toggled")} />
          <ToggleRow label="Abandoned cart" description="Recover lost sales (1h delay)" checked={true} onChange={() => notifyMock("Abandoned cart toggled")} />
          <ToggleRow label="Post-purchase upsell" description="Suggest related products" checked={true} onChange={() => notifyMock("Upsell toggled")} />
          <ToggleRow label="Win-back campaign" description="Email inactive users after 30d" checked={false} onChange={() => notifyMock("Win-back toggled")} />
        </div>
      </AdminCard>
    </div>
  );
}
