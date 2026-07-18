"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  Settings,
  ScrollText,
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Ban,
  UserCheck,
  BadgeCheck,
  CreditCard,
  Building2,
  Loader2,
  Save,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import {
  api,
  formatMoney,
  formatDate,
  formatNumber,
  type AdminUser,
  type Notification,
} from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-rose-500/15 text-rose-400",
  VENDOR: "bg-amber-400/15 text-amber-300",
  CUSTOMER: "bg-primary/15 text-primary",
  AFFILIATE: "bg-cyan-500/15 text-cyan-300",
};

// Mock pending approvals
const MOCK_PENDING = [
  {
    id: "p1",
    title: "Stripe Connect Integration Kit",
    vendor: "PayBridge Labs",
    type: "PAYMENT_GATEWAY",
    submitted: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "p2",
    title: "CryptoPay Gateway",
    vendor: "PayBridge Labs",
    type: "PAYMENT_GATEWAY",
    submitted: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "p3",
    title: "Razorpay Route Integration",
    vendor: "PayBridge Labs",
    type: "PAYMENT_GATEWAY",
    submitted: "2026-06-30T16:15:00.000Z",
  },
  {
    id: "p4",
    title: "Neon Drift Racer",
    vendor: "Lumen Games",
    type: "GAME",
    submitted: "2026-06-30T11:20:00.000Z",
  },
  {
    id: "p5",
    title: "ResumeBoost AI Coach",
    vendor: "NovaLabs",
    type: "AI_TOOL",
    submitted: "2026-06-29T14:30:00.000Z",
  },
  {
    id: "p6",
    title: "Crypto Dashboard Kit",
    vendor: "PixelCraft Studio",
    type: "TEMPLATE",
    submitted: "2026-06-28T09:15:00.000Z",
  },
];

const MOCK_AUDIT = [
  {
    id: "a1",
    actor: "Admin User",
    action: "approved product",
    target: "NovaScript AI Writer",
    at: "2026-06-30T14:22:00.000Z",
  },
  {
    id: "a2",
    actor: "System",
    action: "processed refund for",
    target: "order #PB-1019",
    at: "2026-06-30T11:08:00.000Z",
  },
  {
    id: "a3",
    actor: "Admin User",
    action: "verified vendor",
    target: "SecureStack",
    at: "2026-06-29T16:45:00.000Z",
  },
  {
    id: "a4",
    actor: "Admin User",
    action: "created coupon",
    target: "AI50 (50% off, min $80)",
    at: "2026-06-28T10:00:00.000Z",
  },
  {
    id: "a5",
    actor: "System",
    action: "auto-flagged review on",
    target: "SheetFlow Automation",
    at: "2026-06-27T22:11:00.000Z",
  },
];

function UserRow({ user }: { user: AdminUser }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="line-clamp-1 text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn("text-[10px]", ROLE_BADGE[user.role] || "bg-muted text-muted-foreground")}>
          {user.role.toLowerCase()}
        </Badge>
      </TableCell>
      <TableCell>
        {user.verified ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <XCircle className="size-4 text-muted-foreground" />
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{user.orderCount}</TableCell>
      <TableCell className="text-right tabular-nums">{user.reviewCount}</TableCell>
      <TableCell>
        {user.vendor ? (
          <div className="text-xs">
            <div className="font-medium">{user.vendor.storeName}</div>
            <div className="text-muted-foreground">
              {formatMoney(user.vendor.totalRevenue)} revenue
            </div>
          </div>
        ) : user.affiliate ? (
          <div className="text-xs">
            <div className="font-mono font-medium">{user.affiliate.code}</div>
            <div className="text-muted-foreground">
              {formatMoney(user.affiliate.earnings)} earned
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => toast.success(`${user.name} verified`)}
            >
              <UserCheck className="size-3.5" /> Verify user
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.success(`${user.name} promoted to vendor`)}
            >
              <Building2 className="size-3.5" /> Make vendor
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.success(`${user.name} suspended`)}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="size-3.5" /> Suspend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function UsersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.adminUsers(),
    staleTime: 30_000,
  });
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");

  const users: AdminUser[] = data?.items ?? [];
  const filtered = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.vendor?.storeName || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <Card className="bg-card/60 backdrop-blur">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, email, or vendor..."
              className="h-9 pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="VENDOR">Vendor</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {users.length} users
          </span>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto pb-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Reviews</TableHead>
                    <TableHead>Vendor / Affiliate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <UserRow key={u.id} user={u} />
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No users match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalsTab() {
  const [items, setItems] = React.useState(MOCK_PENDING);

  const approve = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product approved & published");
  };
  const reject = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product rejected");
  };

  return (
    <div className="space-y-3">
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm">
            Pending product approvals ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="size-8 text-primary" />
              All caught up — no products waiting for review.
            </div>
          ) : (
            items.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {p.type.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by {p.vendor} · submitted {formatDate(p.submitted)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => reject(p.id)}
                  >
                    <XCircle className="size-3.5" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => approve(p.id)}>
                    <CheckCircle2 className="size-3.5" /> Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab() {
  const [gateways, setGateways] = React.useState({
    STRIPE: true,
    PAYPAL: true,
    PADDLE: false,
    LEMON_SQUEEZY: true,
    CRYPTO: false,
  });
  const [commission, setCommission] = React.useState(15);
  const [currency, setCurrency] = React.useState("PKR");
  const [maintenance, setMaintenance] = React.useState(false);
  const [siteName, setSiteName] = React.useState("PlayBeat Storefront");
  const [saving, setSaving] = React.useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved");
    }, 600);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CreditCard className="size-4 text-primary" />
            Payment gateways
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(gateways).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3"
            >
              <span className="text-sm font-medium">
                {k.charAt(0) + k.slice(1).toLowerCase().replace(/_/g, " ")}
              </span>
              <Switch
                checked={v}
                onCheckedChange={(c) =>
                  setGateways((g) => ({ ...g, [k]: c }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="size-4 text-primary" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Site name</Label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
                <SelectItem value="GBP">GBP — British Pound</SelectItem>
                <SelectItem value="JPY">JPY — Japanese Yen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Default commission rate</Label>
              <span className="text-sm font-bold text-primary">
                {commission}%
              </span>
            </div>
            <Slider
              value={[commission]}
              onValueChange={(v) => setCommission(v[0])}
              min={5}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3">
            <div>
              <div className="text-sm font-medium">Maintenance mode</div>
              <div className="text-xs text-muted-foreground">
                Temporarily disable checkout
              </div>
            </div>
            <Switch checked={maintenance} onCheckedChange={setMaintenance} />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditTab({ notifications }: { notifications: Notification[] }) {
  const auditEvents = [
    ...MOCK_AUDIT.map((a) => ({
      id: a.id,
      actor: a.actor,
      action: a.action,
      target: a.target,
      at: a.at,
      type: "audit" as const,
    })),
    ...notifications.map((n) => ({
      id: n.id,
      actor: "System",
      action: `${n.type.toLowerCase()}:`,
      target: n.message,
      at: n.createdAt,
      type: "notification" as const,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScrollText className="size-4 text-primary" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[480px] overflow-y-auto pb-scrollbar">
          {auditEvents.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
            >
              <div
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md",
                  e.type === "audit"
                    ? "bg-primary/15 text-primary"
                    : "bg-accent/15 text-accent"
                )}
              >
                <Bell className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm">
                  <span className="font-medium">{e.actor}</span>{" "}
                  <span className="text-muted-foreground">{e.action}</span>{" "}
                  <span className="font-medium">{e.target}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(e.at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminConsole() {
  const { data: dash } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.analytics(),
    staleTime: 60_000,
  });
  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications(),
    staleTime: 30_000,
  });

  const summary = dash?.summary;
  const notifications = notifData?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6">
      <div>
        <h2 className="text-2xl font-bold">Admin console</h2>
        <p className="text-sm text-muted-foreground">
          Manage users, review approvals, and configure the platform.
        </p>
      </div>

      {/* Summary mini cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total users", value: summary ? formatNumber(summary.customers + summary.vendors + 1) : "—", icon: Users },
          { label: "Vendors", value: summary ? formatNumber(summary.vendors) : "—", icon: Building2 },
          { label: "Revenue", value: summary ? formatMoney(summary.revenue) : "—", icon: ShieldCheck, accent: true },
          { label: "Reviews", value: summary ? formatNumber(summary.reviews) : "—", icon: BadgeCheck },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-card/60 backdrop-blur">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={cn(
                    "grid size-9 place-items-center rounded-lg",
                    s.accent
                      ? "bg-accent/15 text-accent"
                      : "bg-primary/15 text-primary"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <div className="text-lg font-bold leading-none">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="size-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1.5">
            <BadgeCheck className="size-3.5" /> Approvals
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="size-3.5" /> Settings
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="size-3.5" /> Audit Log
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="approvals" className="mt-4">
          <ApprovalsTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTab notifications={notifications} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
