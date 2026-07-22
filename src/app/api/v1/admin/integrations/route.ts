import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Default integration catalogue. Seeded into the DB on first GET if the
// collection is empty. JazzCash + Crypto start connected; everything else
// starts disconnected.
const DEFAULT_INTEGRATIONS = [
  {
    name: "JazzCash",
    slug: "jazzcash",
    category: "payments",
    description: "Pakistani payment gateway for local cards, mobile accounts, and bank transfers.",
    icon: "credit-card",
    connected: true,
    config: {},
  },
  {
    name: "Crypto",
    slug: "crypto",
    category: "payments",
    description: "Accept cryptocurrency payments (BTC, ETH, USDT) via wallet or gateway.",
    icon: "bitcoin",
    connected: true,
    config: {},
  },
  {
    name: "WooCommerce",
    slug: "woocommerce",
    category: "cms",
    description: "Sync products, orders, and customers with a WooCommerce store.",
    icon: "shopping-cart",
    connected: false,
    config: {},
  },
  {
    name: "WordPress",
    slug: "wordpress",
    category: "cms",
    description: "Publish and manage blog posts and pages on a WordPress site.",
    icon: "file-text",
    connected: false,
    config: {},
  },
  {
    name: "Lemon Squeezy",
    slug: "lemon-squeezy",
    category: "payments",
    description: "Merchant of record for global digital sales with built-in tax handling.",
    icon: "lemon",
    connected: false,
    config: {},
  },
  {
    name: "Zapier",
    slug: "zapier",
    category: "automation",
    description: "Connect PlayBeat events to 6,000+ apps via Zapier workflows.",
    icon: "zap",
    connected: false,
    config: {},
  },
  {
    name: "Google Analytics",
    slug: "google-analytics",
    category: "analytics",
    description: "Track web traffic, conversions, and audience insights.",
    icon: "bar-chart",
    connected: false,
    config: {},
  },
  {
    name: "Meta Pixel",
    slug: "meta-pixel",
    category: "analytics",
    description: "Facebook and Instagram ad attribution and conversion tracking.",
    icon: "target",
    connected: false,
    config: {},
  },
  {
    name: "SendGrid",
    slug: "sendgrid",
    category: "communication",
    description: "Transactional email delivery and template management.",
    icon: "mail",
    connected: false,
    config: {},
  },
  {
    name: "Twilio",
    slug: "twilio",
    category: "communication",
    description: "SMS, voice, and WhatsApp messaging for customer alerts.",
    icon: "message-square",
    connected: false,
    config: {},
  },
];

function parseConfig(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, any>;
    }
  } catch {
    // ignore
  }
  return {};
}

function serialize(int: any) {
  return {
    id: int.id,
    name: int.name,
    slug: int.slug,
    category: int.category,
    description: int.description ?? "",
    icon: int.icon ?? null,
    connected: !!int.connected,
    config: parseConfig(int.config),
    createdAt: int.createdAt,
    updatedAt: int.updatedAt ?? int.createdAt,
  };
}

// Ensure the integrations collection has at least the default catalogue.
// Returns true if seeding happened.
async function seedDefaultsIfNeeded(): Promise<boolean> {
  const count = await db.integration.count();
  if (count > 0) return false;
  await db.integration.createMany({
    data: DEFAULT_INTEGRATIONS.map((d) => ({
      ...d,
      config: JSON.stringify(d.config),
    })),
  });
  return true;
}

// ----- GET /api/v1/admin/integrations — list all integrations (seed defaults) -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    await seedDefaultsIfNeeded();
    const integrations = await db.integration.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return ok({ items: integrations.map(serialize) });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to list integrations",
      500,
    );
  }
}
