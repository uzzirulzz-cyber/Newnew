"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  ShoppingCart,
  RefreshCw,
  Ticket,
  Users,
  Headphones,
  Tv,
  DollarSign,
  CreditCard,
  FileText,
  FileText as WordPressIcon,
  Megaphone,
  Image as ImageIcon,
  Layout,
  Search,
  Sparkles,
  Code,
  Plug,
  Shield,
  Settings,
  Smartphone,
  Menu,
  X,
  Bell,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogoMark } from "@/components/playbeat/logo";
import { usePlaybeatStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { AdminDashboard } from "./dashboard";
import { AdminUsers } from "./users";
import { AdminProducts } from "./products";
import { AdminOrders } from "./orders";
import { AdminWooCommerce } from "./woocommerce";
import { AdminWordPress } from "./wordpress";
import { AdminJazzCash } from "./jazzcash";
import { AdminPayments } from "./payments";
import { AdminReports } from "./reports";
import { AdminMarketing } from "./marketing";
import { AdminMedia } from "./media";
import { SimpleModule } from "./simple-module";

type ModuleKey =
  | "dashboard"
  | "analytics"
  | "products"
  | "orders"
  | "woocommerce"
  | "wordpress"
  | "jazzcash"
  | "subscriptions"
  | "coupons"
  | "users"
  | "support"
  | "iptv"
  | "finance"
  | "payments"
  | "reports"
  | "marketing"
  | "media"
  | "website"
  | "seo"
  | "ai"
  | "developer"
  | "integrations"
  | "security"
  | "settings"
  | "mobile";

interface NavGroup {
  label: string;
  items: { key: ModuleKey; label: string; icon: typeof LayoutDashboard }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Commerce",
    items: [
      { key: "products", label: "Products", icon: Package },
      { key: "orders", label: "Orders", icon: ShoppingCart },
      { key: "woocommerce", label: "WooCommerce", icon: ShoppingCart },
      { key: "subscriptions", label: "Subscriptions", icon: RefreshCw },
      { key: "coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    label: "Users & Support",
    items: [
      { key: "users", label: "Users", icon: Users },
      { key: "support", label: "Support", icon: Headphones },
    ],
  },
  {
    label: "IPTV",
    items: [
      { key: "iptv", label: "IPTV Management", icon: Tv },
    ],
  },
  {
    label: "Finance",
    items: [
      { key: "finance", label: "Finance", icon: DollarSign },
      { key: "payments", label: "Payment Gateways", icon: CreditCard },
      { key: "jazzcash", label: "JazzCash", icon: CreditCard },
      { key: "reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Marketing & Content",
    items: [
      { key: "marketing", label: "Marketing", icon: Megaphone },
      { key: "wordpress", label: "WordPress CMS", icon: FileText },
      { key: "media", label: "Media Library", icon: ImageIcon },
      { key: "website", label: "Website Builder", icon: Layout },
      { key: "seo", label: "SEO", icon: Search },
    ],
  },
  {
    label: "System",
    items: [
      { key: "ai", label: "AI Tools", icon: Sparkles },
      { key: "developer", label: "Developer", icon: Code },
      { key: "integrations", label: "Integrations", icon: Plug },
      { key: "security", label: "Security", icon: Shield },
      { key: "settings", label: "Settings", icon: Settings },
      { key: "mobile", label: "Mobile App", icon: Smartphone },
    ],
  },
];

const SIMPLE_MODULES: Record<
  string,
  { title: string; description: string; icon: typeof LayoutDashboard; features: string[] }
> = {
  analytics: {
    title: "Analytics",
    description: "Visitors, revenue, conversion, and traffic insights",
    icon: BarChart3,
    features: [
      "Visitors & Pageviews",
      "Revenue Analytics",
      "Conversion Funnel",
      "Device Breakdown",
      "Browser Stats",
      "Top Countries",
      "Search Keywords",
      "Heatmaps",
      "Customer Lifetime Value",
    ],
  },
  subscriptions: {
    title: "Subscription Management",
    description: "Manage recurring subscription plans and renewals",
    icon: RefreshCw,
    features: [
      "Monthly / Quarterly / Yearly / Lifetime Plans",
      "Trial Periods",
      "Auto Renewal",
      "Grace Periods",
      "Upgrade & Downgrade",
      "Pause & Cancel",
      "Gift Subscriptions",
      "Renewal Reminders",
    ],
  },
  coupons: {
    title: "Coupon System",
    description: "Create and manage discount coupons and promo codes",
    icon: Ticket,
    features: [
      "Percentage Discount",
      "Fixed Discount",
      "Buy One Get One",
      "Referral Coupons",
      "First Order Discount",
      "Flash Sale",
      "Expiry & Usage Limits",
    ],
  },
  support: {
    title: "Customer Support",
    description: "Tickets, live chat, knowledge base, and AI assistant",
    icon: Headphones,
    features: [
      "Live Chat",
      "Support Tickets",
      "Knowledge Base",
      "FAQ Manager",
      "Contact Forms",
      "Chat History",
      "AI Support Assistant",
    ],
  },
  iptv: {
    title: "IPTV Management",
    description: "Manage IPTV channels, playlists, servers, and categories",
    icon: Tv,
    features: [
      "Upload M3U / Xtream / Stalker",
      "Multiple Servers",
      "Channel Categories (Sports, Movies, Series, Kids, News, Music, Radio)",
      "Channel Logos & EPG",
      "Catchup & VOD",
      "Live TV Management",
      "Server Health Monitoring",
      "Playlist Validator",
      "Duplicate Removal",
      "Broken Link Detection",
      "Channel Analytics",
    ],
  },
  finance: {
    title: "Finance",
    description: "Revenue, expenses, taxes, profit, and commission tracking",
    icon: DollarSign,
    features: [
      "Revenue Overview",
      "Expense Tracking",
      "Tax & VAT",
      "Profit Analysis",
      "Refund Management",
      "Wallet System",
      "Affiliate Commission",
      "Vendor Commission",
      "Monthly Reports",
      "Export PDF / Excel",
    ],
  },
  website: {
    title: "Website Builder",
    description: "Drag & drop CMS for pages, menus, and content",
    icon: Layout,
    features: [
      "Homepage Editor",
      "Header & Footer",
      "Hero & Banners",
      "Sliders",
      "Blog CMS",
      "FAQ Manager",
      "Privacy & Terms Pages",
      "Contact & Careers Pages",
    ],
  },
  seo: {
    title: "SEO Management",
    description: "Meta tags, sitemaps, redirects, and link health",
    icon: Search,
    features: [
      "Sitemap Generator",
      "Robots.txt Editor",
      "Meta Titles & Descriptions",
      "Open Graph Tags",
      "Schema.org Markup",
      "Canonical URLs",
      "Redirect Manager",
      "Broken Link Checker",
    ],
  },
  ai: {
    title: "AI Tools",
    description: "AI-powered content generators for your store",
    icon: Sparkles,
    features: [
      "AI Product Writer",
      "AI Blog Generator",
      "AI SEO Generator",
      "AI Email Generator",
      "AI Banner Generator",
      "AI Customer Reply Assistant",
    ],
  },
  developer: {
    title: "Developer Panel",
    description: "API keys, webhooks, documentation, and sandbox",
    icon: Code,
    features: [
      "REST API",
      "GraphQL",
      "API Documentation",
      "Webhooks",
      "API Keys",
      "SDK Downloads",
      "Sandbox Mode",
      "Request Logs",
    ],
  },
  integrations: {
    title: "Integrations",
    description: "Connect third-party services and platforms",
    icon: Plug,
    features: [
      "Google Analytics",
      "Google Tag Manager",
      "Meta Pixel",
      "Cloudflare",
      "Firebase",
      "AWS S3",
      "DigitalOcean Spaces",
      "GitHub",
      "Discord",
      "Telegram",
      "Slack",
    ],
  },
  security: {
    title: "Security",
    description: "Access control, audit logs, and security settings",
    icon: Shield,
    features: [
      "Role-Based Access Control (RBAC)",
      "JWT & OAuth",
      "Two-Factor Authentication",
      "Audit Logs",
      "Login History",
      "API Keys",
      "IP Whitelist",
      "Firewall Rules",
      "Rate Limiting",
      "Backup & Restore",
    ],
  },
  settings: {
    title: "System Settings",
    description: "General config, branding, SMTP, storage, and more",
    icon: Settings,
    features: [
      "General Settings",
      "Branding (Logo, Favicon)",
      "SMTP Configuration",
      "SMS API",
      "Cloud Storage",
      "CDN Settings",
      "API Keys",
      "Languages & Timezone",
      "Currency & Taxes",
    ],
  },
  mobile: {
    title: "Mobile App Management",
    description: "Manage your Android and iOS applications",
    icon: Smartphone,
    features: [
      "Android & iOS Versions",
      "Push Notifications",
      "Splash Screen",
      "App Themes",
      "Deep Linking",
      "OTA Configuration",
    ],
  },
};

function SidebarContent({
  active,
  onSelect,
}: {
  active: ModuleKey;
  onSelect: (k: ModuleKey) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-6">
        <LogoMark size={32} />
        <span className="text-lg font-bold tracking-tight lowercase">
          <span className="text-white">play</span>
          <span className="text-blue-400">beat</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pb-scrollbar px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      isActive ? "text-blue-400" : "text-muted-foreground",
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto size-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
          <div className="grid size-8 place-items-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
            F
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">Founder</p>
            <p className="truncate text-[10px] text-muted-foreground">Admin</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => {
              usePlaybeatStore.getState().setUser(null);
              toast.success("Signed out");
            }}
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminConsole() {
  const [active, setActive] = React.useState<ModuleKey>("dashboard");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const select = (k: ModuleKey) => {
    setActive(k);
    setMobileOpen(false);
  };

  const renderModule = () => {
    switch (active) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <AdminUsers />;
      case "products":
        return <AdminProducts />;
      case "orders":
        return <AdminOrders />;
      case "woocommerce":
        return <AdminWooCommerce />;
      case "wordpress":
        return <AdminWordPress />;
      case "jazzcash":
        return <AdminJazzCash />;
      case "payments":
        return <AdminPayments />;
      case "reports":
        return <AdminReports />;
      case "marketing":
        return <AdminMarketing />;
      case "media":
        return <AdminMedia />;
      default: {
        const mod = SIMPLE_MODULES[active];
        if (mod) {
          return (
            <SimpleModule
              title={mod.title}
              description={mod.description}
              icon={mod.icon}
              features={mod.features}
            />
          );
        }
        return <AdminDashboard />;
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a14]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl lg:block">
        <SidebarContent active={active} onSelect={select} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 border-white/10 bg-black/80 p-0">
          <SidebarContent active={active} onSelect={select} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/10 bg-black/40 px-4 backdrop-blur-xl sm:px-6">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search admin..."
              className="h-9 border-white/10 bg-white/5 pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-blue-400" />
            </Button>
            <Badge className="hidden bg-purple-500/15 text-purple-400 sm:flex">
              ADMIN
            </Badge>
          </div>
        </header>

        {/* Module content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
