"use client";

import { usePathname } from "next/navigation";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string };

type HeaderSettings = {
  siteName?: string;
  navItems?: NavItem[];
};

type FooterSettings = {
  tagline?: string;
  links?: NavItem[];
  copyright?: string;
};

const defaultNav: NavItem[] = [
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

// Hardcoded defaults — no settings API for the website-builder yet.
const header: HeaderSettings = { siteName: "SiteBuilder", navItems: defaultNav };
const footer: FooterSettings = {
  tagline: "Insights, updates, and stories from our team.",
  links: defaultNav,
  copyright: undefined,
};

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const siteName = header.siteName ?? "SiteBuilder";
  const navItems: NavItem[] = header.navItems?.length ? header.navItems : defaultNav;
  const footerLinks: NavItem[] = footer.links ?? defaultNav;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            {siteName}
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <a href="/" className="flex items-center gap-2 font-bold text-base tracking-tight mb-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                  <Globe className="w-3 h-3 text-white" />
                </div>
                {siteName}
              </a>
              {footer.tagline && (
                <p className="text-sm text-muted-foreground max-w-xs">{footer.tagline}</p>
              )}
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
            {footer.copyright ?? `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
