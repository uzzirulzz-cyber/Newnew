"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Tv2,
  Search,
  Plus,
  Trash2,
  Users,
  Activity,
  Eye,
  EyeOff,
  Copy,
  ClipboardList,
  CheckCircle2,
  Ban,
  Globe,
  Loader2,
  Upload,
  Filter,
  X,
  Radio,
  Clock,
  AlertTriangle,
  UserX,
  Power,
  Link2,
  KeyRound,
  Pencil,
  Save,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const IPTV_PORTAL_BASE =
  typeof window !== "undefined"
    ? `${window.location.origin}/portal/iptv`
    : "https://portal.playbeat.tv/iptv";

const channelStatusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  error: "bg-red-100 text-red-600",
};

const subStatusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-600",
  suspended: "bg-orange-100 text-orange-700",
};

/**
 * Returns an expiry-state descriptor used to colour-code the countdown:
 *   - "expired"  → red
 *   - "soon"     → yellow  (≤ 7 days)
 *   - "active"   → green
 *   - "unknown"  → gray
 */
function getExpiryState(expiresAt: string | undefined | null): {
  state: "expired" | "soon" | "active" | "unknown";
  daysLeft: number;
  label: string;
} {
  if (!expiresAt) return { state: "unknown", daysLeft: 0, label: "—" };
  const d = new Date(expiresAt);
  if (isNaN(d.getTime())) return { state: "unknown", daysLeft: 0, label: "—" };
  const now = new Date();
  // Reset to date-only to get clean day-count.
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfExpiry = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysLeft = Math.floor((startOfExpiry - startOfToday) / dayMs);
  if (daysLeft < 0) return { state: "expired", daysLeft, label: `Expired ${Math.abs(daysLeft)}d ago` };
  if (daysLeft === 0) return { state: "soon", daysLeft, label: "Expires today" };
  if (daysLeft <= 7) return { state: "soon", daysLeft, label: `${daysLeft}d left` };
  return { state: "active", daysLeft, label: `${daysLeft}d left` };
}

const expiryColorClasses: Record<string, string> = {
  expired: "text-red-600 bg-red-50 border-red-200",
  soon: "text-yellow-700 bg-yellow-50 border-yellow-200",
  active: "text-green-700 bg-green-50 border-green-200",
  unknown: "text-gray-500 bg-gray-50 border-gray-200",
};

/** Detect HD/SD quality from a channel name + isHD flag. */
function detectQuality(c: any): "HD" | "SD" | "4K" | null {
  const name = (c?.name || "").toUpperCase();
  if (c?.isHD || /\bHD\b/.test(name) || /1080|720/.test(name)) return "HD";
  if (/4K|2160|UHD/.test(name)) return "4K";
  if (/\bSD\b/.test(name) || /480|360/.test(name)) return "SD";
  return null;
}

function qualityBadgeClass(q: string | null): string {
  switch (q) {
    case "HD":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "SD":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "4K":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-400 border-gray-200";
  }
}

async function copyToClipboard(text: string, label = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Failed to copy");
  }
}

/**
 * Parses an M3U playlist into a list of channel descriptors.
 *
 * Each entry looks like:
 *   #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="Sports",Channel Name
 *   http://stream.url/path.m3u8
 *
 * Returns: Array<{ name, streamUrl, logoUrl, category, isHD }>
 */
function parseM3U(content: string) {
  const lines = content.split(/\r?\n/);
  const out: Array<{
    name: string;
    streamUrl: string;
    logoUrl: string;
    category: string;
    isHD: boolean;
  }> = [];

  let current: Partial<{
    name: string;
    streamUrl: string;
    logoUrl: string;
    category: string;
    isHD: boolean;
  }> | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#EXTM3U")) continue;
    if (line.startsWith("#EXTINF")) {
      // Attributes portion is between the colon and the last comma.
      const commaIdx = line.lastIndexOf(",");
      const name = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : "Untitled";
      const attrPart = commaIdx >= 0 ? line.slice(0, commaIdx) : line;

      const tvgLogo = /tvg-logo="([^"]*)"/i.exec(attrPart)?.[1] ?? "";
      const groupTitle = /group-title="([^"]*)"/i.exec(attrPart)?.[1] ?? "";
      const upperName = name.toUpperCase();

      current = {
        name,
        logoUrl: tvgLogo || "",
        category: groupTitle || "Uncategorized",
        isHD: /\bHD\b|1080|720/.test(upperName),
        streamUrl: "",
      };
    } else if (!line.startsWith("#")) {
      // URL line — flush the current entry.
      if (current) {
        current.streamUrl = line;
        if (current.streamUrl && current.name) {
          out.push(current as {
            name: string;
            streamUrl: string;
            logoUrl: string;
            category: string;
            isHD: boolean;
          });
        }
        current = null;
      } else if (line) {
        // URL with no preceding EXTINF — still capture as an unnamed channel.
        out.push({
          name: `Channel ${out.length + 1}`,
          streamUrl: line,
          logoUrl: "",
          category: "Uncategorized",
          isHD: false,
        });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IptvModule() {
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<"channels" | "subscribers">("channels");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [showM3u, setShowM3u] = React.useState(false);
  const [showXtream, setShowXtream] = React.useState(false);
  const [xtreamForm, setXtreamForm] = React.useState({
    profileName: "",
    hostUrl: "",
    username: "",
    password: "",
  });
  const [xtreamImporting, setXtreamImporting] = React.useState(false);
  const [selectedSub, setSelectedSub] = React.useState<any | null>(null);

  // Per-row loading flags for quick actions / toggles.
  const [channelTogglingId, setChannelTogglingId] = React.useState<string | null>(null);
  const [subActionId, setSubActionId] = React.useState<string | null>(null);

  const [channelForm, setChannelForm] = React.useState({
    name: "",
    category: "",
    streamUrl: "",
    logoUrl: "",
    language: "",
    country: "",
    isHD: false,
    status: "active" as string,
  });
  const [subForm, setSubForm] = React.useState({
    name: "",
    email: "",
    mac: "",
    deviceType: "",
    plan: "Basic",
    expiresAt: "",
    maxConnections: "",
  });

  // M3U import state
  const [m3uText, setM3uText] = React.useState("");
  const [m3uParsed, setM3uParsed] = React.useState<
    Array<{ name: string; streamUrl: string; logoUrl: string; category: string; isHD: boolean }>
  >([]);
  const [m3uImporting, setM3uImporting] = React.useState(false);

  // --- Queries -------------------------------------------------------------
  const { data: stats } = useQuery({
    queryKey: ["admin-iptv-stats"],
    queryFn: () => api.adminIptvStats(),
    staleTime: 30_000,
  });

  // Channels: load all (no status filter) so we can compute category pills
  // client-side, then apply both status + category filters in the UI.
  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ["admin-iptv-channels", search],
    queryFn: () =>
      api.adminIptvChannels({
        search: search || undefined,
      }),
    staleTime: 30_000,
  });
  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ["admin-iptv-subscribers", search, status],
    queryFn: () =>
      api.adminIptvSubscribers({
        search: search || undefined,
        status: status === "all" ? undefined : status,
      }),
    staleTime: 30_000,
  });

  const allChannels = channelsData?.items || [];
  const subscribers = subsData?.items || [];

  // Derive category counts for the filter pills.
  const categories = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const c of allChannels) {
      const key = c.category?.trim() || "Uncategorized";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allChannels]);

  // Apply local status + category filters on top of search-driven channels.
  const filteredChannels = React.useMemo(() => {
    return allChannels.filter((c: any) => {
      if (status !== "all" && c.status !== status) return false;
      if (categoryFilter !== "all") {
        const cat = c.category?.trim() || "Uncategorized";
        if (cat !== categoryFilter) return false;
      }
      return true;
    });
  }, [allChannels, status, categoryFilter]);

  // --- Mutations -----------------------------------------------------------
  const handleCreateChannel = async () => {
    if (!channelForm.name || !channelForm.streamUrl) {
      toast.error("Name and stream URL required");
      return;
    }
    try {
      await api.adminIptvChannelCreate(channelForm);
      toast.success("Channel created");
      setShowCreate(false);
      setChannelForm({
        name: "",
        category: "",
        streamUrl: "",
        logoUrl: "",
        language: "",
        country: "",
        isHD: false,
        status: "active",
      });
      qc.invalidateQueries({ queryKey: ["admin-iptv-channels"] });
      qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
    } catch {
      toast.error("Failed to create channel");
    }
  };

  const handleCreateSubscriber = async () => {
    if (!subForm.name || !subForm.email || !subForm.expiresAt) {
      toast.error("Fill required fields");
      return;
    }
    try {
      await api.adminIptvSubscriberCreate({
        ...subForm,
        maxConnections: subForm.maxConnections
          ? Number(subForm.maxConnections)
          : undefined,
      });
      toast.success("Subscriber added");
      setShowCreate(false);
      setSubForm({
        name: "",
        email: "",
        mac: "",
        deviceType: "",
        plan: "Basic",
        expiresAt: "",
        maxConnections: "",
      });
      qc.invalidateQueries({ queryKey: ["admin-iptv-subscribers"] });
      qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
    } catch {
      toast.error("Failed to add subscriber");
    }
  };

  const handleToggleChannel = async (c: any) => {
    const id = c._id ?? c.id;
    setChannelTogglingId(id);
    try {
      await api.adminIptvChannelToggle(id);
      qc.invalidateQueries({ queryKey: ["admin-iptv-channels"] });
      qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
    } catch {
      toast.error("Failed to toggle channel");
    } finally {
      setChannelTogglingId(null);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm("Delete this channel?")) return;
    try {
      await api.adminIptvChannelDelete(id);
      toast.success("Channel deleted");
      qc.invalidateQueries({ queryKey: ["admin-iptv-channels"] });
      qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
    } catch {
      toast.error("Failed to delete channel");
    }
  };

  const handleSubscriberAction = async (
    sub: any,
    action: "activate" | "suspend" | "delete",
  ) => {
    const id = sub._id ?? sub.id;
    if (action === "delete" && !confirm(`Delete subscriber "${sub.name}"?`)) return;
    setSubActionId(id);
    try {
      const res = await api.adminIptvSubscriberAction(id, action);
      if (action === "delete") {
        toast.success(res.message || "Subscriber deleted");
        if (selectedSub?._id === id || selectedSub?.id === id) setSelectedSub(null);
      } else {
        toast.success(res.message || `Subscriber ${action}d`);
        // Keep the open drawer in sync with the new status (and any other
        // fields the action route returns, including Xtream credentials).
        if (res.subscriber && (selectedSub?._id === id || selectedSub?.id === id)) {
          setSelectedSub({ ...selectedSub, ...res.subscriber });
        }
      }
      qc.invalidateQueries({ queryKey: ["admin-iptv-subscribers"] });
      qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
    } catch {
      toast.error(`Failed to ${action} subscriber`);
    } finally {
      setSubActionId(null);
    }
  };

  /** Refresh the open drawer (and the list) after Xtream credentials change. */
  const handleCredentialsUpdated = (updatedSub: any) => {
    if (updatedSub) {
      // Preserve the `_id` shape the rest of the component expects.
      setSelectedSub({ ...selectedSub, ...updatedSub, _id: updatedSub.id });
    }
    qc.invalidateQueries({ queryKey: ["admin-iptv-subscribers"] });
  };

  const handleParseM3u = () => {
    const parsed = parseM3U(m3uText);
    setM3uParsed(parsed);
    if (parsed.length === 0) {
      toast.error("No channels found in playlist");
    } else {
      toast.success(`Parsed ${parsed.length} channels`);
    }
  };

  const handleImportM3u = async () => {
    if (m3uParsed.length === 0) return;
    setM3uImporting(true);
    let created = 0;
    let failed = 0;
    // Sequential to avoid hammering the API and to show clear progress.
    for (const c of m3uParsed) {
      try {
        await api.adminIptvChannelCreate({
          name: c.name,
          streamUrl: c.streamUrl,
          logoUrl: c.logoUrl || undefined,
          category: c.category !== "Uncategorized" ? c.category : undefined,
          isHD: c.isHD,
          status: "active",
        });
        created++;
      } catch {
        failed++;
      }
    }
    setM3uImporting(false);
    toast.success(`Imported ${created} channel(s)${failed ? `, ${failed} failed` : ""}`);
    setShowM3u(false);
    setM3uText("");
    setM3uParsed([]);
    qc.invalidateQueries({ queryKey: ["admin-iptv-channels"] });
    qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
  };

  // --- Stats cards data ----------------------------------------------------
  const statsCards = [
    {
      label: "Active Subscribers",
      value: stats?.activeSubscribers ?? 0,
      icon: <Users size={16} className="text-green-500" />,
      tint: "text-green-600",
    },
    {
      label: "Expired",
      value: stats?.expiredSubscribers ?? 0,
      icon: <Clock size={16} className="text-red-500" />,
      tint: "text-red-600",
    },
    {
      label: "Suspended",
      value: stats?.suspendedSubscribers ?? 0,
      icon: <UserX size={16} className="text-orange-500" />,
      tint: "text-orange-600",
    },
    {
      label: "Total Channels",
      value: stats?.totalChannels ?? 0,
      icon: <Tv2 size={16} className="text-blue-500" />,
      tint: "text-blue-600",
    },
    {
      label: "Active Channels",
      value: stats?.activeChannels ?? 0,
      icon: <Activity size={16} className="text-teal-500" />,
      tint: "text-teal-600",
    },
  ];

  // --- Render --------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">IPTV Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage channels, subscribers &amp; credentials
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "channels" && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setShowXtream(true);
                  setXtreamForm({ profileName: "", hostUrl: "", username: "", password: "" });
                }}
              >
                <Link2 size={16} />
                Add Xtream
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setShowM3u(true);
                  setM3uParsed([]);
                }}
              >
                <Upload size={16} />
                Import M3U
              </Button>
            </>
          )}
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} />
            Add {tab === "channels" ? "Channel" : "Subscriber"}
          </Button>
        </div>
      </div>

      {/* Stats header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statsCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`font-bold text-lg ${s.tint}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["channels", "subscribers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearch("");
              setStatus("all");
              setCategoryFilter("all");
            }}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={`Search ${tab}...`}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            {tab === "channels" ? (
              <SelectItem value="error">Error</SelectItem>
            ) : (
              <>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Channels tab */}
      {tab === "channels" && (
        <>
          {/* Category filter pills */}
          {!channelsLoading && categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <Filter size={14} className="text-muted-foreground shrink-0" />
              <button
                onClick={() => setCategoryFilter("all")}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${categoryFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted/60"}`}
              >
                All
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${categoryFilter === "all" ? "bg-primary-foreground/20" : "bg-muted"}`}>
                  {allChannels.length}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategoryFilter(cat.name)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${categoryFilter === cat.name ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted/60"}`}
                >
                  {cat.name}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${categoryFilter === cat.name ? "bg-primary-foreground/20" : "bg-muted"}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {channelsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No channels match the current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Channel
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                      Country
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                      Viewers
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      Active
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChannels.map((c: any) => {
                    const id = c._id ?? c.id;
                    const q = detectQuality(c);
                    return (
                      <tr
                        key={id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {c.logoUrl ? (
                              <img
                                src={c.logoUrl}
                                alt={c.name}
                                className="w-7 h-7 rounded object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-muted flex items-center justify-center">
                                <Tv2 size={12} className="text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium">{c.name}</p>
                              {q && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1 py-0 h-4 ${qualityBadgeClass(q)}`}
                                >
                                  {q}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {c.category ?? "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {c.country ? (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Globe size={12} />
                              {c.country}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Radio size={12} />
                            {c.viewerCount ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${channelStatusColors[c.status] ?? ""}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={c.status === "active"}
                            disabled={channelTogglingId === id}
                            onCheckedChange={() => handleToggleChannel(c)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Copy stream URL"
                              onClick={() =>
                                copyToClipboard(c.streamUrl, "Stream URL copied")
                              }
                            >
                              <Copy size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              title="Delete channel"
                              onClick={() => handleDeleteChannel(id)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Subscribers tab */}
      {tab === "subscribers" && (
        <>
          {subsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : subscribers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No subscribers match the current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Subscriber
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                      Plan
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                      Expires
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Quick Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s: any) => {
                    const id = s._id ?? s.id;
                    const expiry = getExpiryState(s.expiresAt);
                    return (
                      <tr
                        key={id}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => setSelectedSub(s)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="secondary" className="font-medium">
                            {s.plan}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              {s.expiresAt
                                ? new Date(s.expiresAt).toLocaleDateString()
                                : "—"}
                            </span>
                            <span
                              className={`text-[11px] px-1.5 py-0.5 rounded border w-fit ${expiryColorClasses[expiry.state]}`}
                            >
                              {expiry.state === "expired" && <AlertTriangle size={10} className="inline mr-1" />}
                              {expiry.state === "soon" && <Clock size={10} className="inline mr-1" />}
                              {expiry.state === "active" && <CheckCircle2 size={10} className="inline mr-1" />}
                              {expiry.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${subStatusColors[s.status] ?? ""}`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              disabled={subActionId === id || s.status === "active"}
                              title="Activate"
                              onClick={() => handleSubscriberAction(s, "activate")}
                            >
                              <CheckCircle2 size={13} className="mr-1" />
                              Activate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              disabled={subActionId === id || s.status === "suspended"}
                              title="Suspend"
                              onClick={() => handleSubscriberAction(s, "suspend")}
                            >
                              <Ban size={13} className="mr-1" />
                              Suspend
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              disabled={subActionId === id}
                              title="Delete"
                              onClick={() => handleSubscriberAction(s, "delete")}
                            >
                              {subActionId === id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tab === "channels" ? "Add Channel" : "Add Subscriber"}
            </DialogTitle>
          </DialogHeader>
          {tab === "channels" ? (
            <div className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={channelForm.name}
                  onChange={(e) =>
                    setChannelForm({ ...channelForm, name: e.target.value })
                  }
                  placeholder="BBC News"
                />
              </div>
              <div>
                <Label>Stream URL *</Label>
                <Input
                  value={channelForm.streamUrl}
                  onChange={(e) =>
                    setChannelForm({
                      ...channelForm,
                      streamUrl: e.target.value,
                    })
                  }
                  placeholder="rtsp://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={channelForm.category}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        category: e.target.value,
                      })
                    }
                    placeholder="News"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={channelForm.country}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        country: e.target.value,
                      })
                    }
                    placeholder="UK"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Language</Label>
                  <Input
                    value={channelForm.language}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        language: e.target.value,
                      })
                    }
                    placeholder="English"
                  />
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={channelForm.logoUrl}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        logoUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={channelForm.isHD}
                  onCheckedChange={(v) =>
                    setChannelForm({ ...channelForm, isHD: v })
                  }
                />
                HD channel
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={subForm.name}
                  onChange={(e) =>
                    setSubForm({ ...subForm, name: e.target.value })
                  }
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  value={subForm.email}
                  onChange={(e) =>
                    setSubForm({ ...subForm, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Plan</Label>
                  <Input
                    value={subForm.plan}
                    onChange={(e) =>
                      setSubForm({ ...subForm, plan: e.target.value })
                    }
                    placeholder="Basic"
                  />
                </div>
                <div>
                  <Label>Expires *</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setSubForm({
                        ...subForm,
                        expiresAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : "",
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>MAC Address</Label>
                  <Input
                    value={subForm.mac}
                    onChange={(e) =>
                      setSubForm({ ...subForm, mac: e.target.value })
                    }
                    placeholder="00:1A:2B:3C:4D:5E"
                  />
                </div>
                <div>
                  <Label>Max Connections</Label>
                  <Input
                    type="number"
                    min={1}
                    value={subForm.maxConnections}
                    onChange={(e) =>
                      setSubForm({
                        ...subForm,
                        maxConnections: e.target.value,
                      })
                    }
                    placeholder="1"
                  />
                </div>
              </div>
              <div>
                <Label>Device Type</Label>
                <Input
                  value={subForm.deviceType}
                  onChange={(e) =>
                    setSubForm({ ...subForm, deviceType: e.target.value })
                  }
                  placeholder="Smart TV / MAG / Android box"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={
                tab === "channels"
                  ? handleCreateChannel
                  : handleCreateSubscriber
              }
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* M3U Import dialog */}
      <Dialog open={showM3u} onOpenChange={setShowM3u}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import M3U Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Paste M3U content</Label>
              <Textarea
                value={m3uText}
                onChange={(e) => setM3uText(e.target.value)}
                rows={8}
                placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="..." group-title="Sports",Sky Sports HD\nhttp://stream.url/play.m3u8`}
                className="font-mono text-xs"
              />
            </div>

            {m3uParsed.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Found {m3uParsed.length} channel
                    {m3uParsed.length === 1 ? "" : "s"}. Import all?
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setM3uParsed([])}
                  >
                    <X size={14} className="mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="border rounded-md max-h-60 overflow-y-auto divide-y">
                  {m3uParsed.slice(0, 50).map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 text-xs"
                    >
                      {c.logoUrl ? (
                        <img
                          src={c.logoUrl}
                          alt=""
                          className="w-5 h-5 rounded object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                          <Tv2 size={10} className="text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium truncate flex-1">{c.name}</span>
                      {c.isHD && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                          HD
                        </Badge>
                      )}
                      <span className="text-muted-foreground">{c.category}</span>
                    </div>
                  ))}
                  {m3uParsed.length > 50 && (
                    <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                      … and {m3uParsed.length - 50} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowM3u(false)}>
              Cancel
            </Button>
            {m3uParsed.length === 0 ? (
              <Button onClick={handleParseM3u} disabled={!m3uText.trim()}>
                Parse Playlist
              </Button>
            ) : (
              <Button
                onClick={handleImportM3u}
                disabled={m3uImporting}
                className="gap-2"
              >
                {m3uImporting && <Loader2 size={14} className="animate-spin" />}
                {m3uImporting
                  ? `Importing...`
                  : `Import ${m3uParsed.length} Channel${m3uParsed.length === 1 ? "" : "s"}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xtream Codes dialog */}
      <Dialog open={showXtream} onOpenChange={setShowXtream}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Xtream Codes Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Profile Name *</Label>
              <Input
                value={xtreamForm.profileName}
                onChange={(e) => setXtreamForm({ ...xtreamForm, profileName: e.target.value })}
                placeholder="e.g. Main Server"
              />
            </div>
            <div>
              <Label>Host URL *</Label>
              <Input
                value={xtreamForm.hostUrl}
                onChange={(e) => setXtreamForm({ ...xtreamForm, hostUrl: e.target.value })}
                placeholder="http://your-server.com:8080"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">The Xtream Codes server URL (with port)</p>
            </div>
            <div>
              <Label>Username *</Label>
              <Input
                value={xtreamForm.username}
                onChange={(e) => setXtreamForm({ ...xtreamForm, username: e.target.value })}
                placeholder="Your Xtream username"
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={xtreamForm.password}
                onChange={(e) => setXtreamForm({ ...xtreamForm, password: e.target.value })}
                placeholder="Your Xtream password"
              />
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Enter your Xtream Codes
              credentials. The system will fetch all live channels, VOD, and series from your
              Xtream provider and import them into the channel list.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowXtream(false)}>Cancel</Button>
            <Button
              disabled={xtreamImporting || !xtreamForm.profileName || !xtreamForm.hostUrl || !xtreamForm.username || !xtreamForm.password}
              onClick={async () => {
                setXtreamImporting(true);
                try {
                  // Import via the server-side proxy (avoids browser CORS
                  // restrictions — browsers block cross-origin fetches to
                  // arbitrary Xtream host URLs).
                  const result = await api.adminIptvXtreamImport({
                    hostUrl: xtreamForm.hostUrl,
                    username: xtreamForm.username,
                    password: xtreamForm.password,
                    profileName: xtreamForm.profileName,
                    limit: 500,
                    types: ["live"],
                  });

                  toast.success(result.message || `Imported ${result.imported} channels from Xtream "${xtreamForm.profileName}"`);
                  setShowXtream(false);
                  qc.invalidateQueries({ queryKey: ["admin-iptv-channels"] });
                  qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
                } catch (e: any) {
                  const msg = e?.message || "Failed to connect to Xtream server — check host URL and credentials";
                  toast.error(msg);
                } finally {
                  setXtreamImporting(false);
                }
              }}
              className="gap-2"
            >
              {xtreamImporting ? <Loader2 className="size-4 animate-spin" /> : <Link2 size={16} />}
              {xtreamImporting ? "Importing..." : "Import Channels"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscriber credentials slide-in Drawer */}
      <SubscriberCredentialsDrawer
        sub={selectedSub}
        onClose={() => setSelectedSub(null)}
        onAction={handleSubscriberAction}
        onCredentialsUpdated={handleCredentialsUpdated}
        busyId={subActionId}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SubscriberCredentialsDrawer
// ---------------------------------------------------------------------------

function SubscriberCredentialsDrawer({
  sub,
  onClose,
  onAction,
  onCredentialsUpdated,
  busyId,
}: {
  sub: any | null;
  onClose: () => void;
  onAction: (
    sub: any,
    action: "activate" | "suspend" | "delete",
  ) => void;
  /** Called after credentials are saved/cleared so the parent can refresh `sub`. */
  onCredentialsUpdated?: (updatedSub: any) => void;
  busyId: string | null;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showCredDialog, setShowCredDialog] = React.useState(false);
  const [credSaving, setCredSaving] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [credForm, setCredForm] = React.useState({
    profileName: "",
    hostUrl: "",
    username: "",
    password: "",
    notes: "",
  });

  React.useEffect(() => {
    if (!sub) {
      setShowPassword(false);
      setShowCredDialog(false);
    }
  }, [sub]);

  if (!sub) return null;
  const id = sub._id ?? sub.id;
  const expiry = getExpiryState(sub.expiresAt);

  // Real Xtream Codes credentials are present when the admin has set a host
  // URL + username. When absent, we fall back to synthesising credentials
  // from the subscriber's email/mac so the drawer still shows *something*
  // (backward compatibility for subscribers created before this feature).
  const hasXtream = !!(sub.hostUrl && sub.xtreamUsername);
  const profileName = hasXtream ? sub.profileName : null;
  const username = hasXtream
    ? sub.xtreamUsername
    : sub.email?.split("@")[0] || sub.email || `user_${id?.slice(-6)}`;
  const password = hasXtream
    ? sub.xtreamPassword || ""
    : sub.mac || id?.slice(-12) || "••••••••";
  const portalUrl = hasXtream ? sub.portalUrl || sub.hostUrl : IPTV_PORTAL_BASE;
  const m3uUrl = hasXtream
    ? sub.m3uUrl ||
      `${portalUrl}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`
    : `${portalUrl}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`;

  const summaryNotes = [
    sub.plan ? `Plan: ${sub.plan}` : null,
    sub.deviceType ? `Device: ${sub.deviceType}` : null,
    sub.maxConnections ? `Max connections: ${sub.maxConnections}` : null,
    `Active connections: ${sub.activeConnections ?? 0}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const allCredentials = [
    `Name: ${sub.name}`,
    `Email: ${sub.email}`,
    profileName ? `Profile: ${profileName}` : null,
    `Username: ${username}`,
    `Password: ${password}`,
    `Host URL: ${hasXtream ? sub.hostUrl : "(none — using local portal)"}`,
    `Portal URL: ${portalUrl}`,
    `M3U URL: ${m3uUrl}`,
    sub.mac ? `MAC: ${sub.mac}` : null,
    `Plan: ${sub.plan}`,
    `Status: ${sub.status}`,
    `Expires: ${sub.expiresAt ? new Date(sub.expiresAt).toLocaleString() : "—"}`,
    sub.notes ? `Notes: ${sub.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const openCredDialog = () => {
    setCredForm({
      profileName: sub.profileName || "",
      hostUrl: sub.hostUrl || "",
      username: sub.xtreamUsername || "",
      password: sub.xtreamPassword || "",
      notes: sub.notes || "",
    });
    setShowCredDialog(true);
  };

  const handleSaveCredentials = async () => {
    if (!credForm.profileName || !credForm.hostUrl || !credForm.username || !credForm.password) {
      toast.error("Profile name, host URL, username and password are all required");
      return;
    }
    setCredSaving(true);
    try {
      const res = await api.adminIptvSubscriberCredentials(id, {
        profileName: credForm.profileName,
        hostUrl: credForm.hostUrl,
        username: credForm.username,
        password: credForm.password,
        notes: credForm.notes || undefined,
      });
      toast.success(res.message || "Xtream credentials saved");
      onCredentialsUpdated?.(res.subscriber);
      setShowCredDialog(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save credentials");
    } finally {
      setCredSaving(false);
    }
  };

  const handleClearCredentials = async () => {
    if (!confirm(`Clear Xtream credentials for "${sub.name}"?`)) return;
    setClearing(true);
    try {
      const res = await api.adminIptvSubscriberCredentialsClear(id);
      toast.success(res.message || "Xtream credentials cleared");
      onCredentialsUpdated?.(res.subscriber);
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear credentials");
    } finally {
      setClearing(false);
    }
  };

  return (
    <Drawer open={!!sub} onOpenChange={(o) => !o && onClose()} direction="right">
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            <Users size={16} />
            {sub.name}
          </DrawerTitle>
          <DrawerDescription>
            Subscriber credentials &amp; connection details
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
          {/* Status row */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${subStatusColors[sub.status] ?? ""}`}
            >
              {sub.status}
            </span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded border ${expiryColorClasses[expiry.state]}`}
            >
              {expiry.label}
            </span>
          </div>

          {/* Xtream profile badge */}
          <div
            className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${
              hasXtream
                ? "border-emerald-500/30 bg-emerald-50 text-emerald-700"
                : "border-amber-500/30 bg-amber-50 text-amber-700"
            }`}
          >
            {hasXtream ? (
              <>
                <ShieldCheck size={14} className="shrink-0" />
                <span className="font-medium">
                  Xtream Linked{profileName ? ` · ${profileName}` : ""}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} className="shrink-0" />
                <span className="font-medium">No Xtream profile — credentials are auto-generated</span>
              </>
            )}
          </div>

          {/* Basic info */}
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Subscriber
            </p>
            <CredRow label="Name" value={sub.name} onCopy={() => copyToClipboard(sub.name, "Name copied")} />
            <CredRow label="Email" value={sub.email} onCopy={() => copyToClipboard(sub.email, "Email copied")} />
            {sub.mac && (
              <CredRow label="MAC" value={sub.mac} onCopy={() => copyToClipboard(sub.mac, "MAC copied")} />
            )}
            <CredRow
              label="Plan"
              value={sub.plan}
              onCopy={() => copyToClipboard(sub.plan, "Plan copied")}
            />
            <CredRow
              label="Expires"
              value={sub.expiresAt ? new Date(sub.expiresAt).toLocaleString() : "—"}
              onCopy={
                sub.expiresAt
                  ? () => copyToClipboard(sub.expiresAt, "Expiry copied")
                  : undefined
              }
            />
          </div>

          {/* Xtream Credentials */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Xtream Codes Credentials
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] gap-1"
                  onClick={openCredDialog}
                  title={hasXtream ? "Edit Xtream credentials" : "Set Xtream credentials"}
                >
                  {hasXtream ? <Pencil size={12} /> : <KeyRound size={12} />}
                  {hasXtream ? "Edit" : "Set"}
                </Button>
                {hasXtream && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10 gap-1"
                    onClick={handleClearCredentials}
                    disabled={clearing}
                    title="Clear Xtream credentials"
                  >
                    {clearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {profileName && (
              <CredRow label="Profile" value={profileName} onCopy={() => copyToClipboard(profileName, "Profile name copied")} />
            )}
            {hasXtream && sub.hostUrl && (
              <CredRow label="Host URL" value={sub.hostUrl} mono onCopy={() => copyToClipboard(sub.hostUrl, "Host URL copied")} />
            )}
            <CredRow label="Username" value={username} onCopy={() => copyToClipboard(username, "Username copied")} />
            <div className="flex items-center justify-between gap-2 py-1.5 border-b">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">Password</p>
                <p className="font-mono text-sm truncate">
                  {showPassword ? password : "•".repeat(Math.min(password.length, 16))}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(password, "Password copied")}
                  title="Copy password"
                >
                  <Copy size={13} />
                </Button>
              </div>
            </div>
            <CredRow
              label="Portal URL"
              value={portalUrl}
              mono
              onCopy={() => copyToClipboard(portalUrl, "Portal URL copied")}
            />
            {hasXtream && portalUrl && /^https?:\/\//i.test(portalUrl) && (
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <ExternalLink size={11} /> Open portal
              </a>
            )}
            <CredRow
              label="M3U URL"
              value={m3uUrl}
              mono
              onCopy={() => copyToClipboard(m3uUrl, "M3U URL copied")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Notes
            </p>
            {sub.notes ? (
              <p className="text-xs text-foreground bg-muted/40 border rounded-md p-2.5 whitespace-pre-wrap">
                {sub.notes}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground bg-muted/40 border rounded-md p-2.5">
                {summaryNotes || "No additional notes."}
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t p-3 space-y-2">
          <Button
            className="w-full gap-2"
            onClick={() => copyToClipboard(allCredentials, "All credentials copied")}
          >
            <ClipboardList size={14} />
            Copy All
          </Button>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:bg-green-50"
              disabled={busyId === id || sub.status === "active"}
              onClick={() => onAction(sub, "activate")}
            >
              <CheckCircle2 size={13} className="mr-1" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 hover:bg-orange-50"
              disabled={busyId === id || sub.status === "suspended"}
              onClick={() => onAction(sub, "suspend")}
            >
              <Ban size={13} className="mr-1" />
              Suspend
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              disabled={busyId === id}
              onClick={() => onAction(sub, "delete")}
            >
              {busyId === id ? (
                <Loader2 size={13} className="mr-1 animate-spin" />
              ) : (
                <Trash2 size={13} className="mr-1" />
              )}
              Delete
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onClose}
          >
            <Power size={13} className="mr-1" />
            Close
          </Button>
        </div>
      </DrawerContent>

      {/* Set / Edit Xtream credentials dialog */}
      <Dialog open={showCredDialog} onOpenChange={setShowCredDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound size={16} />
              {hasXtream ? "Edit Xtream Credentials" : "Set Xtream Credentials"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div>
              <Label>Profile Name *</Label>
              <Input
                value={credForm.profileName}
                onChange={(e) => setCredForm({ ...credForm, profileName: e.target.value })}
                placeholder="e.g. Main Server"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">A friendly label for this Xtream provider</p>
            </div>
            <div>
              <Label>Host URL *</Label>
              <Input
                value={credForm.hostUrl}
                onChange={(e) => setCredForm({ ...credForm, hostUrl: e.target.value })}
                placeholder="http://your-server.com:8080"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">The Xtream Codes server URL (with port)</p>
            </div>
            <div>
              <Label>Username *</Label>
              <Input
                value={credForm.username}
                onChange={(e) => setCredForm({ ...credForm, username: e.target.value })}
                placeholder="Xtream username"
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={credForm.password}
                onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                placeholder="Xtream password"
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={credForm.notes}
                onChange={(e) => setCredForm({ ...credForm, notes: e.target.value })}
                placeholder="Internal notes — e.g. expiry, reseller, line ID"
                rows={2}
              />
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Auto-generated:</strong> The M3U URL is
              built from these credentials as
              <code className="mx-1 px-1 py-0.5 rounded bg-muted font-mono text-[10px]">
                {credForm.hostUrl || "http://host:port"}/get.php?...&amp;type=m3u_plus
              </code>
              so the subscriber can plug it straight into any IPTV player.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCredDialog(false)}>Cancel</Button>
            <Button
              disabled={credSaving || !credForm.profileName || !credForm.hostUrl || !credForm.username || !credForm.password}
              onClick={handleSaveCredentials}
              className="gap-2"
            >
              {credSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {credSaving ? "Saving..." : "Save Credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// CredRow — single labelled credential line with optional copy button
// ---------------------------------------------------------------------------

function CredRow({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-sm truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      {onCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onCopy}
          title={`Copy ${label}`}
        >
          <Copy size={13} />
        </Button>
      )}
    </div>
  );
}
