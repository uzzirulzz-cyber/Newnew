"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Label } from "@/components/ui/label";
import { Tv2, Search, Plus, Trash2, Users, Activity } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  error: "bg-red-100 text-red-600",
};

const subStatusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-600",
  suspended: "bg-orange-100 text-orange-700",
};

export function IptvModule() {
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<"channels" | "subscribers">("channels");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [showCreate, setShowCreate] = React.useState(false);
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

  const { data: stats } = useQuery({
    queryKey: ["admin-iptv-stats"],
    queryFn: () => api.adminIptvStats(),
    staleTime: 30_000,
  });
  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ["admin-iptv-channels", search, status],
    queryFn: () =>
      api.adminIptvChannels({
        search: search || undefined,
        status: status === "all" ? undefined : status,
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

  const channels = channelsData?.items || [];
  const subscribers = subsData?.items || [];

  const handleCreateChannel = async () => {
    if (!channelForm.name || !channelForm.streamUrl) {
      toast.error("Name and stream URL required");
      return;
    }
    try {
      await api.adminIptvChannelCreate(channelForm);
      toast.success("Channel created");
      setShowCreate(false);
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
      qc.invalidateQueries({ queryKey: ["admin-iptv-subscribers"] });
      qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
    } catch {
      toast.error("Failed to add subscriber");
    }
  };

  const handleToggleChannel = async (c: any) => {
    try {
      await api.adminIptvChannelUpdate({
        id: c._id ?? c.id,
        status: c.status === "active" ? "inactive" : "active",
      });
      qc.invalidateQueries({ queryKey: ["admin-iptv-channels"] });
    } catch {
      toast.error("Failed to update channel");
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await api.adminIptvChannelDelete(id);
      toast.success("Channel deleted");
      qc.invalidateQueries({ queryKey: ["admin-iptv-channels"] });
      qc.invalidateQueries({ queryKey: ["admin-iptv-stats"] });
    } catch {
      toast.error("Failed to delete channel");
    }
  };

  const handleUpdateSubscriberStatus = async (id: string, newStatus: string) => {
    try {
      await api.adminIptvSubscriberUpdate({ id, status: newStatus });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-iptv-subscribers"] });
    } catch {
      toast.error("Failed to update subscriber");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">IPTV Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage channels and subscribers
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} />
          Add {tab === "channels" ? "Channel" : "Subscriber"}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: "Total Channels",
              value: stats.totalChannels,
              icon: <Tv2 size={16} className="text-blue-500" />,
            },
            {
              label: "Active",
              value: stats.activeChannels,
              icon: <Activity size={16} className="text-green-500" />,
            },
            {
              label: "Errors",
              value: stats.errorChannels,
              icon: <Activity size={16} className="text-red-500" />,
            },
            {
              label: "Subscribers",
              value: stats.totalSubscribers,
              icon: <Users size={16} className="text-purple-500" />,
            },
            {
              label: "Active Subs",
              value: stats.activeSubscribers,
              icon: <Users size={16} className="text-teal-500" />,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b">
        {(["channels", "subscribers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearch("");
              setStatus("all");
            }}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

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
              <SelectItem value="expired">Expired</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {tab === "channels" ? (
        channelsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
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
                    Stream URL
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c: any) => (
                  <tr
                    key={c._id ?? c.id}
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
                            <Tv2
                              size={12}
                              className="text-muted-foreground"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{c.name}</p>
                          {c.isHD && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                              HD
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {c.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                        {c.streamUrl}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[c.status] ?? ""}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleToggleChannel(c)}
                        >
                          <Activity size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteChannel(c._id ?? c.id)}
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
        )
      ) : subsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s: any) => (
                <tr
                  key={s._id ?? s.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{s.plan}</td>
                  <td className="px-4 py-3 text-xs hidden lg:table-cell">
                    {s.expiresAt
                      ? new Date(s.expiresAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${subStatusColors[s.status] ?? ""}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Select
                      onValueChange={async (v) => {
                        await handleUpdateSubscriberStatus(
                          s._id ?? s.id,
                          v,
                        );
                      }}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue placeholder="Update" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activate</SelectItem>
                        <SelectItem value="suspended">Suspend</SelectItem>
                        <SelectItem value="expired">Mark Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              </div>
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
                    value={subForm.expiresAt}
                    onChange={(e) =>
                      setSubForm({
                        ...subForm,
                        expiresAt: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
              </div>
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
    </div>
  );
}
