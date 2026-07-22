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
  CheckCircle2,
  XCircle,
  Loader2,
  Share2,
  Send,
  Trash2,
  LogOut,
  PenSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";

// Platform config — the source of truth for which platforms are supported.
const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F" },
  { id: "tiktok", name: "TikTok", icon: Music2, color: "#000000" },
  { id: "twitter", name: "Twitter / X", icon: Twitter, color: "#000000" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

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
  // Credentials — saved on the account record. Password is stored for re-auth
  // convenience (admin tool, not customer-facing). Use apiToken above for the
  // real Graph/Auto-post API token.
  email?: string;
  password?: string;
}

interface SocialPost {
  id: string;
  content: string;
  platforms: string[];
  status: "draft" | "published";
  link: string | null;
  createdAt: string;
}

// ===== Hooks =====

function useSocialAccounts() {
  return useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/social-media");
      const data = await res.json();
      return (data.data?.accounts || []) as SocialAccount[];
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
    },
    onError: (e: Error) => toast.error(`Failed to save: ${e.message}`),
  });
}

function useSocialPosts() {
  return useQuery({
    queryKey: ["social-posts"],
    queryFn: () => api.socialPostsList(),
    staleTime: 30_000,
  });
}

function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      content: string;
      platforms: string[];
      status?: "draft" | "published";
      link?: string;
    }) => api.socialPostCreate(payload),
    onSuccess: (data) => {
      toast.success(data.message || "Draft post saved");
      qc.invalidateQueries({ queryKey: ["social-posts"] });
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });
}

function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.socialPostDelete(id),
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["social-posts"] });
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });
}

// ===== Main module =====

export function SocialMediaModule() {
  const { data: accounts = [], isLoading } = useSocialAccounts();
  const saveMutation = useSaveSocialAccounts();
  const { data: postsData, isLoading: postsLoading } = useSocialPosts();
  const createPostMutation = useCreatePost();
  const deletePostMutation = useDeletePost();

  // Local composer state
  const [postContent, setPostContent] = React.useState("");
  const [postLink, setPostLink] = React.useState("");
  const [postPlatforms, setPostPlatforms] = React.useState<string[]>([]);

  const handleToggle = (id: string, field: "connected" | "autoPost") => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, [field]: !a[field] } : a,
    );
    saveMutation.mutate(updated);
    toast.success(`${field === "connected" ? "Connected" : "Auto-post"} updated`);
  };

  const handleUpsertAccount = (account: SocialAccount) => {
    const existing = accounts.find((a) => a.id === account.id);
    const updated = existing
      ? accounts.map((a) => (a.id === account.id ? account : a))
      : [...accounts, account];
    saveMutation.mutate(updated);
  };

  const handleLogout = (id: string) => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, email: undefined, password: undefined, connected: false } : a,
    );
    saveMutation.mutate(updated);
    toast.success("Logged out — credentials cleared");
  };

  const handleDeleteAccount = (id: string) => {
    saveMutation.mutate(accounts.filter((a) => a.id !== id));
    toast.success("Account removed");
  };

  const handleCreatePost = (status: "draft" | "published") => {
    if (!postContent.trim()) {
      toast.error("Post content is required");
      return;
    }
    createPostMutation.mutate(
      {
        content: postContent,
        platforms: postPlatforms,
        status,
        link: postLink.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPostContent("");
          setPostLink("");
          setPostPlatforms([]);
        },
      },
    );
  };

  const togglePlatform = (pid: string) => {
    setPostPlatforms((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid],
    );
  };

  const connectedCount = accounts.filter((a) => a.connected).length;
  const totalFollowers = accounts.reduce((s, a) => s + (a.followers || 0), 0);
  const posts = postsData?.posts || [];

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
            Login or create accounts on each platform, post updates, and manage auto-posting.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-white/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Accounts</p>
            <p className="text-2xl font-bold">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Connected</p>
            <p className="text-2xl font-bold text-green-400">{connectedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Followers</p>
            <p className="text-2xl font-bold">{totalFollowers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Auto-Posting</p>
            <p className="text-2xl font-bold text-blue-400">
              {accounts.filter((a) => a.autoPost).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Post to Social composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenSquare className="size-4" /> Post to Social
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="post-content">Content</Label>
            <Textarea
              id="post-content"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's new? Share an update across your connected platforms..."
              rows={3}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {postContent.length} characters
            </p>
          </div>
          <div>
            <Label htmlFor="post-link">Link (optional)</Label>
            <Input
              id="post-link"
              value={postLink}
              onChange={(e) => setPostLink(e.target.value)}
              placeholder="https://playbeat.digital/..."
            />
          </div>
          <div>
            <Label>Platforms</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {PLATFORMS.map((p) => {
                const checked = postPlatforms.includes(p.id);
                const Icon = p.icon;
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm transition ${
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    }`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => togglePlatform(p.id)} />
                    <Icon className="size-4" style={{ color: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleCreatePost("draft")}
              disabled={createPostMutation.isPending || !postContent.trim()}
            >
              {createPostMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PenSquare className="size-4" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={() => handleCreatePost("published")}
              disabled={createPostMutation.isPending || !postContent.trim()}
            >
              {createPostMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Publish Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform cards — every platform is shown; each has Login + Create Account */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((p) => {
          const account = accounts.find((a) => a.platform === p.id);
          const Icon = p.icon;
          return (
            <PlatformCard
              key={p.id}
              platformId={p.id as PlatformId}
              name={p.name}
              color={p.color}
              Icon={Icon}
              account={account || null}
              saving={saveMutation.isPending}
              onUpsert={handleUpsertAccount}
              onToggle={handleToggle}
              onLogout={handleLogout}
              onDelete={handleDeleteAccount}
            />
          );
        })}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading accounts...</p>}

      {/* Recent posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No posts yet. Use the composer above to create your first post.
            </p>
          ) : (
            <div className="space-y-2">
              {posts.map((post: SocialPost) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm">{post.content}</p>
                      {post.link && (
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="size-3" /> {post.link}
                        </a>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={post.status === "published" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {post.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(post.createdAt).toLocaleString()}
                        </span>
                        {post.platforms.length > 0 && (
                          <div className="flex items-center gap-1">
                            {post.platforms.map((pid) => {
                              const platform = PLATFORMS.find((pp) => pp.id === pid);
                              if (!platform) return null;
                              const PIcon = platform.icon;
                              return (
                                <PIcon
                                  key={pid}
                                  className="size-3.5"
                                  style={{ color: platform.color }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0 text-red-400 hover:bg-red-500/10"
                      onClick={() => deletePostMutation.mutate(post.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===== Platform card with Login + Create Account tabs =====

interface PlatformCardProps {
  platformId: PlatformId;
  name: string;
  color: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  account: SocialAccount | null;
  saving: boolean;
  onUpsert: (account: SocialAccount) => void;
  onToggle: (id: string, field: "connected" | "autoPost") => void;
  onLogout: (id: string) => void;
  onDelete: (id: string) => void;
}

function PlatformCard({
  platformId,
  name,
  color,
  Icon,
  account,
  saving,
  onUpsert,
  onToggle,
  onLogout,
  onDelete,
}: PlatformCardProps) {
  const hasCredentials = Boolean(account?.email && account?.password);

  return (
    <Card className="flex flex-col bg-white/5">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid size-10 place-items-center rounded-lg"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">
                {account ? (
                  hasCredentials ? (
                    <>Signed in as {account.email}</>
                  ) : (
                    <>Not signed in</>
                  )
                ) : (
                  <>No account record</>
                )}
              </p>
            </div>
          </div>
          {account && (
            <Badge variant={account.connected ? "default" : "secondary"} className="gap-1">
              {account.connected ? (
                <>
                  <CheckCircle2 className="size-3" /> Live
                </>
              ) : (
                <>
                  <XCircle className="size-3" /> Off
                </>
              )}
            </Badge>
          )}
        </div>

        {/* Logged-in state — toggles */}
        {account && hasCredentials ? (
          <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Connected (live for ads)</span>
              <Switch
                checked={account.connected}
                onCheckedChange={() => onToggle(account.id, "connected")}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Auto-post new products</span>
              <Switch
                checked={account.autoPost}
                onCheckedChange={() => onToggle(account.id, "autoPost")}
                disabled={saving}
              />
            </div>
          </div>
        ) : (
          /* Not logged in — Login + Create Account tabs */
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
              <TabsTrigger value="create" className="flex-1">Create Account</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm
                platformId={platformId}
                name={name}
                color={color}
                account={account}
                saving={saving}
                onSubmit={(email, password) => {
                  const updated: SocialAccount = account
                    ? { ...account, email, password }
                    : {
                        id: `${platformId}-${Date.now()}`,
                        platform: platformId,
                        name,
                        url: "",
                        handle: "",
                        followers: 0,
                        connected: true,
                        autoPost: false,
                        email,
                        password,
                      };
                  onUpsert(updated);
                  toast.success(`Signed in to ${name} as ${email}`);
                }}
              />
            </TabsContent>
            <TabsContent value="create">
              <CreateAccountForm
                platformId={platformId}
                name={name}
                color={color}
                account={account}
                saving={saving}
                onSubmit={(display, email, password) => {
                  const updated: SocialAccount = account
                    ? { ...account, name: display, email, password }
                    : {
                        id: `${platformId}-${Date.now()}`,
                        platform: platformId,
                        name: display,
                        url: "",
                        handle: "",
                        followers: 0,
                        connected: true,
                        autoPost: false,
                        email,
                        password,
                      };
                  onUpsert(updated);
                  toast.success(`Account created on ${name} for ${email}`);
                }}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Footer actions */}
        {account && (
          <div className="mt-auto flex gap-2 pt-2">
            {hasCredentials && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onLogout(account.id)}
                disabled={saving}
              >
                <LogOut className="size-3.5" /> Logout
              </Button>
            )}
            {account.url && (
              <a
                href={account.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                <ExternalLink className="size-3" /> Visit
              </a>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:bg-red-500/10"
              onClick={() => onDelete(account.id)}
              disabled={saving}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoginForm({
  name,
  account,
  saving,
  onSubmit,
}: {
  platformId: PlatformId;
  name: string;
  color: string;
  account: SocialAccount | null;
  saving: boolean;
  onSubmit: (email: string, password: string) => void;
}) {
  const [email, setEmail] = React.useState(account?.email || "");
  const [password, setPassword] = React.useState(account?.password || "");

  React.useEffect(() => {
    setEmail(account?.email || "");
    setPassword(account?.password || "");
  }, [account]);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`your@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`}
        />
      </div>
      <div>
        <Label className="text-xs">Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={saving || !email.trim() || !password.trim()}
        onClick={() => onSubmit(email.trim(), password)}
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Login to {name}
      </Button>
    </div>
  );
}

function CreateAccountForm({
  name,
  account,
  saving,
  onSubmit,
}: {
  platformId: PlatformId;
  name: string;
  color: string;
  account: SocialAccount | null;
  saving: boolean;
  onSubmit: (name: string, email: string, password: string) => void;
}) {
  const [displayName, setDisplayName] = React.useState(account?.name || "");
  const [email, setEmail] = React.useState(account?.email || "");
  const [password, setPassword] = React.useState(account?.password || "");

  React.useEffect(() => {
    setDisplayName(account?.name || "");
    setEmail(account?.email || "");
    setPassword(account?.password || "");
  }, [account]);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Display Name</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="PlayBeat Digital"
        />
      </div>
      <div>
        <Label className="text-xs">Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`your@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`}
        />
      </div>
      <div>
        <Label className="text-xs">Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={
          saving || !displayName.trim() || !email.trim() || password.length < 6
        }
        onClick={() => onSubmit(displayName.trim(), email.trim(), password)}
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Create {name} Account
      </Button>
    </div>
  );
}
