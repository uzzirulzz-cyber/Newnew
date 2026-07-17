"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Facebook,
  Instagram,
  Music2,
  Twitter,
  Youtube,
  Linkedin,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { db } from "@/lib/db";

// Platform config
const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", placeholder: "https://facebook.com/playbeatdigital" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F", placeholder: "https://instagram.com/playbeatdigital" },
  { id: "tiktok", name: "TikTok", icon: Music2, color: "#000000", placeholder: "https://tiktok.com/@playbeatdigital" },
  { id: "twitter", name: "Twitter / X", icon: Twitter, color: "#000000", placeholder: "https://x.com/playbeatdigital" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000", placeholder: "https://youtube.com/@playbeatdigital" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2", placeholder: "https://linkedin.com/company/playbeat-digital" },
];

interface SocialAccount {
  id: string;
  platform: string;
  name: string;
  url: string;
  handle: string;
  followers: number;
  connected: boolean;
  autoPost: boolean;
  apiToken?: string;
}

// Load from settings (stored as JSON in the Settings table)
function useSocialAccounts() {
  return useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/social-media");
      const data = await res.json();
      return data.data?.accounts || [];
    },
    staleTime: 30_000,
  });
}

function useSaveSocialAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accounts: SocialAccount[]) => {
      const res = await fetch("/api/v1/admin/social-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
      toast.success("Social media accounts saved");
    },
    onError: () => toast.error("Failed to save"),
  });
}

export function SocialMediaModule() {
  const { data: accounts = [], isLoading } = useSocialAccounts();
  const saveMutation = useSaveSocialAccounts();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<SocialAccount | null>(null);

  const handleSave = (account: SocialAccount) => {
    const existing = accounts.find((a: SocialAccount) => a.id === account.id);
    let updated: SocialAccount[];
    if (existing) {
      updated = accounts.map((a: SocialAccount) => (a.id === account.id ? account : a));
    } else {
      updated = [...accounts, account];
    }
    saveMutation.mutate(updated);
    setEditOpen(false);
    setEditingAccount(null);
  };

  const handleDelete = (id: string) => {
    saveMutation.mutate(accounts.filter((a: SocialAccount) => a.id !== id));
    toast.success("Account removed");
  };

  const handleToggle = (id: string, field: "connected" | "autoPost") => {
    const updated = accounts.map((a: SocialAccount) =>
      a.id === id ? { ...a, [field]: !a[field] } : a
    );
    saveMutation.mutate(updated);
  };

  const connectedCount = accounts.filter((a: SocialAccount) => a.connected).length;
  const totalFollowers = accounts.reduce((s: number, a: SocialAccount) => s + (a.followers || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 shadow-lg">
          <Share2 className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Social Media</h1>
          <p className="text-sm text-muted-foreground">
            Manage your social media accounts — keep them live for ad management
          </p>
        </div>
        <Button onClick={() => { setEditingAccount(null); setEditOpen(true); }}>
          <Plus className="size-4" /> Add Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-white/5"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Accounts</p>
          <p className="text-2xl font-bold">{accounts.length}</p>
        </CardContent></Card>
        <Card className="bg-white/5"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Connected</p>
          <p className="text-2xl font-bold text-green-400">{connectedCount}</p>
        </CardContent></Card>
        <Card className="bg-white/5"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Followers</p>
          <p className="text-2xl font-bold">{totalFollowers.toLocaleString()}</p>
        </CardContent></Card>
        <Card className="bg-white/5"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Auto-Posting</p>
          <p className="text-2xl font-bold text-blue-400">
            {accounts.filter((a: SocialAccount) => a.autoPost).length}
          </p>
        </CardContent></Card>
      </div>

      {/* Platform cards */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : accounts.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <Share2 className="mx-auto mb-3 size-12 text-muted-foreground" />
          <p className="font-medium">No social accounts yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add your Facebook, Instagram, TikTok, and other accounts to manage them from one place.
          </p>
          <Button onClick={() => { setEditingAccount(null); setEditOpen(true); }}>
            <Plus className="size-4" /> Add your first account
          </Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account: SocialAccount) => {
            const platform = PLATFORMS.find((p) => p.id === account.platform);
            const Icon = platform?.icon || Share2;
            return (
              <Card key={account.id} className="group bg-white/5 transition-all hover:bg-white/[0.07]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="grid size-10 place-items-center rounded-lg"
                        style={{ backgroundColor: `${platform?.color}20`, color: platform?.color }}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{account.name || platform?.name}</p>
                        <p className="text-xs text-muted-foreground">{account.handle || account.url}</p>
                      </div>
                    </div>
                    <Badge variant={account.connected ? "default" : "secondary"} className="gap-1">
                      {account.connected ? (
                        <><CheckCircle2 className="size-3" /> Live</>
                      ) : (
                        <><XCircle className="size-3" /> Disconnected</>
                      )}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {(account.followers || 0).toLocaleString()} followers
                    </span>
                    <div className="flex gap-2">
                      <a
                        href={account.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" /> Visit
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Connected (live for ads)</span>
                      <Switch
                        checked={account.connected}
                        onCheckedChange={() => handleToggle(account.id, "connected")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Auto-post new products</span>
                      <Switch
                        checked={account.autoPost}
                        onCheckedChange={() => handleToggle(account.id, "autoPost")}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setEditingAccount(account); setEditOpen(true); }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick add platform buttons */}
      <Card className="bg-white/5">
        <CardHeader><CardTitle className="text-sm">Quick Add Platform</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const exists = accounts.some((a: SocialAccount) => a.platform === p.id);
            return (
              <Button
                key={p.id}
                variant="outline"
                size="sm"
                disabled={exists}
                className="gap-2"
                onClick={() => {
                  setEditingAccount({
                    id: `${p.id}-${Date.now()}`,
                    platform: p.id,
                    name: p.name,
                    url: "",
                    handle: "",
                    followers: 0,
                    connected: false,
                    autoPost: false,
                  });
                  setEditOpen(true);
                }}
              >
                <Icon className="size-4" style={{ color: p.color }} />
                {p.name}
                {exists && <CheckCircle2 className="size-3 text-green-400" />}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <SocialEditDialog
        open={editOpen}
        account={editingAccount}
        onClose={() => { setEditOpen(false); setEditingAccount(null); }}
        onSave={handleSave}
        saving={saveMutation.isPending}
      />
    </motion.div>
  );
}

function SocialEditDialog({
  open, account, onClose, onSave, saving,
}: {
  open: boolean;
  account: SocialAccount | null;
  onClose: () => void;
  onSave: (account: SocialAccount) => void;
  saving: boolean;
}) {
  const [form, setForm] = React.useState<SocialAccount | null>(account);

  React.useEffect(() => {
    setForm(account);
  }, [account]);

  if (!form) return null;

  const platform = PLATFORMS.find((p) => p.id === form.platform);
  const Icon = platform?.icon || Share2;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5" style={{ color: platform?.color }} />
            {account?.id.includes("-") && !account.url ? "Add" : "Edit"} {platform?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Profile URL *</Label>
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder={platform?.placeholder}
            />
          </div>
          <div>
            <Label>Handle / Username</Label>
            <Input
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              placeholder="@playbeatdigital"
            />
          </div>
          <div>
            <Label>Display Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="PlayBeat Digital"
            />
          </div>
          <div>
            <Label>Followers Count</Label>
            <Input
              type="number"
              value={form.followers}
              onChange={(e) => setForm({ ...form, followers: Number(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          <div>
            <Label>API Token (optional — for auto-posting)</Label>
            <Input
              type="password"
              value={form.apiToken || ""}
              onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
              placeholder="For Facebook Graph API, Instagram API, etc."
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Used for automatic product posting and ad management. Leave empty if not needed.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
            <div>
              <Label className="cursor-pointer">Keep Connected (Live for Ads)</Label>
              <p className="text-[10px] text-muted-foreground">Keeps the account active for ad platform management</p>
            </div>
            <Switch
              checked={form.connected}
              onCheckedChange={(v) => setForm({ ...form, connected: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
            <div>
              <Label className="cursor-pointer">Auto-post New Products</Label>
              <p className="text-[10px] text-muted-foreground">Automatically post when a new product is published</p>
            </div>
            <Switch
              checked={form.autoPost}
              onCheckedChange={(v) => setForm({ ...form, autoPost: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={saving || !form.url.trim()}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
