"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Megaphone,
  Mail,
  Send,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Eye,
  MousePointerClick,
  CheckCircle2,
  Settings,
  Smartphone,
  MessageCircle,
  Bell,
  Gift,
  Star,
  Clock,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  channel: "email" | "sms" | "whatsapp" | "push";
  status: "draft" | "scheduled" | "sent" | "active";
  sent: number;
  opened: number;
  clicked: number;
  revenue: number;
  date: string;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    name: "Summer Streaming Sale",
    channel: "email",
    status: "sent",
    sent: 8420,
    opened: 4180,
    clicked: 980,
    revenue: 3240,
    date: "2026-06-28",
  },
  {
    id: "c2",
    name: "Netflix + Prime Combo Push",
    channel: "push",
    status: "sent",
    sent: 5210,
    opened: 2640,
    clicked: 612,
    revenue: 2180,
    date: "2026-06-25",
  },
  {
    id: "c3",
    name: "WhatsApp — ChatGPT Plus Restock",
    channel: "whatsapp",
    status: "sent",
    sent: 3200,
    opened: 2890,
    clicked: 845,
    revenue: 1860,
    date: "2026-06-22",
  },
  {
    id: "c4",
    name: "July Newsletter",
    channel: "email",
    status: "scheduled",
    sent: 0,
    opened: 0,
    clicked: 0,
    revenue: 0,
    date: "2026-07-05",
  },
  {
    id: "c5",
    name: "SMS — Flash Sale 24h",
    channel: "sms",
    status: "draft",
    sent: 0,
    opened: 0,
    clicked: 0,
    revenue: 0,
    date: "—",
  },
];

const CHANNEL_META: Record<
  string,
  { icon: typeof Mail; color: string; label: string }
> = {
  email: { icon: Mail, color: "bg-blue-500/15 text-blue-400", label: "Email" },
  sms: { icon: Smartphone, color: "bg-purple-500/15 text-purple-400", label: "SMS" },
  whatsapp: { icon: MessageCircle, color: "bg-green-500/15 text-green-400", label: "WhatsApp" },
  push: { icon: Bell, color: "bg-amber-500/15 text-amber-400", label: "Push" },
};

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-green-500/15 text-green-400",
  scheduled: "bg-blue-500/15 text-blue-400",
  draft: "bg-gray-500/15 text-gray-400",
  active: "bg-amber-500/15 text-amber-400",
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-xs backdrop-blur-xl">
      <p className="mb-1 font-medium text-white">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function AdminMarketing() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newCampaign, setNewCampaign] = React.useState({
    name: "",
    channel: "email" as Campaign["channel"],
    subject: "",
    body: "",
  });
  const [automations, setAutomations] = React.useState({
    welcome: true,
    abandonedCart: true,
    postPurchase: false,
    winback: true,
  });

  // Fetch real affiliate data
  const { data: affData } = useQuery({
    queryKey: ["marketing-affiliates"],
    queryFn: () => api.affiliates(),
    staleTime: 60_000,
  });

  const affiliate = affData?.affiliate;
  const affStats = affData?.stats;

  // Campaign stats
  const totalSent = campaigns
    .filter((c) => c.status === "sent")
    .reduce((s, c) => s + c.sent, 0);
  const totalOpened = campaigns
    .filter((c) => c.status === "sent")
    .reduce((s, c) => s + c.opened, 0);
  const totalClicked = campaigns
    .filter((c) => c.status === "sent")
    .reduce((s, c) => s + c.clicked, 0);
  const totalRevenue = campaigns
    .filter((c) => c.status === "sent")
    .reduce((s, c) => s + c.revenue, 0);
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";

  const channelData = ["email", "sms", "whatsapp", "push"].map((ch, i) => {
    const chCampaigns = campaigns.filter((c) => c.channel === ch && c.status === "sent");
    return {
      channel: CHANNEL_META[ch].label,
      sent: chCampaigns.reduce((s, c) => s + c.sent, 0),
      opened: chCampaigns.reduce((s, c) => s + c.opened, 0),
      color: CHART_COLORS[i],
    };
  });

  const handleCreateCampaign = () => {
    if (!newCampaign.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    const campaign: Campaign = {
      id: `c${Date.now()}`,
      name: newCampaign.name,
      channel: newCampaign.channel,
      status: "draft",
      sent: 0,
      opened: 0,
      clicked: 0,
      revenue: 0,
      date: "—",
    };
    setCampaigns([campaign, ...campaigns]);
    setNewCampaign({ name: "", channel: "email", subject: "", body: "" });
    setCreateOpen(false);
    toast.success(`Campaign "${campaign.name}" created as draft`);
  };

  const handleSendCampaign = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "sent",
              sent: Math.floor(Math.random() * 5000) + 2000,
              opened: 0,
              clicked: 0,
              revenue: 0,
              date: new Date().toISOString().slice(0, 10),
            }
          : c,
      ),
    );
    const camp = campaigns.find((c) => c.id === id);
    toast.success(`Campaign "${camp?.name}" sent to subscribers`);
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success("Campaign deleted");
  };

  const topProducts = affData?.topProducts || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 shadow-lg">
          <Megaphone className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Campaigns, newsletters, and affiliate program
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Subscribers", value: "12,480", icon: Users, color: "text-blue-400" },
          { label: "Open Rate", value: `${openRate}%`, icon: Eye, color: "text-green-400" },
          { label: "Click Rate", value: `${clickRate}%`, icon: MousePointerClick, color: "text-purple-400" },
          { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label} className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <s.icon className="size-3.5" /> {s.label}
              </div>
              <p className={cn("mt-1 text-2xl font-bold", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Performance Chart */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" /> Campaign Performance
          </CardTitle>
          <p className="text-sm text-muted-foreground">Sent vs opened by channel</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="channel" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="sent" radius={[4, 4, 0, 0]} name="Sent">
                {channelData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
              <Bar dataKey="opened" radius={[4, 4, 0, 0]} name="Opened" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Affiliate Program */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4" /> Affiliate Program
          </CardTitle>
          <p className="text-sm text-muted-foreground">Partner referrals</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Affiliate stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {affStats
              ? [
                  { label: "Conversions", value: affStats.totalConversions.toLocaleString(), icon: CheckCircle2, color: "text-green-400" },
                  { label: "Total Earnings", value: `$${affStats.totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-amber-400" },
                  { label: "Pending", value: `$${affStats.pendingPayout.toLocaleString()}`, icon: Clock, color: "text-blue-400" },
                  { label: "Conversion Rate", value: `${affStats.conversionRate}%`, icon: TrendingUp, color: "text-purple-400" },
                ]
              : [
                  { label: "Active Affiliates", value: "148", icon: Users, color: "text-blue-400" },
                  { label: "Conversions", value: "2,140", icon: CheckCircle2, color: "text-green-400" },
                  { label: "Paid Out", value: "$18,420", icon: DollarSign, color: "text-amber-400" },
                  { label: "Pending", value: "$4,820", icon: Clock, color: "text-blue-400" },
                ].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/5 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <s.icon className="size-3" /> {s.label}
              </div>
              <p className={cn("mt-1 text-lg font-bold", s.color)}>{s.value}</p>
            </div>
          ))}
          </div>

          {/* Referral link */}
          {affiliate && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">Your Referral Link</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-black/40 px-2 py-1 text-xs text-blue-400">
                  {affiliate.referralLink}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10"
                  onClick={() => {
                    navigator.clipboard?.writeText(affiliate.referralLink);
                    toast.success("Referral link copied");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Commission rate: {affiliate.commissionRate}% · Code: {affiliate.code}
              </p>
            </div>
          )}

          {/* Top affiliate products */}
          {topProducts.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Top converting products
              </p>
              <div className="space-y-2">
                {topProducts.slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-white/5 p-2"
                  >
                    <div className="grid size-8 place-items-center rounded-lg bg-amber-500/15">
                      <Star className="size-4 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.conversions} conversions
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-400">
                      ${p.earnings.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full border-white/10 bg-white/5"
            onClick={() => toast.message("Affiliate management — full dashboard coming soon")}
          >
            Manage affiliates
          </Button>
        </CardContent>
      </Card>

      {/* Recent Campaigns */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base">Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Sent</th>
                  <th className="p-4">Opened</th>
                  <th className="p-4">Clicked</th>
                  <th className="p-4">Revenue</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No campaigns yet — click "New Campaign" to create one
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => {
                    const ch = CHANNEL_META[c.channel];
                    const ChIcon = ch.icon;
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="p-4">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.date}</p>
                        </td>
                        <td className="p-4">
                          <Badge className={ch.color}>
                            <ChIcon className="mr-1 size-3" />
                            {ch.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {c.sent.toLocaleString()}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {c.opened.toLocaleString()}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {c.clicked.toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-green-400">
                          {c.revenue > 0 ? `$${c.revenue.toLocaleString()}` : "—"}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-1">
                            {c.status === "draft" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-green-400"
                                onClick={() => handleSendCampaign(c.id)}
                              >
                                <Send className="size-3" /> Send
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              onClick={() => toast.message(`Editing ${c.name}`)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-red-400"
                              onClick={() => handleDeleteCampaign(c.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Settings */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" /> Marketing Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">Automation & opt-in</p>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { key: "welcome" as const, title: "Welcome email", desc: "Send on new signup" },
            { key: "abandonedCart" as const, title: "Abandoned cart", desc: "Recover lost sales (1h delay)" },
            { key: "postPurchase" as const, title: "Post-purchase upsell", desc: "Suggest related products" },
            { key: "winback" as const, title: "Win-back campaign", desc: "Email inactive users after 30d" },
          ].map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-white/5"
            >
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <Switch
                checked={automations[s.key]}
                onCheckedChange={(v) => {
                  setAutomations((prev) => ({ ...prev, [s.key]: v }));
                  toast.success(`${s.title} ${v ? "enabled" : "disabled"}`);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-white/10 bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4" /> New Campaign
            </DialogTitle>
            <DialogDescription>
              Create a new marketing campaign across email, SMS, WhatsApp, or push.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Campaign Name</Label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="e.g. Summer Streaming Sale"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Channel</Label>
              <Select
                value={newCampaign.channel}
                onValueChange={(v) => setNewCampaign({ ...newCampaign, channel: v as Campaign["channel"] })}
              >
                <SelectTrigger className="border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="sms">📱 SMS</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="push">🔔 Push Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject / Title</Label>
              <Input
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                placeholder="e.g. 40% off all streaming subscriptions!"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message Body</Label>
              <Textarea
                value={newCampaign.body}
                onChange={(e) => setNewCampaign({ ...newCampaign, body: e.target.value })}
                placeholder="Write your campaign message..."
                className="min-h-[100px] border-white/10 bg-white/5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
