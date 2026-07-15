"use client";

import * as React from "react";
import {
  Music2,
  Mail,
  Github,
  Twitter,
  Home,
  Gamepad2,
  Gift,
  KeyRound,
  Sparkles,
  RefreshCw,
  Tag,
  TrendingUp,
  MessageCircle,
  MapPin,
  Clock,
  Smartphone,
  Send,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlaybeatStore } from "@/lib/store";
import { toast } from "sonner";
import { LogoMark, LogoWordmark } from "./logo";

interface NavLink {
  label: string;
  category?: string;
  sort?: string;
  icon: LucideIcon;
}

// Matches the playbeatdigital.world footer "Quick Links" + "Categories" columns
const QUICK_LINKS: NavLink[] = [
  { label: "Home", icon: Home },
  { label: "Games", category: "games", icon: Gamepad2 },
  { label: "Gift Cards", category: "gift-cards", icon: Gift },
  { label: "Software", category: "software-licenses", icon: KeyRound },
  { label: "AI Tools", category: "ai-tools", icon: Sparkles },
  { label: "Subscriptions", category: "saas-subscriptions", icon: RefreshCw },
  { label: "Best Value", sort: "price_asc", icon: Tag },
  { label: "Trending", sort: "popular", icon: TrendingUp },
];

const CATEGORY_LINKS: NavLink[] = [
  { label: "Games", category: "games", icon: Gamepad2 },
  { label: "Gift Cards", category: "gift-cards", icon: Gift },
  { label: "Software", category: "software-licenses", icon: KeyRound },
  { label: "AI Tools", category: "ai-tools", icon: Sparkles },
  { label: "Subscriptions", category: "saas-subscriptions", icon: RefreshCw },
  { label: "Top-Up", category: "memberships", icon: Smartphone },
];

// Payment methods accepted — JazzCash (default) + PayPal + cryptocurrency
const PAYMENTS = [
  "Bank Alfalah",
  "Easypaisa",
  "PayPal",
  "Bitcoin (BTC)",
  "Ethereum (ETH)",
  "Tether (USDT)",
  "USD Coin (USDC)",
];

function FooterLink({
  link,
  onNavigate,
}: {
  link: NavLink;
  onNavigate: (link: NavLink) => void;
}) {
  const Icon = link.icon;
  return (
    <li>
      <button
        onClick={() => onNavigate(link)}
        className="group flex items-center gap-2 text-left text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <Icon className="size-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
        {link.label}
      </button>
    </li>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

export function Footer() {
  const [email, setEmail] = React.useState("");
  const setActiveTab = usePlaybeatStore((s) => s.setActiveTab);
  const setNavFilter = usePlaybeatStore((s) => s.setNavFilter);

  const navigate = (link: NavLink) => {
    setActiveTab("marketplace");
    setNavFilter(link.category ?? "", link.sort ?? "popular");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Subscribed! Watch your inbox for PlayBeat drops.");
    setEmail("");
  };

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border">
      {/* Brand background image with heavy dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url(/brand/brand-6.jpg)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/92 to-background/98" />
      <div className="absolute inset-0 bg-background/60" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand + newsletter */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <LogoMark size={36} />
              <span className="text-lg font-extrabold tracking-tight lowercase">
                <LogoWordmark />
                <span className="text-accent">.digital</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Pakistan&apos;s premier digital marketplace for game keys, software
              licenses, AI tools, and gift cards. Instant delivery. Trusted by
              thousands.
            </p>
            <form onSubmit={subscribe} className="mt-4 flex max-w-sm gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="h-9"
                aria-label="Newsletter email"
              />
              <Button type="submit" size="sm" className="shrink-0">
                <Mail className="size-3.5" />
                Subscribe
              </Button>
            </form>

            {/* Contact block */}
            <div className="mt-5 space-y-2 text-sm">
              <a
                href="https://wa.me/923321029333"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp: 0332 102 9333
              </a>
              <a
                href="mailto:info@playbeat.digital"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-3.5" />
                info@playbeat.digital (General)
              </a>
              <a
                href="mailto:support@playbeat.digital"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-3.5" />
                support@playbeat.digital (Support)
              </a>
              <a
                href="mailto:director@playbeat.digital"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-3.5" />
                director@playbeat.digital (Director)
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-3.5" />
                Pakistan
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5" />
                24/7 Instant Delivery
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <FooterColumn title="Quick Links">
            {QUICK_LINKS.map((l) => (
              <FooterLink key={l.label} link={l} onNavigate={navigate} />
            ))}
          </FooterColumn>

          {/* Categories */}
          <FooterColumn title="Categories">
            {CATEGORY_LINKS.map((l) => (
              <FooterLink key={l.label} link={l} onNavigate={navigate} />
            ))}
          </FooterColumn>

          {/* Download app + trust */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Download Our App
            </h4>
            <p className="mt-3 text-sm text-muted-foreground">
              Install on your phone for instant access &amp; live updates.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2"
              onClick={() => toast.message("App download — coming soon")}
            >
              <Smartphone className="size-3.5" />
              Download Now
            </Button>
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Shield className="size-3.5 text-primary" />
                Secure Checkout
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                All payments processed by Lemon Squeezy. PCI-DSS compliant.
              </p>
            </div>
          </div>
        </div>

        {/* We Accept */}
        <div className="mt-10 border-t border-border/60 pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            We Accept
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="rounded-md border border-border bg-background/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 PlayBeat.Digital. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <a
              href="/privacy"
              className="transition-colors hover:text-primary"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="transition-colors hover:text-primary"
            >
              Terms
            </a>
            <a
              href="/refund-policy"
              className="transition-colors hover:text-primary"
            >
              Refund Policy
            </a>
            <a
              href="/admin"
              className="cursor-pointer text-[10px] uppercase transition-colors hover:text-primary"
            >
              Admin
            </a>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="GitHub" asChild>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.message("GitHub — coming soon");
                }}
              >
                <Github className="size-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Twitter / X" asChild>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.message("Twitter / X — coming soon");
                }}
              >
                <Twitter className="size-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Contact us"
              asChild
            >
              <a href="mailto:info@playbeat.digital">
                <Send className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
