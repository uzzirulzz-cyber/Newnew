"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Share2,
  KeyRound,
  Loader2,
  Save,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
  ExternalLink,
  Copy,
  Download,
  Users,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "Lead", label: "Lead (form submission)" },
  { value: "CompleteRegistration", label: "Complete Registration (order placed)" },
  { value: "Purchase", label: "Purchase (payment confirmed)" },
  { value: "Subscribe", label: "Subscribe" },
  { value: "AddToCart", label: "Add to Cart" },
  { value: "InitiateCheckout", label: "Initiate Checkout" },
];

const WEBHOOK_URL = typeof window !== "undefined"
  ? `${window.location.origin}/api/v1/tiktok/webhook`
  : "https://playbeat.digital/api/v1/tiktok/webhook";

export function TikTokModule() {
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<"leads" | "advertising" | "mcp" | "loginkit">("leads");
  const [form, setForm] = React.useState({
    accessToken: "",
    advertiserId: "",
    pixelCode: "",
    webhookSecret: "",
    testEventCode: "",
  });
  const [autoEvents, setAutoEvents] = React.useState<string[]>(["Lead", "CompleteRegistration", "Purchase"]);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [leadFilter, setLeadFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [viewLead, setViewLead] = React.useState<any | null>(null);

  // OAuth state
  const [oauthForm, setOauthForm] = React.useState({ appId: "", appSecret: "", redirectUri: "" });
  const [oauthSaving, setOauthSaving] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);

  // Check URL for OAuth callback success/error params
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("tiktok_success");
      const err = params.get("tiktok_error");
      if (success) {
        toast.success(success);
        setTab("leads");
        qc.invalidateQueries({ queryKey: ["tiktok-settings"] });
        // Clean the URL
        window.history.replaceState({}, "", "/wp-admin?tiktok=tiktok");
      }
      if (err) {
        toast.error(`TikTok connection failed: ${err}`);
        window.history.replaceState({}, "", "/wp-admin?tiktok=tiktok");
      }
    }
  }, [qc]);

  const { data: oauthData, isLoading: oauthLoading } = useQuery({
    queryKey: ["tiktok-oauth"],
    queryFn: () => api.tiktokOAuth(),
    staleTime: 30_000,
  });
  const oauthConfigured = oauthData?.configured === true;

  React.useEffect(() => {
    if (oauthData?.configured) {
      setOauthForm((f) => ({
        ...f,
        appId: oauthData.appId || "",
        redirectUri: oauthData.redirectUri || "",
        appSecret: "", // never echo back
      }));
    } else {
      // Default redirect URI
      setOauthForm((f) => ({
        ...f,
        redirectUri: `${window.location.origin}/api/v1/tiktok/callback`,
      }));
    }
  }, [oauthData]);

  const handleSaveOauth = async () => {
    if (!oauthForm.appId || !oauthForm.appSecret) {
      toast.error("App ID and App Secret are required");
      return;
    }
    setOauthSaving(true);
    try {
      const res = await api.tiktokOAuthSave({
        appId: oauthForm.appId,
        appSecret: oauthForm.appSecret,
        redirectUri: oauthForm.redirectUri || undefined,
      });
      toast.success(res.message || "OAuth config saved");
      setOauthForm((f) => ({ ...f, appSecret: "" }));
      qc.invalidateQueries({ queryKey: ["tiktok-oauth"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save OAuth config");
    } finally {
      setOauthSaving(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await api.tiktokConnect();
      if (res.authorizeUrl) {
        // Redirect the admin to TikTok's login + authorization page
        window.location.href = res.authorizeUrl;
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to start OAuth flow");
    } finally {
      setConnecting(false);
    }
  };

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["tiktok-settings"],
    queryFn: () => api.tiktokSettings(),
    staleTime: 30_000,
  });
  const configured = settings?.configured === true;

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["tiktok-leads", leadFilter, search],
    queryFn: () => api.tiktokLeads({ status: leadFilter, search: search || undefined }),
    staleTime: 15_000,
  });

  const leads = leadsData?.items || [];
  const newCount = leads.filter((l: any) => l.status === "new").length;
  const convertedCount = leads.filter((l: any) => l.status === "converted").length;
  const postbackCount = leads.filter((l: any) => l.postbackSent).length;

  React.useEffect(() => {
    if (settings?.configured) {
      setForm((f) => ({
        ...f,
        advertiserId: settings.advertiserId || "",
        pixelCode: settings.pixelCode || "",
        testEventCode: settings.testEventCode || "",
        accessToken: "", // never echo back; admin re-types to change
        webhookSecret: "",
      }));
      if (settings.autoPostbackEvents) setAutoEvents(settings.autoPostbackEvents);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!form.accessToken && !configured) {
      toast.error("Access token is required");
      return;
    }
    if (!form.advertiserId) {
      toast.error("Advertiser ID is required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        advertiserId: form.advertiserId,
        pixelCode: form.pixelCode,
        autoPostbackEvents: autoEvents,
      };
      if (form.accessToken) payload.accessToken = form.accessToken;
      if (form.webhookSecret) payload.webhookSecret = form.webhookSecret;
      if (form.testEventCode) payload.testEventCode = form.testEventCode;
      const res = await api.tiktokSettingsSave(payload);
      toast.success(res.message || "TikTok settings saved");
      setForm((f) => ({ ...f, accessToken: "", webhookSecret: "" }));
      qc.invalidateQueries({ queryKey: ["tiktok-settings"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Remove TikTok settings?")) return;
    try {
      const res = await api.tiktokSettingsClear();
      toast.success(res.message || "Settings cleared");
      qc.invalidateQueries({ queryKey: ["tiktok-settings"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await api.tiktokTest("test@playbeat.digital");
      if (res.ok) {
        toast.success(res.message || "Test event sent to TikTok");
      } else {
        toast.error(res.message || "Test failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleLeadStatus = async (lead: any, status: string) => {
    try {
      const res = await api.tiktokLeadUpdate(lead.id, status);
      toast.success(res.message || `Lead marked as ${status}`);
      qc.invalidateQueries({ queryKey: ["tiktok-leads"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to update lead");
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const toggleEvent = (event: string) => {
    setAutoEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">TikTok Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time lead sync + conversion postbacks to TikTok
          </p>
        </div>
        {configured ? (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={12} className="mr-1" /> Connected
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertCircle size={12} className="mr-1" /> Not connected
          </Badge>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("leads")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "leads" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Leads &amp; Postbacks
        </button>
        <button
          onClick={() => setTab("advertising")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "advertising" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Advertising
        </button>
        <button
          onClick={() => setTab("mcp")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "mcp" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          MCP Console
        </button>
        <button
          onClick={() => setTab("loginkit")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "loginkit" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Login Kit
        </button>
      </div>

      {tab === "advertising" && <AdvertisingTab configured={configured} />}
      {tab === "mcp" && <McpConsoleTab configured={configured} />}
      {tab === "loginkit" && <LoginKitTab />}

      {tab === "leads" && (
      <>
      {/* OAuth — Connect with TikTok (one-click login) */}
      <Card className="border-pink-500/30">
        <CardHeader className="border-b bg-pink-50/50 dark:bg-pink-950/20">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap size={16} className="text-pink-500" />
            Connect with TikTok (OAuth)
            {oauthConfigured && (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                <CheckCircle2 size={10} className="mr-1" /> App configured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {!oauthConfigured ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium flex items-center gap-1.5 mb-1">
                <AlertCircle size={12} /> Set up TikTok OAuth App
              </p>
              <p>Enter your TikTok developer App ID + Secret to enable one-click login. Get them from{" "}
                <a href="https://ads.tiktok.com/marketing_api/docs?id=1733855983206401" target="_blank" rel="noopener noreferrer" className="text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-0.5">
                  TikTok For Business → My Apps <ExternalLink size={10} />
                </a>.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 flex items-center justify-between gap-2">
              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                <p className="font-medium">OAuth app ready — App ID: <span className="font-mono">{oauthData?.appId}</span></p>
                <p className="text-muted-foreground">Redirect URI: <span className="font-mono">{oauthData?.redirectUri}</span></p>
              </div>
              <Button onClick={handleConnect} disabled={connecting} className="gap-1.5 bg-pink-600 hover:bg-pink-700">
                {connecting ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                Connect with TikTok
              </Button>
            </div>
          )}

          {/* OAuth app config form (always visible so admin can update) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">App ID *</Label>
              <Input
                value={oauthForm.appId}
                onChange={(e) => setOauthForm({ ...oauthForm, appId: e.target.value })}
                placeholder="e.g. 7123456789012345678"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">App Secret {oauthConfigured ? "(leave blank to keep)" : "*"}</Label>
              <Input
                type="password"
                value={oauthForm.appSecret}
                onChange={(e) => setOauthForm({ ...oauthForm, appSecret: e.target.value })}
                placeholder={oauthConfigured ? "•••••••• (saved)" : "Your app secret"}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Redirect URI</Label>
              <Input
                value={oauthForm.redirectUri}
                onChange={(e) => setOauthForm({ ...oauthForm, redirectUri: e.target.value })}
                placeholder="https://playbeat.digital/api/v1/tiktok/callback"
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                This must match the Redirect URL configured in your TikTok developer app settings.
              </p>
            </div>
          </div>
          <Button onClick={handleSaveOauth} disabled={oauthSaving} variant="outline" className="gap-1.5">
            {oauthSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {oauthConfigured ? "Update OAuth Config" : "Save OAuth Config"}
          </Button>
        </CardContent>
      </Card>

      {/* Manual connection (fallback) — label it as alternative */}
      <div className="text-xs text-center text-muted-foreground">— or connect manually with an access token —</div>

      {/* Connection / Settings card */}
      <Card className="border-pink-500/30">
        <CardHeader className="border-b bg-pink-50/50 dark:bg-pink-950/20">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 size={16} className="text-pink-500" />
            TikTok Connection
            {settingsLoading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {configured ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-1">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Connected to TikTok For Business
              </p>
              <p className="text-xs text-muted-foreground">
                Advertiser ID: <span className="font-mono">{settings?.advertiserId}</span>
                {settings?.pixelCode && <> · Pixel: <span className="font-mono">{settings.pixelCode}</span></>}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium flex items-center gap-1.5 mb-1">
                <AlertCircle size={12} /> Connect TikTok For Business
              </p>
              <p>Get your access token, advertiser ID, and pixel code from TikTok Ads Manager → Assets → Events.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Access Token {configured ? "(leave blank to keep current)" : "*"}</Label>
              <Input
                type="password"
                value={form.accessToken}
                onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                placeholder={configured ? "•••••••• (saved)" : "Long-term access token from TikTok"}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Advertiser ID *</Label>
              <Input
                value={form.advertiserId}
                onChange={(e) => setForm({ ...form, advertiserId: e.target.value })}
                placeholder="e.g. 6987654321098"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pixel Code</Label>
              <Input
                value={form.pixelCode}
                onChange={(e) => setForm({ ...form, pixelCode: e.target.value })}
                placeholder="e.g. C5XXXXXXXXXXXXXX"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Webhook Secret (optional)</Label>
              <Input
                type="password"
                value={form.webhookSecret}
                onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                placeholder={configured ? "•••••••• (saved)" : "Secret for webhook verification"}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Test Event Code (optional)</Label>
              <Input
                value={form.testEventCode}
                onChange={(e) => setForm({ ...form, testEventCode: e.target.value })}
                placeholder="e.g. TEST12345"
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Auto-postback event toggles */}
          <div className="space-y-2">
            <Label className="text-xs">Auto-Postback Events</Label>
            <p className="text-[10px] text-muted-foreground">
              When these events happen (order placed, payment confirmed), a postback is automatically sent to TikTok for ad optimization.
            </p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((evt) => (
                <button
                  key={evt.value}
                  onClick={() => toggleEvent(evt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    autoEvents.includes(evt.value)
                      ? "bg-pink-600 text-white border-pink-600"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {evt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Webhook URL */}
          <div className="space-y-1.5 rounded-lg border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Webhook URL (for TikTok Lead Gen)</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={() => handleCopy(WEBHOOK_URL, "Webhook URL")}
              >
                <Copy size={11} /> Copy
              </Button>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground break-all">{WEBHOOK_URL}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Add this URL in TikTok Events Manager → Webhooks to receive real-time leads.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {configured ? "Update Settings" : "Save & Connect"}
            </Button>
            {configured && (
              <>
                <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-1.5">
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Send Test Event
                </Button>
                <Button variant="ghost" onClick={handleClear} className="text-destructive gap-1.5">
                  <Trash2 size={14} /> Disconnect
                </Button>
              </>
            )}
            <a
              href="https://ads.tiktok.com/marketing_api/docs?id=1771105753792513"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto self-center"
            >
              <ExternalLink size={11} /> TikTok API Docs
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Leads</p>
                <p className="text-xl font-bold mt-1">{leads.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950">
                <Users size={16} className="text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">New</p>
                <p className="text-xl font-bold mt-1 text-amber-600">{newCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                <AlertCircle size={16} className="text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Converted</p>
                <p className="text-xl font-bold mt-1 text-green-600">{convertedCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle2 size={16} className="text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Postbacks Sent</p>
                <p className="text-xl font-bold mt-1 text-blue-600">{postbackCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <TrendingUp size={16} className="text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Leads</CardTitle>
            <div className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name/email..."
                className="h-8 w-48 text-xs"
              />
              <Select value={leadFilter} onValueChange={setLeadFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="new" className="text-xs">New</SelectItem>
                  <SelectItem value="contacted" className="text-xs">Contacted</SelectItem>
                  <SelectItem value="converted" className="text-xs">Converted</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {leadsLoading ? (
            <Skeleton className="h-48 m-4" />
          ) : leads.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                No leads yet. Connect TikTok and add the webhook URL to start receiving leads.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Postback</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead: any) => (
                    <TableRow key={lead.id} className="cursor-pointer" onClick={() => setViewLead(lead)}>
                      <TableCell className="font-medium text-xs">{lead.customerName || "—"}</TableCell>
                      <TableCell className="text-xs">{lead.customerEmail || "—"}</TableCell>
                      <TableCell className="text-xs">{lead.customerPhone || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{lead.campaignId ? lead.campaignId.slice(0, 12) : "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            lead.status === "new" ? "bg-amber-100 text-amber-700" :
                            lead.status === "converted" ? "bg-green-100 text-green-700" :
                            lead.status === "contacted" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                          }`}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.postbackSent ? (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                            <Send size={9} className="mr-1" /> {lead.postbackType}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {lead.status === "new" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleLeadStatus(lead, "contacted")}
                            >
                              Contact
                            </Button>
                          )}
                          {lead.status !== "converted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-600 hover:bg-green-50"
                              onClick={() => handleLeadStatus(lead, "converted")}
                            >
                              Convert
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead detail dialog */}
      <Dialog open={!!viewLead} onOpenChange={(v) => !v && setViewLead(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {viewLead && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Name</p>
                  <p className="text-xs font-medium">{viewLead.customerName || "—"}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Email</p>
                  <p className="text-xs font-medium">{viewLead.customerEmail || "—"}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Phone</p>
                  <p className="text-xs font-medium">{viewLead.customerPhone || "—"}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Status</p>
                  <p className="text-xs font-medium capitalize">{viewLead.status}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Campaign ID</p>
                  <p className="text-xs font-mono">{viewLead.campaignId || "—"}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Ad ID</p>
                  <p className="text-xs font-mono">{viewLead.adId || "—"}</p>
                </div>
                <div className="bg-muted rounded p-2 col-span-2">
                  <p className="text-[10px] text-muted-foreground">TikTok Lead ID</p>
                  <p className="text-xs font-mono">{viewLead.leadId}</p>
                </div>
              </div>
              {viewLead.extraFields && viewLead.extraFields !== "{}" && (
                <div>
                  <p className="text-xs font-medium mb-1">Extra Fields</p>
                  <pre className="text-[10px] bg-muted rounded p-2 overflow-x-auto">{viewLead.extraFields}</pre>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t">
                {viewLead.status !== "converted" && (
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleLeadStatus(viewLead, "converted");
                      setViewLead(null);
                    }}
                  >
                    <CheckCircle2 size={14} /> Mark Converted
                  </Button>
                )}
                {viewLead.status === "new" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      handleLeadStatus(viewLead, "contacted");
                      setViewLead(null);
                    }}
                  >
                    Mark Contacted
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdvertisingTab — TikTok Marketing API dashboard (campaigns, performance, audit)
// ---------------------------------------------------------------------------

function AdvertisingTab({ configured }: { configured: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [perfLevel, setPerfLevel] = React.useState<"CAMPAIGN" | "ADGROUP" | "AD">("CAMPAIGN");

  const { data: advertiserData, isLoading: advLoading } = useQuery({
    queryKey: ["tiktok-advertiser"],
    queryFn: () => api.tiktokAdvertiser(),
    enabled: configured,
    staleTime: 60_000,
  });
  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ["tiktok-performance", perfLevel],
    queryFn: () => api.tiktokPerformance({ level: perfLevel, startDate: weekAgo, endDate: today }),
    enabled: configured,
    staleTime: 60_000,
  });
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["tiktok-audit"],
    queryFn: () => api.tiktokAudit(),
    enabled: configured,
    staleTime: 120_000,
  });

  if (!configured) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Share2 size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            Connect TikTok in the Leads &amp; Postbacks tab to view advertising data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const perfRows = perfData?.list || [];
  const totalSpend = perfRows.reduce((s: number, r: any) => s + Number(r?.stat?.spend ?? 0), 0);
  const totalImpressions = perfRows.reduce((s: number, r: any) => s + Number(r?.stat?.impressions ?? 0), 0);
  const totalClicks = perfRows.reduce((s: number, r: any) => s + Number(r?.stat?.clicks ?? 0), 0);
  const totalConversions = perfRows.reduce((s: number, r: any) => s + Number(r?.stat?.conversion ?? 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
  const cpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0";

  const audit = auditData;
  const wastedCount = audit?.wastedCampaigns?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Advertiser info */}
      {advLoading ? (
        <Skeleton className="h-20" />
      ) : advertiserData ? (
        <Card className="border-pink-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold">{advertiserData.name || "TikTok Advertiser"}</p>
                <p className="text-xs text-muted-foreground">
                  ID: {advertiserData.id} · {advertiserData.currency || "USD"} · {advertiserData.country || "—"}
                  {advertiserData.industry ? ` · ${advertiserData.industry}` : ""}
                </p>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {advertiserData.status === "STATUS_ENABLE" ? "Active" : advertiserData.status || "—"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Performance stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Spend (7d)</p>
            <p className="text-xl font-bold mt-1">${totalSpend.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Impressions</p>
            <p className="text-xl font-bold mt-1">{totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Clicks</p>
            <p className="text-xl font-bold mt-1">{totalClicks.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">CTR / CPC</p>
            <p className="text-xl font-bold mt-1">{ctr}% / ${cpc}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Conversions</p>
            <p className="text-xl font-bold mt-1 text-green-600">{totalConversions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Wasted spend audit */}
      <Card className={wastedCount > 0 ? "border-red-500/30" : "border-green-500/30"}>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle size={16} className={wastedCount > 0 ? "text-red-500" : "text-green-500"} />
            Wasted Spend Audit (30 days)
            {auditLoading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {audit ? (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span>Total spend: <strong>${audit.totalSpend?.toFixed(2) || "0"}</strong></span>
                <span>Conversions: <strong>{audit.totalConversions || 0}</strong></span>
                <span className={wastedCount > 0 ? "text-red-600" : "text-green-600"}>
                  Wasted campaigns: <strong>{wastedCount}</strong>
                </span>
              </div>
              {wastedCount > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Campaigns with spend &gt; $5 but 0 conversions:</p>
                  {audit.wastedCampaigns?.slice(0, 10).map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                      <div>
                        <p className="font-medium">{c.campaignName || c.campaignId}</p>
                        <p className="text-muted-foreground font-mono">{c.campaignId}</p>
                      </div>
                      <span className="font-semibold text-red-600">${c.spend.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-green-600">No wasted spend detected — all campaigns have conversions.</p>
              )}
            </div>
          ) : auditLoading ? (
            <Skeleton className="h-16" />
          ) : (
            <p className="text-xs text-muted-foreground">Audit data unavailable.</p>
          )}
        </CardContent>
      </Card>

      {/* Performance breakdown table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Performance Breakdown (7 days)</CardTitle>
            <Select value={perfLevel} onValueChange={(v) => setPerfLevel(v as any)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAMPAIGN" className="text-xs">Campaign</SelectItem>
                <SelectItem value="ADGROUP" className="text-xs">Ad Group</SelectItem>
                <SelectItem value="AD" className="text-xs">Ad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {perfLoading ? (
            <Skeleton className="h-48 m-4" />
          ) : perfRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No performance data for the last 7 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>Conversions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfRows.map((row: any, i: number) => {
                    const s = row?.stat || {};
                    const id = row?.campaign_id || row?.adgroup_id || row?.ad_id || `Row ${i + 1}`;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{id}</TableCell>
                        <TableCell className="text-xs font-semibold">${Number(s.spend || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-xs">{Number(s.impressions || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{Number(s.clicks || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{Number(s.ctr || 0).toFixed(2)}%</TableCell>
                        <TableCell className="text-xs">${Number(s.cpc || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-semibold text-green-600">{Number(s.conversion || 0)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// McpConsoleTab — call TikTok's hosted MCP server directly from PlayBeat
// ---------------------------------------------------------------------------

const MCP_SERVER_URL = "https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat";

function McpConsoleTab({ configured }: { configured: boolean }) {
  const [response, setResponse] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedTool, setSelectedTool] = React.useState("");
  const [toolArgs, setToolArgs] = React.useState("{}");
  const [toolsList, setToolsList] = React.useState<any[]>([]);
  const [loadingTools, setLoadingTools] = React.useState(false);

  // Fetch the MCP tools list when configured.
  const fetchTools = async () => {
    setLoadingTools(true);
    try {
      const res = await api.tiktokMcp({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      });
      const tools = res.mcpResponse?.result?.tools || [];
      setToolsList(tools);
      if (tools.length > 0 && !selectedTool) setSelectedTool(tools[0].name);
    } catch (e: any) {
      setResponse({ error: e?.message || "Failed to list MCP tools" });
    } finally {
      setLoadingTools(false);
    }
  };

  React.useEffect(() => {
    if (configured && toolsList.length === 0) {
      fetchTools();
    }
  }, [configured]);

  const callTool = async () => {
    if (!selectedTool) return;
    let args: any = {};
    try {
      args = JSON.parse(toolArgs);
    } catch {
      setResponse({ error: "Invalid JSON in arguments field" });
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      const res = await api.tiktokMcp({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: selectedTool, arguments: args },
      });
      setResponse(res.mcpResponse);
    } catch (e: any) {
      setResponse({ error: e?.message || "MCP call failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Share2 size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            Connect TikTok in the Leads &amp; Postbacks tab to use the MCP Console.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-pink-500/20">
        <CardHeader className="border-b bg-pink-50/50 dark:bg-pink-950/20">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 size={16} className="text-pink-500" />
            TikTok MCP Console
            <Badge variant="outline" className="text-[10px]">Hosted MCP Server</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="rounded-lg border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">MCP Server:</strong>{" "}
            <span className="font-mono break-all">{MCP_SERVER_URL}</span>
            <p className="mt-1">
              This is TikTok&apos;s official hosted MCP server. It exposes the same advertising tools as the
              Marketing API through the Model Context Protocol (JSON-RPC). Your access token is sent as the
              Authorization header — no separate MCP client needed.
            </p>
          </div>

          {/* Tools list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Available MCP Tools ({toolsList.length})</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={fetchTools} disabled={loadingTools}>
                {loadingTools ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Refresh
              </Button>
            </div>
            {loadingTools ? (
              <Skeleton className="h-16" />
            ) : toolsList.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded p-3">
                No tools returned. Make sure your access token has Marketing API permissions.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded border p-2 space-y-1">
                {toolsList.map((tool: any) => (
                  <button
                    key={tool.name}
                    onClick={() => setSelectedTool(tool.name)}
                    className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors ${
                      selectedTool === tool.name
                        ? "bg-pink-600 text-white"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="font-mono font-medium">{tool.name}</span>
                    {tool.description && (
                      <span className={`block text-[10px] mt-0.5 ${selectedTool === tool.name ? "text-white/70" : "text-muted-foreground"}`}>
                        {tool.description.slice(0, 100)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tool call */}
          {selectedTool && (
            <div className="space-y-2">
              <Label className="text-xs">Call: <span className="font-mono text-pink-600">{selectedTool}</span></Label>
              <div>
                <Label className="text-xs text-muted-foreground">Arguments (JSON)</Label>
                <Textarea
                  value={toolArgs}
                  onChange={(e) => setToolArgs(e.target.value)}
                  rows={4}
                  className="text-xs font-mono"
                  placeholder='{}'
                />
              </div>
              <Button onClick={callTool} disabled={loading} className="gap-1.5">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? "Calling..." : "Call MCP Tool"}
              </Button>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-1">
              <Label className="text-xs">Response</Label>
              <pre className="text-[11px] bg-muted rounded p-3 overflow-x-auto max-h-80 overflow-y-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoginKitTab — TikTok Login Kit ("Login with TikTok" for user content APIs)
// Implements: https://developers.tiktok.com/doc/oauth-user-access-token-management
// ---------------------------------------------------------------------------

const AVAILABLE_SCOPES = [
  { value: "user.info.basic", label: "user.info.basic — Basic profile" },
  { value: "user.info.profile", label: "user.info.profile — Full profile" },
  { value: "user.info.stats", label: "user.info.stats — Follower/like stats" },
  { value: "video.list", label: "video.list — List user's videos" },
  { value: "video.publish", label: "video.publish — Publish videos" },
  { value: "video.upload", label: "video.upload — Upload videos" },
  { value: "comment.list", label: "comment.list — List comments" },
];

function LoginKitTab() {
  const qc = useQueryClient();
  const [lkForm, setLkForm] = React.useState({
    clientKey: "",
    clientSecret: "",
    redirectUri: "",
    scopes: ["user.info.basic", "user.info.profile", "user.info.stats", "video.list"],
  });
  const [lkSaving, setLkSaving] = React.useState(false);
  const [lkConnecting, setLkConnecting] = React.useState(false);

  const { data: lkConfig, isLoading: lkLoading } = useQuery({
    queryKey: ["tiktok-loginkit"],
    queryFn: () => api.tiktokLoginKitConfig(),
    staleTime: 30_000,
  });
  const lkConfigured = lkConfig?.configured === true;
  const lkConnected = lkConfig?.connected === true;

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["tiktok-loginkit-user"],
    queryFn: () => api.tiktokLoginKitUser(),
    enabled: lkConnected,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (lkConfig?.configured) {
      setLkForm((f) => ({
        ...f,
        clientKey: lkConfig.clientKey || "",
        redirectUri: lkConfig.redirectUri || "",
        scopes: lkConfig.scopes || f.scopes,
        clientSecret: "", // never echo back
      }));
    } else if (typeof window !== "undefined") {
      setLkForm((f) => ({
        ...f,
        redirectUri: `${window.location.origin}/api/v1/tiktok/loginkit/callback`,
      }));
    }
  }, [lkConfig]);

  // Check URL for Login Kit callback params
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("tiktok_loginkit_success");
      const err = params.get("tiktok_loginkit_error");
      if (success) {
        toast.success(success);
        qc.invalidateQueries({ queryKey: ["tiktok-loginkit"] });
        window.history.replaceState({}, "", "/wp-admin?tiktok=tiktok");
      }
      if (err) {
        toast.error(`Login Kit: ${err}`);
        window.history.replaceState({}, "", "/wp-admin?tiktok=tiktok");
      }
    }
  }, [qc]);

  const handleSaveLk = async () => {
    if (!lkForm.clientKey || !lkForm.clientSecret) {
      toast.error("Client Key and Client Secret are required");
      return;
    }
    setLkSaving(true);
    try {
      const res = await api.tiktokLoginKitSave({
        clientKey: lkForm.clientKey,
        clientSecret: lkForm.clientSecret,
        redirectUri: lkForm.redirectUri || undefined,
        scopes: lkForm.scopes,
      });
      toast.success(res.message || "Login Kit config saved");
      setLkForm((f) => ({ ...f, clientSecret: "" }));
      qc.invalidateQueries({ queryKey: ["tiktok-loginkit"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setLkSaving(false);
    }
  };

  const handleLkConnect = async () => {
    setLkConnecting(true);
    try {
      const res = await api.tiktokLoginKitConnect();
      if (res.authorizeUrl) {
        window.location.href = res.authorizeUrl;
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to start Login Kit flow");
    } finally {
      setLkConnecting(false);
    }
  };

  const handleLkDisconnect = async () => {
    if (!confirm("Disconnect TikTok Login Kit?")) return;
    try {
      await api.tiktokLoginKitClear();
      toast.success("Login Kit disconnected");
      qc.invalidateQueries({ queryKey: ["tiktok-loginkit"] });
      qc.invalidateQueries({ queryKey: ["tiktok-loginkit-user"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to disconnect");
    }
  };

  const toggleScope = (scope: string) => {
    setLkForm((f) => ({
      ...f,
      scopes: f.scopes.includes(scope)
        ? f.scopes.filter((s) => s !== scope)
        : [...f.scopes, scope],
    }));
  };

  return (
    <div className="space-y-4">
      <Card className="border-pink-500/30">
        <CardHeader className="border-b bg-pink-50/50 dark:bg-pink-950/20">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 size={16} className="text-pink-500" />
            TikTok Login Kit
            {lkConnected && (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                <CheckCircle2 size={10} className="mr-1" /> Connected
              </Badge>
            )}
            {lkConfigured && !lkConnected && (
              <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                Configured — not authorized
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="rounded-lg border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Login Kit vs Marketing API:</strong>{" "}
            Login Kit uses <span className="font-mono">open.tiktokapis.com</span> endpoints with
            <span className="font-mono"> client_key</span> + <span className="font-mono">client_secret</span> from
            <a href="https://developers.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-0.5">
              {" "}developers.tiktok.com <ExternalLink size={10} />
            </a>.
            It returns an <span className="font-mono">open_id</span> (user identity) + 24h access token + 365d refresh token.
            Use this for "Login with TikTok", user profiles, and video content APIs.
          </div>

          {/* Connected user info */}
          {lkConnected && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-2">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Logged in as TikTok user
              </p>
              {userLoading ? (
                <Skeleton className="h-16" />
              ) : userData?.user ? (
                <div className="flex items-center gap-3">
                  {userData.user.avatar_url && (
                    <img
                      src={userData.user.avatar_url}
                      alt="avatar"
                      className="size-12 rounded-full border"
                    />
                  )}
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-sm">{userData.user.display_name || userData.user.username || "TikTok User"}</p>
                    {userData.user.username && <p className="text-muted-foreground">@{userData.user.username}</p>}
                    <div className="flex gap-3 text-muted-foreground">
                      {userData.user.follower_count != null && <span>{Number(userData.user.follower_count).toLocaleString()} followers</span>}
                      {userData.user.following_count != null && <span>{Number(userData.user.following_count).toLocaleString()} following</span>}
                      {userData.user.likes_count != null && <span>{Number(userData.user.likes_count).toLocaleString()} likes</span>}
                    </div>
                    <p className="text-muted-foreground font-mono text-[10px] mt-1">open_id: {userData.openId}</p>
                  </div>
                </div>
              ) : null}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => qc.invalidateQueries({ queryKey: ["tiktok-loginkit-user"] })}>
                  Refresh Profile
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={handleLkDisconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          {/* Config form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Client Key *</Label>
              <Input
                value={lkForm.clientKey}
                onChange={(e) => setLkForm({ ...lkForm, clientKey: e.target.value })}
                placeholder="e.g. aw1234567890abcdef"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Client Secret {lkConfigured ? "(leave blank to keep)" : "*"}</Label>
              <Input
                type="password"
                value={lkForm.clientSecret}
                onChange={(e) => setLkForm({ ...lkForm, clientSecret: e.target.value })}
                placeholder={lkConfigured ? "•••••••• (saved)" : "Your client secret"}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Redirect URI</Label>
              <Input
                value={lkForm.redirectUri}
                onChange={(e) => setLkForm({ ...lkForm, redirectUri: e.target.value })}
                placeholder="https://playbeat.digital/api/v1/tiktok/loginkit/callback"
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Must match the redirect URI configured in your TikTok app at developers.tiktok.com.
              </p>
            </div>
          </div>

          {/* Scopes */}
          <div className="space-y-2">
            <Label className="text-xs">Scopes (permissions to request)</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SCOPES.map((scope) => (
                <button
                  key={scope.value}
                  onClick={() => toggleScope(scope.value)}
                  title={scope.label}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-mono border transition-colors ${
                    lkForm.scopes.includes(scope.value)
                      ? "bg-pink-600 text-white border-pink-600"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {scope.value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveLk} disabled={lkSaving} variant="outline" className="gap-1.5">
              {lkSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {lkConfigured ? "Update Config" : "Save Config"}
            </Button>
            {lkConfigured && !lkConnected && (
              <Button onClick={handleLkConnect} disabled={lkConnecting} className="gap-1.5 bg-pink-600 hover:bg-pink-700">
                {lkConnecting ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                Login with TikTok
              </Button>
            )}
            {lkConnected && (
              <Button onClick={handleLkConnect} disabled={lkConnecting} variant="outline" className="gap-1.5">
                {lkConnecting ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                Re-authorize
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
