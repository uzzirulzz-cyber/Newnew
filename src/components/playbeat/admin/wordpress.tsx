"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Eye,
  FileText,
  Globe,
  Loader2,
  LogIn,
  UserPlus,
  Users,
  Trash2,
  Image as ImageIcon,
  Upload,
  Video,
  Music,
  ExternalLink,
  KeyRound,
  Link2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  private: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300",
};

interface WpAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  source: "local" | "wordpress";
  wpUserId?: number;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  coverImage: string | null;
  status: string;
  authorName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function AdminWordPress() {
  const qc = useQueryClient();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950 rounded-xl">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WordPress CMS</h1>
            <p className="text-muted-foreground text-sm">
              Manage posts, pages and content
            </p>
          </div>
        </div>
        <a
          href="http://localhost:8881/wp-admin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Globe size={14} />
            Open WP Admin
          </Button>
        </a>
      </div>

      {/* WordPress.com / self-hosted connection (runtime-configurable) */}
      <WordPressConnectionCard />

      {/* WordPress Studio + WooCommerce Integration */}
      <WordPressStudioCard />

      {/* WordPress Accounts — Login + Create Account */}
      <WordPressAccountsCard />

      <Tabs defaultValue="blog" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="blog" className="flex-1">
            <FileText className="size-3.5 mr-1.5" />
            Blog Posts (DB)
          </TabsTrigger>
          <TabsTrigger value="wp-posts" className="flex-1">
            <Globe className="size-3.5 mr-1.5" />
            WordPress Posts
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1">
            <ImageIcon className="size-3.5 mr-1.5" />
            Media Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blog">
          <BlogPostsTab />
        </TabsContent>

        <TabsContent value="wp-posts">
          <WpPostsTab />
        </TabsContent>

        <TabsContent value="media">
          <MediaLibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============== WordPress Connection Card (runtime-configurable) ==============

function WordPressConnectionCard() {
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    apiUrl: "https://playbeatdotdigital.wordpress.com/wp-json/wp/v2",
    username: "",
    appPassword: "",
    label: "PlayBeat WP.com",
  });
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  const { data: conn, isLoading } = useQuery({
    queryKey: ["wordpress-connection"],
    queryFn: () => api.wordpressConnection(),
    staleTime: 30_000,
  });

  const configured = conn?.configured === true;

  // Prefill the form when an existing connection loads.
  React.useEffect(() => {
    if (conn?.configured) {
      setForm((f) => ({
        apiUrl: conn.apiUrl || f.apiUrl,
        username: conn.username || "",
        appPassword: "", // never echo the password back; admin re-types to change
        label: conn.label || "PlayBeat WP.com",
      }));
    }
  }, [conn]);

  const handleSave = async (test: boolean) => {
    if (!form.apiUrl || !form.username || !form.appPassword) {
      toast.error("API URL, username and application password are all required");
      return;
    }
    if (test) setTesting(true);
    else setSaving(true);
    try {
      const res = await api.wordpressConnectionSave({
        apiUrl: form.apiUrl,
        username: form.username,
        appPassword: form.appPassword,
        label: form.label || undefined,
        test,
      });
      if (res.test) {
        if (res.test.ok) {
          toast.success(res.test.message || "Connection test succeeded");
        } else {
          toast.error(res.test.message || "Connection test failed");
        }
      } else {
        toast.success(res.message || "WordPress connection saved");
      }
      qc.invalidateQueries({ queryKey: ["wordpress-connection"] });
      qc.invalidateQueries({ queryKey: ["wordpress-posts"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save WordPress connection");
    } finally {
      setSaving(false);
      setTesting(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Remove the stored WordPress connection?")) return;
    try {
      const res = await api.wordpressConnectionClear();
      toast.success(res.message || "Connection cleared");
      qc.invalidateQueries({ queryKey: ["wordpress-connection"] });
      qc.invalidateQueries({ queryKey: ["wordpress-posts"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear connection");
    }
  };

  return (
    <Card className="border-blue-500/30">
      <CardHeader className="border-b bg-blue-50/50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 size={16} className="text-blue-600" />
            WordPress Connection
            {isLoading ? (
              <Loader2 size={12} className="animate-spin text-muted-foreground" />
            ) : configured ? (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                <CheckCircle2 size={10} className="mr-1" /> Connected
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                <AlertCircle size={10} className="mr-1" /> Not connected
              </Badge>
            )}
          </CardTitle>
          {configured && conn?.isWpCom && (
            <Badge variant="outline" className="text-[10px]">
              <Globe size={10} className="mr-1" /> WordPress.com
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3.5">
        {/* Status summary */}
        {configured ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={14} /> {conn?.label || "WordPress site connected"}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p><span className="font-mono">{conn?.apiUrl}</span></p>
              <p>Signed in as <span className="font-medium text-foreground">{conn?.username}</span>{conn?.updatedAt ? ` · updated ${new Date(conn.updatedAt).toLocaleString()}` : ""}</p>
            </div>
            <div className="flex gap-2 pt-1">
              {conn?.apiUrl && (
                <a
                  href={conn.apiUrl.replace(/\/wp-json\/wp\/v2\/?$/, "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink size={11} /> Open site
                </a>
              )}
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-[11px] text-destructive hover:underline"
              >
                <Trash2 size={11} /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-400">
            <p className="font-medium flex items-center gap-1.5 mb-1">
              <AlertCircle size={12} /> No live WordPress site connected
            </p>
            <p className="text-amber-700/80 dark:text-amber-400/80">
              Connect your real WordPress.com site (e.g. <span className="font-mono">playbeatdotdigital.wordpress.com</span>) so posts,
              pages and users sync to the live site instead of the local Studio instance.
            </p>
          </div>
        )}

        {/* Setup form (always visible so the admin can edit/clear) */}
        <div className="space-y-2.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {configured ? "Update connection" : "Connect a WordPress site"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">WordPress REST API URL *</Label>
              <Input
                value={form.apiUrl}
                onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                placeholder="https://playbeatdotdigital.wordpress.com/wp-json/wp/v2"
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                For WordPress.com sites use <span className="font-mono">https://&lt;site&gt;.wordpress.com/wp-json/wp/v2</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Username *</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Your WP.com username"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Application Password *</Label>
              <Input
                type="password"
                value={form.appPassword}
                onChange={(e) => setForm({ ...form, appPassword: e.target.value })}
                placeholder="xxxx xxxx xxxx xxxx"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Label (optional)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. PlayBeat WP.com"
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || testing || !form.apiUrl || !form.username || !form.appPassword}
              className="gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
              {configured ? "Update" : "Save"} Connection
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={saving || testing || !form.apiUrl || !form.username || !form.appPassword}
              className="gap-1.5"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {testing ? "Testing…" : "Save & Test"}
            </Button>
          </div>

          <div className="rounded-md border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10 p-2.5 text-[11px] text-muted-foreground">
            <strong className="text-foreground">How to get an application password:</strong>{" "}
            On WordPress.com go to{" "}
            <span className="font-mono">your site → WP Admin → Users → Profile → Application Passwords</span>
            , enter a name (e.g. &ldquo;PlayBeat&rdquo;) and click <span className="font-mono">Add New Application Password</span>.
            Copy the generated password (spaces included) into the field above.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============== WordPress Studio Integration Card ==============

function WordPressStudioCard() {
  const { data: accountData } = useQuery({
    queryKey: ["wordpress-account"],
    queryFn: () => api.wordpressAccountStatus(),
    staleTime: 30_000,
  });

  const wpAvailable = accountData?.available ?? false;

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-lg bg-blue-600 text-white">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">WordPress + WooCommerce</h3>
              <p className="text-sm text-muted-foreground">
                Real WordPress with WooCommerce plugin — manage your store on the official platform
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-500">
                  WordPress 7.0.2
                </span>
                <span className="rounded bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-500">
                  WooCommerce 10.9.4
                </span>
                <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-500">
                  {wpAvailable ? "API Connected" : "Local Mode"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="http://localhost:8881/wp-admin"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="default" size="sm" className="gap-2">
                <Globe size={14} />
                WP Admin
              </Button>
            </a>
            <a
              href="http://localhost:8881/wp-admin/admin.php?page=wc-settings"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Globe size={14} />
                WooCommerce Settings
              </Button>
            </a>
            <a
              href="http://localhost:8881/wp-admin/post-new.php?post_type=product"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Plus size={14} />
                Add WC Product
              </Button>
            </a>
            <a
              href="http://localhost:8881/wp-json/wc/v3/products"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText size={14} />
                REST API
              </Button>
            </a>
            <a
              href="https://woocommerce.com/my-account/my-stores/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Globe size={14} />
                Connect to WC.com
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============== WordPress User Accounts Card ==============

function WordPressAccountsCard() {
  const qc = useQueryClient();
  const { data: accountData, isLoading: accountsLoading } = useQuery({
    queryKey: ["wordpress-account"],
    queryFn: () => api.wordpressAccountStatus(),
    staleTime: 30_000,
  });

  const accounts: WpAccount[] = (accountData?.accounts || []) as WpAccount[];
  const wpAvailable = accountData?.available ?? false;
  const wpApiUrl =
    accountData?.apiUrl || "http://localhost:8881/wp-json/wp/v2";

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      api.wordpressAccountLogin(payload),
    onSuccess: (res) => toast.success(res.message || "Logged in successfully"),
    onError: (e: Error) => toast.error(`Login failed: ${e.message}`),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      api.wordpressAccountCreate(payload),
    onSuccess: (res) => {
      toast.success(res.message || "WordPress account created");
      qc.invalidateQueries({ queryKey: ["wordpress-account"] });
    },
    onError: (e: Error) => toast.error(`Create failed: ${e.message}`),
  });

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users size={16} className="text-blue-500" />
          WordPress User Accounts
          <Badge
            variant={wpAvailable ? "default" : "secondary"}
            className="ml-1 text-[10px]"
          >
            {wpAvailable ? "WP API Connected" : "Local Mode"}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          API: <span className="font-mono">{wpApiUrl}</span>
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              <LogIn className="size-3.5" /> Login
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-1">
              <UserPlus className="size-3.5" /> Create Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <WpLoginForm
              saving={loginMutation.isPending}
              onSubmit={(email, password) =>
                loginMutation.mutate({ email, password })
              }
            />
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <WpCreateForm
              saving={createMutation.isPending}
              onSubmit={(name, email, password) =>
                createMutation.mutate({ name, email, password })
              }
            />
          </TabsContent>
        </Tabs>

        {/* Registered accounts list */}
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2">
            <Users size={14} className="text-muted-foreground" />
            <h4 className="text-sm font-semibold">
              Registered WordPress Accounts
            </h4>
            <Badge variant="secondary" className="text-[10px]">
              {accounts.length}
            </Badge>
          </div>
          {accountsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : accounts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No WordPress accounts yet. Create one above to get started.
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {a.name || a.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={a.source === "wordpress" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {a.source === "wordpress" ? "WP Synced" : "Local"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============== Blog Posts Tab (DB-backed CRUD) ==============

function BlogPostsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BlogPost | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: () => api.adminBlogPosts(),
    staleTime: 30_000,
  });

  const posts: BlogPost[] = data?.items ?? [];
  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      content?: string;
      excerpt?: string;
      status?: "draft" | "published";
    }) => api.adminBlogCreate(payload),
    onSuccess: () => {
      toast.success("Blog post created");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(`Create failed: ${e.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Record<string, unknown>;
    }) => api.adminBlogUpdate(id, patch),
    onSuccess: () => {
      toast.success("Blog post updated");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(`Update failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminBlogDelete(id),
    onSuccess: () => {
      toast.success("Blog post deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: (e: Error) => toast.error(`Delete failed: ${e.message}`),
  });

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-4">
      {/* Stats — real numbers */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Posts</p>
              <p className="font-bold">{posts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Globe size={16} className="text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="font-bold">{publishedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText size={16} className="text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="font-bold">{draftCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search blog posts..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus size={16} />
          Create Post
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="size-4 mr-2 animate-spin" /> Loading blog posts…
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">No blog posts yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first post to publish on the storefront blog.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus size={14} /> Create Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Slug
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Author
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Date
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
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">
                    <div className="flex flex-col">
                      <span>{p.title}</span>
                      {p.excerpt && (
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                          {p.excerpt}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">
                    /{p.slug}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {p.authorName || "—"}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {p.publishedAt
                      ? new Date(p.publishedAt).toLocaleDateString()
                      : new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[p.status] ?? ""}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View"
                      >
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye size={13} />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Edit"
                        onClick={() => {
                          setEditing(p);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            !confirm(
                              `Delete post "${p.title}"? This cannot be undone.`,
                            )
                          )
                            return;
                          deleteMutation.mutate(p.id);
                        }}
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

      <BlogPostDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, patch: values });
          } else {
            createMutation.mutate(values);
          }
        }}
      />
    </div>
  );
}

function BlogPostDialog({
  open,
  onOpenChange,
  editing,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: BlogPost | null;
  saving: boolean;
  onSubmit: (values: {
    title: string;
    content: string;
    excerpt: string;
    status: "draft" | "published";
  }) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [status, setStatus] = React.useState<"draft" | "published">("draft");

  React.useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setContent(editing?.content ?? "");
      setExcerpt(editing?.excerpt ?? "");
      setStatus(
        editing?.status === "published" ? "published" : "draft",
      );
    }
  }, [open, editing]);

  const valid = title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Blog Post" : "Create Blog Post"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bp-title" className="text-xs">
              Title
            </Label>
            <Input
              id="bp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title…"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bp-excerpt" className="text-xs">
              Excerpt (optional)
            </Label>
            <Input
              id="bp-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bp-content" className="text-xs">
              Content
            </Label>
            <Textarea
              id="bp-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Write your post content here…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <div className="flex gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-lg border px-4 py-2 text-xs font-medium capitalize transition-colors ${
                    status === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!valid || saving}
            onClick={() =>
              onSubmit({
                title: title.trim(),
                content,
                excerpt,
                status,
              })
            }
          >
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Plus className="size-4 mr-2" />
            )}
            {editing ? "Save Changes" : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== WordPress Posts Tab (remote WP REST API) ==============

function WpPostsTab() {
  const [search, setSearch] = React.useState("");

  const { data: wpData, isLoading } = useQuery({
    queryKey: ["wordpress-posts"],
    queryFn: () => api.wordpressPosts(),
    staleTime: 60_000,
  });

  const posts =
    wpData?.items?.map((p: any) => ({
      title: p.title?.rendered ?? "Untitled",
      status: p.status,
      date: new Date(p.date).toISOString().split("T")[0],
      link: p.link,
      excerpt: p.excerpt?.rendered ?? "",
    })) || [];

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Posts</p>
              <p className="font-bold">{posts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Globe size={16} className="text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="font-bold">{publishedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText size={16} className="text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="font-bold">{draftCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search WordPress posts..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="size-4 mr-2 animate-spin" /> Loading posts…
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {wpData?.configured ? (
              wpData?.error ? (
                `WordPress API error: ${wpData.error}`
              ) : (
                "No posts returned from WordPress."
              )
            ) : (
              <div className="space-y-2">
                <Globe
                  size={32}
                  className="mx-auto text-muted-foreground/60"
                />
                <p className="font-medium text-foreground">
                  WordPress API is not configured
                </p>
                <p className="text-xs">
                  Set <code className="font-mono">WORDPRESS_API_URL</code> in your
                  <code className="font-mono"> .env</code> file to fetch real posts from your WordPress instance.
                </p>
                <p className="text-xs text-muted-foreground/80 pt-2">
                  Meanwhile, use the <strong>Blog Posts (DB)</strong> tab to
                  create and publish posts that appear on your storefront blog.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Date
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
              {filtered.map((p, i) => (
                <tr
                  key={p.title + i}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {p.date}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[p.status] ?? ""}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                        >
                          View <ExternalLink size={11} />
                        </Button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============== Media Library Tab ==============

function MediaLibraryTab() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    url: "",
    type: "image" as string,
    size: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["wordpress-media-library"],
    queryFn: () => api.adminMediaList(),
    staleTime: 30_000,
  });

  const media: any[] = data?.items ?? [];

  const handleAdd = async () => {
    if (!form.name || !form.url) {
      toast.error("Name and URL required");
      return;
    }
    try {
      await api.adminMediaAdd({
        name: form.name,
        url: form.url,
        type: form.type,
        size: Number(form.size) || 0,
      });
      toast.success("Media added");
      setShowUpload(false);
      setForm({ name: "", url: "", type: "image", size: "" });
      qc.invalidateQueries({ queryKey: ["wordpress-media-library"] });
    } catch {
      toast.error("Failed to add media");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media file?")) return;
    try {
      await api.adminMediaDelete(id);
      toast.success("Media deleted");
      qc.invalidateQueries({ queryKey: ["wordpress-media-library"] });
    } catch {
      toast.error("Failed to delete media");
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    image: <ImageIcon size={16} className="text-blue-500" />,
    video: <Video size={16} className="text-purple-500" />,
    document: <FileText size={16} className="text-orange-500" />,
    audio: <Music size={16} className="text-green-500" />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          Upload and manage media files for your blog and store.
        </p>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Upload size={16} />
          Upload Media
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="size-4 mr-2 animate-spin" /> Loading media…
          </CardContent>
        </Card>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon
              size={40}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <p className="font-medium mb-1">No media files yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first image, video, or document.
            </p>
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Upload size={14} /> Upload Media
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {media.map((m) => (
            <div
              key={m.id ?? m._id}
              className="group relative rounded-lg border bg-muted overflow-hidden aspect-square"
            >
              {m.type === "image" ? (
                <img
                  src={m.url}
                  alt={m.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                  {typeIcons[m.type] || <FileText size={16} />}
                  <p className="text-xs text-muted-foreground text-center line-clamp-2 break-all">
                    {m.name}
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => handleDelete(m.id ?? m._id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{m.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="file-name.jpg"
              />
            </div>
            <div>
              <Label className="text-xs">URL *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Size (bytes)</Label>
              <Input
                type="number"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Tip: in production this would be a file upload widget. For now,
              provide a URL where the file is hosted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== WordPress Login / Create Account forms ==============

function WpLoginForm({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (email: string, password: string) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="wp-email" className="text-xs">
          Email
        </Label>
        <Input
          id="wp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
        />
      </div>
      <div>
        <Label htmlFor="wp-password" className="text-xs">
          Password
        </Label>
        <Input
          id="wp-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button
        className="w-full"
        disabled={saving || !email.trim() || !password}
        onClick={() => onSubmit(email.trim(), password)}
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        Login
      </Button>
    </div>
  );
}

function WpCreateForm({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (name: string, email: string, password: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const tooShort = password.length > 0 && password.length < 6;

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="wp-name" className="text-xs">
          Full Name
        </Label>
        <Input
          id="wp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <Label htmlFor="wp-cemail" className="text-xs">
          Email
        </Label>
        <Input
          id="wp-cemail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
        />
      </div>
      <div>
        <Label htmlFor="wp-cpassword" className="text-xs">
          Password
        </Label>
        <Input
          id="wp-cpassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        {tooShort && (
          <p className="mt-1 text-[10px] text-red-400">
            Password must be at least 6 characters.
          </p>
        )}
      </div>
      <Button
        className="w-full"
        disabled={saving || !name.trim() || !email.trim() || password.length < 6}
        onClick={() => onSubmit(name.trim(), email.trim(), password)}
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        Create Account
      </Button>
    </div>
  );
}
