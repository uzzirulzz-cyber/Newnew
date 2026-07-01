"use client";

import * as React from "react";
import {
  Music2,
  Mail,
  Github,
  Twitter,
  Store,
  Tags,
  Building2,
  Share2,
  Info,
  BookOpen,
  Briefcase,
  Phone,
  ScrollText,
  Lock,
  Undo2,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FooterCol {
  title: string;
  links: Array<{ label: string; icon: LucideIcon }>;
}

const COLS: FooterCol[] = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse all", icon: Store },
      { label: "Categories", icon: Tags },
      { label: "Vendors", icon: Building2 },
      { label: "Affiliate offers", icon: Share2 },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", icon: Info },
      { label: "Blog", icon: BookOpen },
      { label: "Careers", icon: Briefcase },
      { label: "Contact", icon: Phone },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", icon: ScrollText },
      { label: "Privacy", icon: Lock },
      { label: "Refunds", icon: Undo2 },
      { label: "Licenses", icon: KeyRound },
    ],
  },
];

const PAYMENTS = ["Stripe", "PayPal", "Paddle", "Lemon Squeezy", "Crypto"];

export function Footer() {
  const [email, setEmail] = React.useState("");

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
    <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand + newsletter */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Music2 className="size-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Play<span className="pb-text-gradient">Beat</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              The global marketplace for AI tools, software subscriptions, and
              premium digital products.
            </p>
            <form onSubmit={subscribe} className="mt-4 flex gap-2">
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
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">
                {col.title}
              </h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => {
                  const Icon = l.icon;
                  return (
                    <li key={l.label}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          toast.message(`${l.label} — coming soon`);
                        }}
                        className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Icon className="size-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                        {l.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 PlayBeat Inc. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="rounded-md border border-border bg-background/60 px-2 py-1 text-[10px] font-semibold text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="GitHub" asChild>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <Github className="size-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Twitter / X" asChild>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <Twitter className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
