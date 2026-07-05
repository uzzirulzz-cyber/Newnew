import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

/**
 * GET /api/v1/admin/website-builder
 * PUT /api/v1/admin/website-builder
 *
 * Stores the full page-builder configuration (sections + metadata) as a
 * single JSON blob in the `Settings` table under the key
 * `"website-builder-config"`.
 *
 * GET returns the saved config, or a default config when no row exists yet.
 * PUT upserts the config row.
 */

const SETTING_KEY = "website-builder-config";

// ===== Default page configuration =====
// Returned when no saved config exists. Mirrors the brief:
//   Hero "Premium Digital Products" with 2 CTAs
//   3 Features
//   4 Stats
//   CTA "Get started today"
//   Footer with site info + links
function defaultConfig() {
  return {
    title: "Homepage",
    sections: [
      {
        id: "hero-default",
        type: "hero",
        visible: true,
        data: {
          eyebrow: "PlayBeat Digital",
          headline: "Premium Digital Products",
          subheadline:
            "Discover, sell, and deliver premium digital goods — software, themes, plugins, IPTV, and more — on a single powerful platform.",
          primaryCta: { text: "Browse Products", link: "/marketplace" },
          secondaryCta: { text: "Become a Vendor", link: "/vendor" },
          bgColor: "#0a0a14",
          bgGradient: "linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #16213e 100%)",
          bgImage: "",
        },
      },
      {
        id: "features-default",
        type: "features",
        visible: true,
        data: {
          title: "Why choose PlayBeat",
          subtitle: "Everything you need to run a modern digital storefront.",
          cards: [
            {
              icon: "Zap",
              title: "Instant Delivery",
              description:
                "Customers receive license keys and download links automatically the moment payment is confirmed.",
            },
            {
              icon: "Shield",
              title: "Secure Payments",
              description:
                "Built-in support for Stripe, PayPal, JazzCash, and crypto — all PCI-compliant and fraud-protected.",
            },
            {
              icon: "BarChart3",
              title: "Powerful Analytics",
              description:
                "Real-time dashboards for revenue, conversions, traffic, and customer lifetime value.",
            },
          ],
        },
      },
      {
        id: "stats-default",
        type: "stats",
        visible: true,
        data: {
          items: [
            { value: "50K+", label: "Products Sold", icon: "Package" },
            { value: "12K+", label: "Active Vendors", icon: "Users" },
            { value: "98%", label: "Uptime", icon: "Activity" },
            { value: "24/7", label: "Support", icon: "Headphones" },
          ],
        },
      },
      {
        id: "cta-default",
        type: "cta",
        visible: true,
        data: {
          headline: "Get started today",
          subtext:
            "Join thousands of vendors and customers building the future of digital commerce on PlayBeat.",
          buttonText: "Create Account",
          buttonLink: "/register",
          bgColor: "#1e3a8a",
        },
      },
      {
        id: "footer-default",
        type: "footer",
        visible: true,
        data: {
          logoText: "PlayBeat Digital",
          description:
            "The premium marketplace for digital products — software, themes, plugins, IPTV, and more.",
          columns: [
            {
              title: "Product",
              links: [
                { label: "Marketplace", link: "/marketplace" },
                { label: "Pricing", link: "/pricing" },
                { label: "Features", link: "/features" },
                { label: "Changelog", link: "/changelog" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", link: "/about" },
                { label: "Careers", link: "/careers" },
                { label: "Blog", link: "/blog" },
                { label: "Contact", link: "/contact" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Privacy Policy", link: "/privacy" },
                { label: "Terms of Service", link: "/terms" },
                { label: "Refund Policy", link: "/refund-policy" },
                { label: "License", link: "/license" },
              ],
            },
          ],
          copyright: `© ${new Date().getFullYear()} PlayBeat Digital. All rights reserved.`,
          social: [
            { platform: "Twitter", url: "https://twitter.com/playbeat" },
            { platform: "GitHub", url: "https://github.com/playbeat" },
            { platform: "Discord", url: "https://discord.gg/playbeat" },
          ],
        },
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const row = await db.settings.findUnique({ where: { key: SETTING_KEY } });
    if (!row) {
      return ok({ config: defaultConfig() });
    }
    try {
      const config = JSON.parse(row.value);
      // Defensive: ensure shape is valid; fall back to default otherwise.
      if (
        !config ||
        typeof config !== "object" ||
        !Array.isArray(config.sections)
      ) {
        return ok({ config: defaultConfig() });
      }
      return ok({ config });
    } catch {
      return ok({ config: defaultConfig() });
    }
  } catch {
    // DB cold start / unavailable — return defaults so the editor still works.
    return ok({ config: defaultConfig() });
  }
}

export async function PUT(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return error("Page configuration object is required", 422);
  }

  // The client sends either the full config ({ title, sections, updatedAt })
  // or the config nested under `config`. Support both.
  const config = (body as any).config ?? body;

  if (!config || typeof config !== "object" || !Array.isArray(config.sections)) {
    return error("Invalid page configuration: `sections` array is required", 422);
  }

  // Stamp updatedAt server-side so clients can't lie about it.
  config.updatedAt = new Date().toISOString();

  try {
    await db.settings.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(config) },
      create: { key: SETTING_KEY, value: JSON.stringify(config) },
    });

    return ok({
      saved: true,
      message: `Saved ${config.sections.length} section${config.sections.length === 1 ? "" : "s"}`,
      updatedAt: config.updatedAt,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to save website builder config",
      500,
    );
  }
}
