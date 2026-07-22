"use client";

import * as React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Mail,
  Users,
  BarChart3,
  Plus,
  Share2,
  Facebook,
  Instagram,
  Music2,
  Twitter,
  Youtube,
  ExternalLink,
  RotateCcw,
  Pencil,
  Trash2,
  Pause,
  Play,
  Loader2,
  Send,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// ---------------- Types ----------------

interface Campaign {
  id: string;
  name: string;
  type: string; // email | push | social | sms
  status: string; // draft | active | paused | completed
  sentCount: number;
  openRate: number;
  clickCount: number;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

type CampaignType = "email" | "push" | "social" | "sms";
type CampaignStatus = "draft" | "active" | "paused" | "completed";

// ---------------- Status helpers ----------------

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  paused: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  completed: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300",
};

const typeIcons: Record<string, React.ReactNode> = {
  email: <Mail size={12} />,
  push: <Send size={12} />,
  social: <Share2 size={12} />,
  sms: <Megaphone size={12} />,
};

const TYPE_OPTIONS: { value: CampaignType; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "social", label: "Social" },
  { value: "sms", label: "SMS" },
];

// ---------------- Main component ----------------

export function AdminMarketing() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Campaign | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: () => api.adminCampaigns(),
    staleTime: 30_000,
  });

  const campaigns: Campaign[] = data?.items ?? [];

  // ---- Mutations ----
  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      type: CampaignType;
      content?: string;
    }) => api.adminCampaignCreate(payload),
    onSuccess: () => {
      toast.success("Campaign created");
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(`Create failed: ${e.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.adminCampaignUpdate(id, patch),
    onSuccess: () => {
      toast.success("Campaign updated");
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(`Update failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminCampaignDelete(id),
    onSuccess: () => {
      toast.success("Campaign deleted");
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
    onError: (e: Error) => toast.error(`Delete failed: ${e.message}`),
  });

  // ---- Stats ----
  const total = campaigns.length;
  const active = campaigns.filter((c) => c.status === "active").length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
  const avgOpenRate =
    campaigns.length === 0
      ? 0
      : campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) /
        campaigns.length;

  // ---- Handlers ----
  const handleToggleStatus = (c: Campaign) => {
    const next: CampaignStatus =
      c.status === "active" ? "paused" : c.status === "paused" ? "active" : c.status === "draft" ? "active" : "active";
    updateMutation.mutate({ id: c.id, patch: { status: next } });
  };

  const handleDelete = (c: Campaign) => {
    if (!confirm(`Delete campaign "${c.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(c.id);
  };

  const handleEdit = (c: Campaign) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Campaigns, emails, and audience management
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={16} />
          New Campaign
        </Button>
      </div>

      {/* Real stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Campaigns"
          value={String(total)}
          icon={<Megaphone size={18} className="text-blue-500" />}
          bg="bg-blue-50 dark:bg-blue-950"
        />
        <StatCard
          label="Active"
          value={String(active)}
          icon={<Send size={18} className="text-green-500" />}
          bg="bg-green-50 dark:bg-green-950"
        />
        <StatCard
          label="Total Sent"
          value={totalSent.toLocaleString()}
          icon={<Mail size={18} className="text-purple-500" />}
          bg="bg-purple-50 dark:bg-purple-950"
        />
        <StatCard
          label="Avg Open Rate"
          value={`${avgOpenRate.toFixed(1)}%`}
          icon={<BarChart3 size={18} className="text-orange-500" />}
          bg="bg-orange-50 dark:bg-orange-950"
        />
      </div>

      {/* Campaigns table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 mr-2 animate-spin" /> Loading campaigns…
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-border rounded-lg">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Megaphone className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-base mb-1">No campaigns yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first marketing campaign to start tracking sends, opens, and clicks.
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus size={14} /> New Campaign
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium text-muted-foreground">
                      Campaign
                    </th>
                    <th className="text-left pb-2 font-medium text-muted-foreground hidden sm:table-cell">
                      Type
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground hidden md:table-cell">
                      Sent
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground hidden lg:table-cell">
                      Open Rate
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground hidden lg:table-cell">
                      Clicks
                    </th>
                    <th className="text-center pb-2 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        <div className="flex flex-col">
                          <span>{c.name}</span>
                          {c.content && (
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                              {c.content}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-muted-foreground capitalize">
                          {typeIcons[c.type]}
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 text-right hidden md:table-cell">
                        {c.sentCount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right hidden lg:table-cell">
                        {c.openRate.toFixed(1)}%
                      </td>
                      <td className="py-3 text-right hidden lg:table-cell">
                        {c.clickCount.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[c.status] ?? ""}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleStatus(c)}
                            disabled={updateMutation.isPending}
                            title={c.status === "active" ? "Pause" : "Activate"}
                          >
                            {c.status === "active" ? (
                              <Pause size={13} />
                            ) : (
                              <Play size={13} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(c)}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(c)}
                            disabled={deleteMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affiliate Stats section (real api.affiliates()) */}
      <AffiliateStatsSection />

      {/* Social Media Marketing section */}
      <SocialMediaMarketing />

      {/* Create / Edit dialog */}
      <CampaignDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => {
          if (editing) {
            updateMutation.mutate({
              id: editing.id,
              patch: values,
            });
          } else {
            createMutation.mutate(values);
          }
        }}
      />

      {/* Reset button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 gap-2"
          onClick={async () => {
            if (
              !confirm(
                `Reset marketing data? This deletes ALL ${campaigns.length} campaign(s).`,
              )
            )
              return;
            try {
              await Promise.all(
                campaigns.map((c) => api.adminCampaignDelete(c.id)),
              );
              toast.success("All campaigns deleted");
              qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
            } catch {
              toast.error("Reset failed");
            }
          }}
        >
          <RotateCcw className="size-3.5" />
          Reset Marketing
        </Button>
      </div>
    </div>
  );
}

// ---------------- Sub-components ----------------

function StatCard({
  label,
  value,
  icon,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${bg}`}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignDialog({
  open,
  onOpenChange,
  editing,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Campaign | null;
  saving: boolean;
  onSubmit: (values: {
    name: string;
    type: CampaignType;
    content: string;
  }) => void;
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<CampaignType>("email");
  const [content, setContent] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setType((editing?.type as CampaignType) ?? "email");
      setContent(editing?.content ?? "");
    }
  }, [open, editing]);

  const valid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Campaign" : "Create Campaign"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name" className="text-xs">
              Campaign Name
            </Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Sale 2026"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    type === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {typeIcons[opt.value]}
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-content" className="text-xs">
              Content
            </Label>
            <Textarea
              id="campaign-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Write your campaign message here…"
            />
            <p className="text-[10px] text-muted-foreground">
              {content.length} characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!valid || saving}
            onClick={() =>
              onSubmit({ name: name.trim(), type, content })
            }
          >
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Plus className="size-4 mr-2" />
            )}
            {editing ? "Save Changes" : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AffiliateStatsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-stats-marketing"],
    queryFn: () => api.affiliates(),
    staleTime: 60_000,
  });

  const stats = data?.stats;
  const affiliate = data?.affiliate;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4" />
          Affiliate Program
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 mr-2 animate-spin" /> Loading affiliate stats…
          </div>
        ) : !affiliate ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No affiliate program configured.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat
                label="Referral Code"
                value={affiliate.code}
                icon={<Users size={14} />}
              />
              <MiniStat
                label="Total Clicks"
                value={String(stats?.totalClicks ?? 0)}
                icon={<MousePointerClick size={14} />}
              />
              <MiniStat
                label="Conversions"
                value={String(stats?.totalConversions ?? 0)}
                icon={<TrendingUp size={14} />}
              />
              <MiniStat
                label="Conversion Rate"
                value={`${(stats?.conversionRate ?? 0).toFixed(2)}%`}
                icon={<BarChart3 size={14} />}
              />
              <MiniStat
                label="Total Earnings"
                value={`$${(stats?.totalEarnings ?? 0).toFixed(2)}`}
                icon={<TrendingUp size={14} />}
              />
              <MiniStat
                label="Balance"
                value={`$${(stats?.balance ?? 0).toFixed(2)}`}
                icon={<BarChart3 size={14} />}
              />
              <MiniStat
                label="Pending Payout"
                value={`$${(stats?.pendingPayout ?? 0).toFixed(2)}`}
                icon={<Mail size={14} />}
              />
              <MiniStat
                label="Commission Rate"
                value={`${affiliate.commissionRate ?? 0}%`}
                icon={<Users size={14} />}
              />
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
              <p className="text-muted-foreground">
                Referral Link:{" "}
                <a
                  href={affiliate.referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-mono"
                >
                  {affiliate.referralLink}
                </a>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <p className="font-bold text-base mt-1 truncate">{value}</p>
    </div>
  );
}

// Social Media Marketing section — shows connected accounts + post composer
function SocialMediaMarketing() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["social-accounts-marketing"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/social-media");
      const d = await res.json();
      return d.data?.accounts || [];
    },
  });

  const accounts: any[] = data || [];
  const connected = accounts.filter((a) => a.connected);
  const [postText, setPostText] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const platformIcons: Record<string, any> = {
    facebook: Facebook,
    instagram: Instagram,
    tiktok: Music2,
    twitter: Twitter,
    youtube: Youtube,
  };

  const handleSavePost = async () => {
    if (!postText.trim()) {
      toast.error("Write something to post");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/social-media/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postText,
          platforms: ["facebook", "instagram", "tiktok"],
          status: "draft",
        }),
      });
      if (!res.ok) throw new Error("Failed to save post");
      toast.success("Post saved as draft — publish from Social Media module");
      setPostText("");
      qc.invalidateQueries({ queryKey: ["social-accounts-marketing"] });
    } catch {
      toast.error("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="size-4" />
          Social Media Marketing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected platforms */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Connected Platforms ({connected.length})
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Loading…
            </div>
          ) : connected.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No social media accounts connected.{" "}
              <a
                href="/wp-admin"
                className="text-primary hover:underline"
              >
                Connect in Social Media module →
              </a>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => {
                const Icon = platformIcons[a.platform] || Share2;
                return (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      a.connected
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-border bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {a.name}
                    {a.connected && (
                      <Badge variant="secondary" className="text-[9px]">
                        Live
                      </Badge>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick post composer */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-medium mb-2">Quick Post to Social Media</p>
          <textarea
            className="w-full rounded-md border border-border/60 bg-background/60 p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            rows={2}
            placeholder="What's new? Share a product, promotion, or update..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-2">
              {["facebook", "instagram", "tiktok", "twitter", "youtube"].map(
                (p) => {
                  const Icon = platformIcons[p] || Share2;
                  const isActive = accounts.some(
                    (a) => a.platform === p && a.connected,
                  );
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`grid size-8 place-items-center rounded-lg border transition-colors ${
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground opacity-50"
                      }`}
                      title={
                        isActive ? `${p} (connected)` : `${p} (not connected)`
                      }
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                },
              )}
            </div>
            <Button
              size="sm"
              className="gap-2"
              disabled={saving || !postText.trim()}
              onClick={handleSavePost}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Save Post
            </Button>
          </div>
        </div>

        {/* Go to Social Media module */}
        <a
          href="/wp-admin"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="size-3" />
          Manage all social media accounts →
        </a>
      </CardContent>
    </Card>
  );
}
