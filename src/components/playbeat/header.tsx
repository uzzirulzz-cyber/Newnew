"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Music2,
  Search,
  ShoppingCart,
  ShoppingBag,
  Bell,
  Sun,
  Moon,
  Menu,
  Store,
  Share2,
  BarChart3,
  Shield,
  LayoutDashboard,
  LogIn,
  LogOut,
  Loader2,
  CheckCircle2,
  Home,
  Gamepad2,
  Gift,
  KeyRound,
  RefreshCw,
  Sparkles,
  Tag,
  TrendingUp,
  type LucideIcon as LucideIconType,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { usePlaybeatStore, visibleTabs, type TabKey } from "@/lib/store";
import { api, type Notification, formatDate } from "@/lib/api-client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const TABS: Array<{ key: TabKey; label: string; icon: typeof Store }> = [
  { key: "marketplace", label: "Marketplace", icon: Store },
  { key: "vendor", label: "Vendor Studio", icon: LayoutDashboard },
  { key: "affiliate", label: "Affiliate Hub", icon: Share2 },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "admin", label: "Admin", icon: Shield },
];

function Logo() {
  return (
    <div className="flex items-center gap-2 cursor-pointer select-none">
      <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
        <Music2 className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold tracking-tight">
        Play<span className="pb-text-gradient">Beat</span>
      </span>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <Sun className="size-4" />
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}

function NotificationsBell() {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications(),
    staleTime: 30_000,
  });
  const items: Notification[] = data?.items ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <Badge className="bg-accent text-accent-foreground">
              {unread} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto pb-scrollbar">
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-1 py-2"
              >
                <div className="flex w-full items-center gap-2">
                  {!n.read && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SignInDialog() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("demo@playbeat.io");
  const [password, setPassword] = React.useState("playbeat123");
  const [loading, setLoading] = React.useState(false);
  const setUser = usePlaybeatStore((s) => s.setUser);
  const setActiveTab = usePlaybeatStore((s) => s.setActiveTab);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await api.login(email, password);
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const user = usePlaybeatStore((s) => s.user);

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline max-w-[120px] truncate">
              {user.name}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
            <Badge
              variant="outline"
              className="mt-1 w-fit text-[10px] uppercase"
            >
              {user.role}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              setUser(null);
              setActiveTab("marketplace");
              toast.success("Signed out");
            }}
          >
            <LogOut className="size-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <LogIn className="size-4" />
          <span className="hidden sm:inline">Sign in</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to PlayBeat</DialogTitle>
          <DialogDescription>
            Sign in to manage your purchases, reviews and affiliates. Try the
            demo account below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="size-3.5 text-primary" />
              Demo accounts
            </div>
            <div className="mt-1 font-mono leading-relaxed">
              <div>demo@playbeat.io / playbeat123</div>
              <div>admin@playbeat.io / playbeat123</div>
            </div>
            <p className="mt-1.5 text-[11px]">
              Sign in as admin to reveal Vendor, Affiliate, Analytics &amp;
              Admin controls.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleLogin} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CartButton() {
  const setCartOpen = usePlaybeatStore((s) => s.setCartOpen);
  const count = usePlaybeatStore((s) => s.cartCount());
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Open cart"
      onClick={() => setCartOpen(true)}
      className="relative"
    >
      <ShoppingBag className="size-4" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Button>
  );
}

// Category nav links — match the playbeatdigital.world storefront layout.
// Each link drives the Marketplace filter (category slug or sort order).
const NAV_LINKS: Array<{
  label: string;
  category?: string;
  sort?: string;
  icon: LucideIconType;
}> = [
  { label: "Home", icon: Home },
  { label: "Games", category: "games", icon: Gamepad2 },
  { label: "Gift Cards", category: "gift-cards", icon: Gift },
  { label: "Software", category: "software-licenses", icon: KeyRound },
  { label: "AI Tools", category: "ai-tools", icon: Sparkles },
  { label: "Subscriptions", category: "saas-subscriptions", icon: RefreshCw },
  { label: "Best Value", sort: "price_asc", icon: Tag },
  { label: "Trending", sort: "popular", icon: TrendingUp },
];

export function Header() {
  const activeTab = usePlaybeatStore((s) => s.activeTab);
  const setActiveTab = usePlaybeatStore((s) => s.setActiveTab);
  const searchQuery = usePlaybeatStore((s) => s.searchQuery);
  const setSearchQuery = usePlaybeatStore((s) => s.setSearchQuery);
  const user = usePlaybeatStore((s) => s.user);
  const navCategory = usePlaybeatStore((s) => s.navCategory);
  const navSort = usePlaybeatStore((s) => s.navSort);
  const setNavFilter = usePlaybeatStore((s) => s.setNavFilter);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Role-aware tab list: the public storefront only shows Marketplace.
  // Operator tabs (Vendor/Affiliate/Analytics/Admin) appear only when the
  // signed-in user has the matching role.
  const tabs = TABS.filter((t) => visibleTabs(user?.role).includes(t.key));

  const goNav = (link: (typeof NAV_LINKS)[number]) => {
    setActiveTab("marketplace");
    setNavFilter(link.category ?? "", link.sort ?? "popular");
    setMobileOpen(false);
  };

  // Determine the active nav link for highlight state
  const isNavActive = (link: (typeof NAV_LINKS)[number]) => {
    if (link.label === "Home") return !navCategory && (!navSort || navSort === "popular");
    if (link.category) return navCategory === link.category;
    if (link.sort) return !navCategory && navSort === link.sort;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Mobile hamburger — always shown on mobile (category nav + operator tabs) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto pb-scrollbar">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 p-2">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Store
              </p>
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const active = isNavActive(link);
                return (
                  <button
                    key={link.label}
                    onClick={() => goNav(link)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {link.label}
                  </button>
                );
              })}
              {tabs.length > 1 && (
                <>
                  <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Operator
                  </p>
                  {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => {
                          setActiveTab(t.key);
                          setMobileOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          activeTab === t.key
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Logo />

        {/* Desktop operator tabs — hidden for anonymous customers (public
            storefront must not show admin/operator controls). Revealed only
            when the signed-in user has access to more than the Marketplace. */}
        {tabs.length > 1 && (
          <nav className="mx-auto hidden md:flex items-center gap-1 rounded-full border border-border bg-card/40 p-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        )}
        {/* Spacer keeps right-aligned actions in place when nav is hidden */}
        {tabs.length <= 1 && <div className="mx-auto hidden md:block" />}

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <NotificationsBell />
          <CartButton />
          <SignInDialog />
        </div>
      </div>

      {/* Category nav bar — matches playbeatdigital.world storefront. Always
          visible on desktop; drives the Marketplace filters. */}
      <div className="hidden border-t border-border/60 bg-background/60 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = isNavActive(link);
            return (
              <button
                key={link.label}
                onClick={() => goNav(link)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <Icon className="size-3.5" />
                {link.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search row — only on marketplace */}
      {activeTab === "marketplace" && (
        <div className="border-t border-border/60 bg-background/60">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
            <Search className="size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search game keys, AI tools, gift cards, software..."
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
            <span className="hidden sm:inline text-xs text-muted-foreground">
              Press Enter to search
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
