"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Layout,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Loader2,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  Package,
  Users,
  Activity,
  Headphones,
  Star,
  Check,
  ArrowRight,
  Quote,
  Image as ImageIcon,
  HelpCircle,
  Mail,
  Heart,
  Rocket,
  Crown,
  Code,
  Globe,
  Clock,
  TrendingUp,
  Award,
  Download,
  Lock,
  RefreshCw,
  ExternalLink,
  Settings2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type SectionType =
  | "hero"
  | "features"
  | "pricing"
  | "testimonials"
  | "cta"
  | "stats"
  | "gallery"
  | "faq"
  | "footer";

interface PageSection {
  id: string;
  type: SectionType;
  visible: boolean;
  data: Record<string, any>;
}

interface PageConfig {
  title: string;
  sections: PageSection[];
  updatedAt: string;
}

// ============================================================================
// Section metadata
// ============================================================================

const SECTION_META: Record<
  SectionType,
  { label: string; description: string; icon: typeof Layout }
> = {
  hero: {
    label: "Hero",
    description: "Headline + 2 CTAs",
    icon: Layout,
  },
  features: {
    label: "Features",
    description: "Grid of feature cards",
    icon: Sparkles,
  },
  pricing: {
    label: "Pricing",
    description: "Pricing tiers",
    icon: Crown,
  },
  testimonials: {
    label: "Testimonials",
    description: "Customer quotes",
    icon: Quote,
  },
  cta: {
    label: "CTA",
    description: "Call-to-action banner",
    icon: Rocket,
  },
  stats: {
    label: "Stats",
    description: "Key metrics row",
    icon: BarChart3,
  },
  gallery: {
    label: "Gallery",
    description: "Image grid",
    icon: ImageIcon,
  },
  faq: {
    label: "FAQ",
    description: "Q&A list",
    icon: HelpCircle,
  },
  footer: {
    label: "Footer",
    description: "Footer with links",
    icon: Globe,
  },
};

const SECTION_TYPES = Object.keys(SECTION_META) as SectionType[];

// Map of icon name → lucide component. Used by icon picker + preview renderer.
const ICON_MAP: Record<string, typeof Layout> = {
  Layout,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  Package,
  Users,
  Activity,
  Headphones,
  Star,
  Check,
  ArrowRight,
  Quote,
  HelpCircle,
  Mail,
  Heart,
  Rocket,
  Crown,
  Code,
  Globe,
  Clock,
  TrendingUp,
  Award,
  Download,
  Lock,
  RefreshCw,
};

function getIcon(name: string | undefined): typeof Layout {
  if (!name) return Sparkles;
  return ICON_MAP[name] || Sparkles;
}

// ============================================================================
// ID + default section factories
// ============================================================================

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore — fall through to time-based id */
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultSection(type: SectionType): PageSection {
  const section: PageSection = { id: genId(), type, visible: true, data: {} };
  switch (type) {
    case "hero":
      section.data = {
        eyebrow: "",
        headline: "New headline",
        subheadline: "Brief supporting text goes here.",
        primaryCta: { text: "Get Started", link: "#" },
        secondaryCta: { text: "Learn More", link: "#" },
        bgColor: "#0a0a14",
        bgGradient: "",
        bgImage: "",
      };
      break;
    case "features":
      section.data = {
        title: "Features",
        subtitle: "What makes us different",
        cards: [
          { icon: "Zap", title: "Fast", description: "Lightning quick performance." },
          { icon: "Shield", title: "Secure", description: "Bank-grade security." },
          { icon: "BarChart3", title: "Insightful", description: "Real-time analytics." },
        ],
      };
      break;
    case "pricing":
      section.data = {
        title: "Pricing",
        subtitle: "Simple, transparent pricing",
        tiers: [
          {
            name: "Starter",
            price: "$9",
            period: "/mo",
            features: ["1 project", "Email support", "5GB storage"],
            popular: false,
            ctaText: "Choose Starter",
            ctaLink: "#",
          },
          {
            name: "Pro",
            price: "$29",
            period: "/mo",
            features: [
              "10 projects",
              "Priority support",
              "50GB storage",
              "Advanced analytics",
            ],
            popular: true,
            ctaText: "Choose Pro",
            ctaLink: "#",
          },
          {
            name: "Enterprise",
            price: "$99",
            period: "/mo",
            features: ["Unlimited projects", "Dedicated support", "Unlimited storage", "SLA"],
            popular: false,
            ctaText: "Contact Sales",
            ctaLink: "#",
          },
        ],
      };
      break;
    case "testimonials":
      section.data = {
        title: "Testimonials",
        subtitle: "Loved by thousands",
        items: [
          {
            name: "Jane Doe",
            role: "CEO, Acme",
            avatar: "",
            quote: "Absolutely transformed our workflow.",
            rating: 5,
          },
          {
            name: "John Smith",
            role: "CTO, Globex",
            avatar: "",
            quote: "The best platform we've used.",
            rating: 5,
          },
          {
            name: "Sara Lee",
            role: "Founder, Initech",
            avatar: "",
            quote: "Worth every penny.",
            rating: 4,
          },
        ],
      };
      break;
    case "cta":
      section.data = {
        headline: "Ready to get started?",
        subtext: "Join us today and start building.",
        buttonText: "Sign Up",
        buttonLink: "#",
        bgColor: "#1e3a8a",
      };
      break;
    case "stats":
      section.data = {
        items: [
          { value: "10K+", label: "Users", icon: "Users" },
          { value: "99%", label: "Satisfaction", icon: "Heart" },
          { value: "24/7", label: "Support", icon: "Headphones" },
          { value: "5M+", label: "Downloads", icon: "Download" },
        ],
      };
      break;
    case "gallery":
      section.data = {
        title: "Gallery",
        images: [
          { url: "", alt: "Image 1" },
          { url: "", alt: "Image 2" },
          { url: "", alt: "Image 3" },
          { url: "", alt: "Image 4" },
        ],
      };
      break;
    case "faq":
      section.data = {
        title: "Frequently Asked Questions",
        items: [
          {
            question: "How do I get started?",
            answer: "Sign up and follow the onboarding guide.",
          },
          {
            question: "What payment methods are supported?",
            answer: "We support all major credit cards, PayPal, and crypto.",
          },
          {
            question: "Can I cancel anytime?",
            answer: "Yes — cancel from your dashboard at any time.",
          },
        ],
      };
      break;
    case "footer":
      section.data = {
        logoText: "Your Brand",
        description: "Building the future of digital products.",
        columns: [
          {
            title: "Product",
            links: [
              { label: "Features", link: "#" },
              { label: "Pricing", link: "#" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", link: "#" },
              { label: "Contact", link: "#" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Privacy", link: "#" },
              { label: "Terms", link: "#" },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} Your Brand. All rights reserved.`,
        social: [
          { platform: "Twitter", url: "#" },
          { platform: "GitHub", url: "#" },
        ],
      };
      break;
  }
  return section;
}

// ============================================================================
// Form helpers
// ============================================================================

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-white/70">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-white/40">{hint}</p>}
    </div>
  );
}

// ============================================================================
// Section preview components
// ============================================================================

function HeroPreview({ data }: { data: any }) {
  const bg = data.bgGradient || data.bgColor || "#0a0a14";
  return (
    <div
      className="relative overflow-hidden rounded-lg px-5 py-8 text-center"
      style={{
        background: data.bgImage ? `${bg}` : bg,
        minHeight: 160,
      }}
    >
      {data.bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${data.bgImage})` }}
        />
      )}
      <div className="relative">
        {data.eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300">
            {data.eyebrow}
          </p>
        )}
        <h3 className="mt-1.5 text-lg font-bold text-white">
          {data.headline || "Headline"}
        </h3>
        {data.subheadline && (
          <p className="mx-auto mt-1.5 max-w-xs text-[11px] text-white/70">
            {data.subheadline}
          </p>
        )}
        <div className="mt-3 flex items-center justify-center gap-2">
          {data.primaryCta?.text && (
            <span className="rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white">
              {data.primaryCta.text}
            </span>
          )}
          {data.secondaryCta?.text && (
            <span className="rounded-md border border-white/30 px-3 py-1.5 text-[10px] font-semibold text-white">
              {data.secondaryCta.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturesPreview({ data }: { data: any }) {
  const cards: any[] = data.cards || [];
  return (
    <div className="rounded-lg bg-white/5 p-4">
      <div className="text-center">
        <h3 className="text-sm font-bold text-white">{data.title || "Features"}</h3>
        {data.subtitle && (
          <p className="mt-0.5 text-[10px] text-white/60">{data.subtitle}</p>
        )}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {cards.map((c: any, i: number) => {
          const Icon = getIcon(c.icon);
          return (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md border border-white/10 bg-white/5 p-2"
            >
              <div className="grid size-7 shrink-0 place-items-center rounded-md bg-blue-500/20 text-blue-300">
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white">{c.title}</p>
                <p className="text-[10px] text-white/60 line-clamp-2">
                  {c.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PricingPreview({ data }: { data: any }) {
  const tiers: any[] = data.tiers || [];
  return (
    <div className="rounded-lg bg-white/5 p-4">
      <div className="text-center">
        <h3 className="text-sm font-bold text-white">{data.title || "Pricing"}</h3>
        {data.subtitle && (
          <p className="mt-0.5 text-[10px] text-white/60">{data.subtitle}</p>
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {tiers.map((t: any, i: number) => (
          <div
            key={i}
            className={cn(
              "relative rounded-md border p-2 text-center",
              t.popular
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-white/10 bg-white/5",
            )}
          >
            {t.popular && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-1.5 py-0.5 text-[7px] font-bold uppercase text-white">
                Popular
              </span>
            )}
            <p className="text-[10px] font-semibold text-white">{t.name}</p>
            <p className="mt-0.5 text-sm font-bold text-blue-300">
              {t.price}
              <span className="text-[9px] text-white/50">{t.period}</span>
            </p>
            <ul className="mt-1 space-y-0.5">
              {(t.features || []).slice(0, 3).map((f: string, fi: number) => (
                <li
                  key={fi}
                  className="flex items-center justify-center gap-0.5 text-[8px] text-white/70"
                >
                  <Check className="size-2 text-emerald-400" />
                  <span className="truncate">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-semibold text-white">
              {t.ctaText}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsPreview({ data }: { data: any }) {
  const items: any[] = data.items || [];
  return (
    <div className="rounded-lg bg-white/5 p-4">
      <div className="text-center">
        <h3 className="text-sm font-bold text-white">
          {data.title || "Testimonials"}
        </h3>
        {data.subtitle && (
          <p className="mt-0.5 text-[10px] text-white/60">{data.subtitle}</p>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {items.map((t: any, i: number) => (
          <div
            key={i}
            className="rounded-md border border-white/10 bg-white/5 p-2.5"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star
                  key={si}
                  className={cn(
                    "size-2.5",
                    si < (t.rating || 5)
                      ? "fill-amber-400 text-amber-400"
                      : "text-white/20",
                  )}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] italic text-white/80">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              {t.avatar ? (
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="size-5 rounded-full object-cover"
                />
              ) : (
                <div className="grid size-5 place-items-center rounded-full bg-blue-500/30 text-[8px] font-bold text-blue-200">
                  {(t.name || "?").charAt(0)}
                </div>
              )}
              <div>
                <p className="text-[9px] font-semibold text-white">{t.name}</p>
                <p className="text-[8px] text-white/50">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaPreview({ data }: { data: any }) {
  return (
    <div
      className="rounded-lg px-5 py-6 text-center"
      style={{ background: data.bgColor || "#1e3a8a" }}
    >
      <h3 className="text-sm font-bold text-white">
        {data.headline || "Call to action"}
      </h3>
      {data.subtext && (
        <p className="mx-auto mt-1 max-w-xs text-[10px] text-white/80">
          {data.subtext}
        </p>
      )}
      {data.buttonText && (
        <span className="mt-2.5 inline-block rounded-md bg-white px-3 py-1.5 text-[10px] font-bold text-slate-900">
          {data.buttonText}
        </span>
      )}
    </div>
  );
}

function StatsPreview({ data }: { data: any }) {
  const items: any[] = data.items || [];
  return (
    <div className="rounded-lg bg-white/5 p-4">
      <div className="grid grid-cols-2 gap-2">
        {items.map((s: any, i: number) => {
          const Icon = getIcon(s.icon);
          return (
            <div
              key={i}
              className="rounded-md border border-white/10 bg-white/5 p-2 text-center"
            >
              <Icon className="mx-auto size-3.5 text-blue-300" />
              <p className="mt-1 text-sm font-bold text-white">{s.value}</p>
              <p className="text-[9px] text-white/50">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GalleryPreview({ data }: { data: any }) {
  const images: any[] = data.images || [];
  return (
    <div className="rounded-lg bg-white/5 p-4">
      {data.title && (
        <h3 className="mb-2 text-center text-sm font-bold text-white">
          {data.title}
        </h3>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {images.map((img: any, i: number) => (
          <div
            key={i}
            className="aspect-video overflow-hidden rounded-md border border-white/10 bg-white/5"
          >
            {img.url ? (
              <img
                src={img.url}
                alt={img.alt || ""}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-white/30">
                <ImageIcon className="size-5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqPreview({ data }: { data: any }) {
  const items: any[] = data.items || [];
  return (
    <div className="rounded-lg bg-white/5 p-4">
      {data.title && (
        <h3 className="mb-2 text-center text-sm font-bold text-white">
          {data.title}
        </h3>
      )}
      <div className="space-y-1.5">
        {items.map((item: any, i: number) => (
          <div
            key={i}
            className="rounded-md border border-white/10 bg-white/5 p-2"
          >
            <p className="flex items-start gap-1 text-[11px] font-semibold text-white">
              <HelpCircle className="mt-0.5 size-3 shrink-0 text-blue-300" />
              {item.question}
            </p>
            <p className="mt-0.5 pl-4 text-[10px] text-white/60">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterPreview({ data }: { data: any }) {
  const columns: any[] = data.columns || [];
  const social: any[] = data.social || [];
  return (
    <div className="rounded-lg bg-black/50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-bold text-white">
            {data.logoText || "Brand"}
          </p>
          {data.description && (
            <p className="mt-1 text-[9px] text-white/60 line-clamp-3">
              {data.description}
            </p>
          )}
        </div>
        {columns.slice(0, 2).map((col: any, i: number) => (
          <div key={i}>
            <p className="text-[10px] font-semibold uppercase text-white/70">
              {col.title}
            </p>
            <ul className="mt-1 space-y-0.5">
              {(col.links || []).slice(0, 3).map((l: any, li: number) => (
                <li key={li} className="text-[9px] text-white/50">
                  {l.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
        <p className="text-[8px] text-white/40">{data.copyright}</p>
        <div className="flex gap-1.5">
          {social.map((s: any, i: number) => (
            <span
              key={i}
              className="rounded-full bg-white/10 px-1.5 py-0.5 text-[7px] text-white/70"
            >
              {s.platform}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionPreview({ section }: { section: PageSection }) {
  const data = section.data || {};
  switch (section.type) {
    case "hero":
      return <HeroPreview data={data} />;
    case "features":
      return <FeaturesPreview data={data} />;
    case "pricing":
      return <PricingPreview data={data} />;
    case "testimonials":
      return <TestimonialsPreview data={data} />;
    case "cta":
      return <CtaPreview data={data} />;
    case "stats":
      return <StatsPreview data={data} />;
    case "gallery":
      return <GalleryPreview data={data} />;
    case "faq":
      return <FaqPreview data={data} />;
    case "footer":
      return <FooterPreview data={data} />;
    default:
      return null;
  }
}

// ============================================================================
// Section editors
// ============================================================================

interface EditorProps {
  data: any;
  onChange: (newData: any) => void;
}

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder="Pick an icon" />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {Object.keys(ICON_MAP).map((name) => {
          const Icon = ICON_MAP[name];
          return (
            <SelectItem key={name} value={name}>
              <div className="flex items-center gap-2">
                <Icon className="size-3.5" />
                <span>{name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function HeroEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  return (
    <div className="space-y-3">
      <Field label="Eyebrow text">
        <Input
          value={data.eyebrow || ""}
          onChange={(e) => update({ eyebrow: e.target.value })}
          placeholder="Premium Digital Products"
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <Field label="Headline">
        <Input
          value={data.headline || ""}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="Your main headline"
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <Field label="Subheadline">
        <Textarea
          value={data.subheadline || ""}
          onChange={(e) => update({ subheadline: e.target.value })}
          placeholder="Supporting text"
          rows={2}
          className="bg-white/5 border-white/10"
        />
      </Field>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs font-semibold text-white/80">
          Primary button
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Text">
            <Input
              value={data.primaryCta?.text || ""}
              onChange={(e) =>
                update({
                  primaryCta: { ...data.primaryCta, text: e.target.value },
                })
              }
              placeholder="Browse Products"
              className="h-9 bg-white/5 border-white/10"
            />
          </Field>
          <Field label="Link">
            <Input
              value={data.primaryCta?.link || ""}
              onChange={(e) =>
                update({
                  primaryCta: { ...data.primaryCta, link: e.target.value },
                })
              }
              placeholder="/marketplace"
              className="h-9 bg-white/5 border-white/10"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs font-semibold text-white/80">
          Secondary button
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Text">
            <Input
              value={data.secondaryCta?.text || ""}
              onChange={(e) =>
                update({
                  secondaryCta: {
                    ...data.secondaryCta,
                    text: e.target.value,
                  },
                })
              }
              placeholder="Become a Vendor"
              className="h-9 bg-white/5 border-white/10"
            />
          </Field>
          <Field label="Link">
            <Input
              value={data.secondaryCta?.link || ""}
              onChange={(e) =>
                update({
                  secondaryCta: {
                    ...data.secondaryCta,
                    link: e.target.value,
                  },
                })
              }
              placeholder="/vendor"
              className="h-9 bg-white/5 border-white/10"
            />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Background color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={data.bgColor || "#0a0a14"}
              onChange={(e) => update({ bgColor: e.target.value })}
              className="size-9 cursor-pointer rounded-md border border-white/10 bg-transparent"
            />
            <Input
              value={data.bgColor || ""}
              onChange={(e) => update({ bgColor: e.target.value })}
              className="h-9 bg-white/5 border-white/10"
            />
          </div>
        </Field>
        <Field label="Background image URL" hint="Optional — overrides color">
          <Input
            value={data.bgImage || ""}
            onChange={(e) => update({ bgImage: e.target.value })}
            placeholder="https://…"
            className="h-9 bg-white/5 border-white/10"
          />
        </Field>
      </div>
      <Field
        label="Background gradient (CSS)"
        hint="e.g. linear-gradient(135deg, #0a0a14, #16213e)"
      >
        <Input
          value={data.bgGradient || ""}
          onChange={(e) => update({ bgGradient: e.target.value })}
          placeholder="linear-gradient(135deg, #0a0a14, #16213e)"
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
    </div>
  );
}

function FeaturesEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  const cards: any[] = data.cards || [];

  const updateCard = (i: number, patch: any) => {
    const next = cards.slice();
    next[i] = { ...next[i], ...patch };
    update({ cards: next });
  };
  const addCard = () =>
    update({
      cards: [
        ...cards,
        { icon: "Sparkles", title: "New feature", description: "Description." },
      ],
    });
  const removeCard = (i: number) =>
    update({ cards: cards.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <Field label="Section title">
        <Input
          value={data.title || ""}
          onChange={(e) => update({ title: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <Field label="Section subtitle">
        <Input
          value={data.subtitle || ""}
          onChange={(e) => update({ subtitle: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/80">
          Feature cards ({cards.length})
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-white/15 text-xs"
          onClick={addCard}
          disabled={cards.length >= 6}
        >
          <Plus className="size-3" /> Add card
        </Button>
      </div>
      <div className="space-y-2">
        {cards.map((c: any, i: number) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                Card {i + 1}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-white/50 hover:text-rose-400"
                onClick={() => removeCard(i)}
                disabled={cards.length <= 3}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Icon">
                <IconPicker
                  value={c.icon || "Sparkles"}
                  onChange={(v) => updateCard(i, { icon: v })}
                />
              </Field>
              <Field label="Title">
                <Input
                  value={c.title || ""}
                  onChange={(e) => updateCard(i, { title: e.target.value })}
                  className="h-9 bg-white/5 border-white/10"
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                value={c.description || ""}
                onChange={(e) =>
                  updateCard(i, { description: e.target.value })
                }
                rows={2}
                className="bg-white/5 border-white/10"
              />
            </Field>
          </div>
        ))}
      </div>
      {cards.length < 3 && (
        <p className="text-[10px] text-amber-400">
          Minimum 3 cards recommended.
        </p>
      )}
    </div>
  );
}

function PricingEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  const tiers: any[] = data.tiers || [];

  const updateTier = (i: number, patch: any) => {
    const next = tiers.slice();
    next[i] = { ...next[i], ...patch };
    update({ tiers: next });
  };
  const updateFeatures = (i: number, text: string) => {
    const features = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    updateTier(i, { features });
  };

  return (
    <div className="space-y-3">
      <Field label="Section title">
        <Input
          value={data.title || ""}
          onChange={(e) => update({ title: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <Field label="Section subtitle">
        <Input
          value={data.subtitle || ""}
          onChange={(e) => update({ subtitle: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>

      <p className="text-xs font-semibold text-white/80">
        Pricing tiers ({tiers.length})
      </p>
      <div className="space-y-2">
        {tiers.map((t: any, i: number) => (
          <div
            key={i}
            className={cn(
              "rounded-lg border p-3",
              t.popular
                ? "border-blue-500/40 bg-blue-500/10"
                : "border-white/10 bg-white/5",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Tier {i + 1}
              </span>
              <label className="flex items-center gap-1.5 text-[10px] text-white/70">
                <Switch
                  checked={!!t.popular}
                  onCheckedChange={(c) => updateTier(i, { popular: c })}
                />
                Popular
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Name">
                <Input
                  value={t.name || ""}
                  onChange={(e) => updateTier(i, { name: e.target.value })}
                  className="h-9 bg-white/5 border-white/10"
                />
              </Field>
              <Field label="Price">
                <Input
                  value={t.price || ""}
                  onChange={(e) => updateTier(i, { price: e.target.value })}
                  placeholder="$29"
                  className="h-9 bg-white/5 border-white/10"
                />
              </Field>
              <Field label="Period">
                <Input
                  value={t.period || ""}
                  onChange={(e) => updateTier(i, { period: e.target.value })}
                  placeholder="/mo"
                  className="h-9 bg-white/5 border-white/10"
                />
              </Field>
            </div>
            <Field label="Features (one per line)">
              <Textarea
                value={(t.features || []).join("\n")}
                onChange={(e) => updateFeatures(i, e.target.value)}
                rows={4}
                className="bg-white/5 border-white/10"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="CTA text">
                <Input
                  value={t.ctaText || ""}
                  onChange={(e) => updateTier(i, { ctaText: e.target.value })}
                  className="h-9 bg-white/5 border-white/10"
                />
              </Field>
              <Field label="CTA link">
                <Input
                  value={t.ctaLink || ""}
                  onChange={(e) => updateTier(i, { ctaLink: e.target.value })}
                  className="h-9 bg-white/5 border-white/10"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  const items: any[] = data.items || [];

  const updateItem = (i: number, patch: any) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    update({ items: next });
  };
  const addItem = () =>
    update({
      items: [
        ...items,
        {
          name: "New Customer",
          role: "Title, Company",
          avatar: "",
          quote: "Great product!",
          rating: 5,
        },
      ],
    });
  const removeItem = (i: number) =>
    update({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <Field label="Section title">
        <Input
          value={data.title || ""}
          onChange={(e) => update({ title: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <Field label="Section subtitle">
        <Input
          value={data.subtitle || ""}
          onChange={(e) => update({ subtitle: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/80">
          Testimonials ({items.length})
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-white/15 text-xs"
          onClick={addItem}
          disabled={items.length >= 6}
        >
          <Plus className="size-3" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((t: any, i: number) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                Item {i + 1}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-white/50 hover:text-rose-400"
                onClick={() => removeItem(i)}
                disabled={items.length <= 3}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name">
                <Input
                  value={t.name || ""}
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                  className="h-9 bg-white/5 border-white/10"
                />
              </Field>
              <Field label="Role">
                <Input
                  value={t.role || ""}
                  onChange={(e) => updateItem(i, { role: e.target.value })}
                  className="h-9 bg-white/5 border-white/10"
                />
              </Field>
            </div>
            <Field label="Avatar URL" hint="Optional — falls back to initial">
              <Input
                value={t.avatar || ""}
                onChange={(e) => updateItem(i, { avatar: e.target.value })}
                placeholder="https://…"
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
            <Field label="Quote">
              <Textarea
                value={t.quote || ""}
                onChange={(e) => updateItem(i, { quote: e.target.value })}
                rows={2}
                className="bg-white/5 border-white/10"
              />
            </Field>
            <Field label="Rating (1-5)">
              <Select
                value={String(t.rating ?? 5)}
                onValueChange={(v) => updateItem(i, { rating: Number(v) })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "star" : "stars"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  return (
    <div className="space-y-3">
      <Field label="Headline">
        <Input
          value={data.headline || ""}
          onChange={(e) => update({ headline: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <Field label="Subtext">
        <Textarea
          value={data.subtext || ""}
          onChange={(e) => update({ subtext: e.target.value })}
          rows={2}
          className="bg-white/5 border-white/10"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Button text">
          <Input
            value={data.buttonText || ""}
            onChange={(e) => update({ buttonText: e.target.value })}
            className="h-9 bg-white/5 border-white/10"
          />
        </Field>
        <Field label="Button link">
          <Input
            value={data.buttonLink || ""}
            onChange={(e) => update({ buttonLink: e.target.value })}
            className="h-9 bg-white/5 border-white/10"
          />
        </Field>
      </div>
      <Field label="Background color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={data.bgColor || "#1e3a8a"}
            onChange={(e) => update({ bgColor: e.target.value })}
            className="size-9 cursor-pointer rounded-md border border-white/10 bg-transparent"
          />
          <Input
            value={data.bgColor || ""}
            onChange={(e) => update({ bgColor: e.target.value })}
            className="h-9 bg-white/5 border-white/10"
          />
        </div>
      </Field>
    </div>
  );
}

function StatsEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  const items: any[] = data.items || [];

  const updateItem = (i: number, patch: any) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    update({ items: next });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-white/80">Stats ({items.length})</p>
      <div className="space-y-2">
        {items.map((s: any, i: number) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5"
          >
            <Field label="Value">
              <Input
                value={s.value || ""}
                onChange={(e) => updateItem(i, { value: e.target.value })}
                placeholder="50K+"
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
            <Field label="Label">
              <Input
                value={s.label || ""}
                onChange={(e) => updateItem(i, { label: e.target.value })}
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
            <Field label="Icon">
              <div className="w-32">
                <IconPicker
                  value={s.icon || "BarChart3"}
                  onChange={(v) => updateItem(i, { icon: v })}
                />
              </div>
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  const images: any[] = data.images || [];

  const updateImage = (i: number, patch: any) => {
    const next = images.slice();
    next[i] = { ...next[i], ...patch };
    update({ images: next });
  };
  const addImage = () =>
    update({
      images: [...images, { url: "", alt: `Image ${images.length + 1}` }],
    });
  const removeImage = (i: number) =>
    update({ images: images.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <Field label="Section title">
        <Input
          value={data.title || ""}
          onChange={(e) => update({ title: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/80">
          Images ({images.length})
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-white/15 text-xs"
          onClick={addImage}
        >
          <Plus className="size-3" /> Add image
        </Button>
      </div>
      <div className="space-y-2">
        {images.map((img: any, i: number) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/5 p-2.5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                Image {i + 1}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-white/50 hover:text-rose-400"
                onClick={() => removeImage(i)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            <Field label="URL">
              <Input
                value={img.url || ""}
                onChange={(e) => updateImage(i, { url: e.target.value })}
                placeholder="https://…"
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
            <Field label="Alt text">
              <Input
                value={img.alt || ""}
                onChange={(e) => updateImage(i, { alt: e.target.value })}
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  const items: any[] = data.items || [];

  const updateItem = (i: number, patch: any) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    update({ items: next });
  };
  const addItem = () =>
    update({
      items: [
        ...items,
        { question: "New question?", answer: "New answer." },
      ],
    });
  const removeItem = (i: number) =>
    update({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <Field label="Section title">
        <Input
          value={data.title || ""}
          onChange={(e) => update({ title: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/80">
          Questions ({items.length})
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-white/15 text-xs"
          onClick={addItem}
        >
          <Plus className="size-3" /> Add Q&A
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item: any, i: number) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/5 p-2.5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                Q{i + 1}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-white/50 hover:text-rose-400"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            <Field label="Question">
              <Input
                value={item.question || ""}
                onChange={(e) => updateItem(i, { question: e.target.value })}
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
            <Field label="Answer">
              <Textarea
                value={item.answer || ""}
                onChange={(e) => updateItem(i, { answer: e.target.value })}
                rows={2}
                className="bg-white/5 border-white/10"
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterEditor({ data, onChange }: EditorProps) {
  const update = (patch: any) => onChange({ ...data, ...patch });
  const columns: any[] = data.columns || [];
  const social: any[] = data.social || [];

  const updateColumn = (i: number, patch: any) => {
    const next = columns.slice();
    next[i] = { ...next[i], ...patch };
    update({ columns: next });
  };
  const updateColumnLinks = (i: number, text: string) => {
    const links = text
      .split("\n")
      .map((line) => {
        const [label, link] = line.split("|");
        return { label: (label || "").trim(), link: (link || "#").trim() };
      })
      .filter((l) => l.label);
    updateColumn(i, { links });
  };
  const updateSocial = (i: number, patch: any) => {
    const next = social.slice();
    next[i] = { ...next[i], ...patch };
    update({ social: next });
  };
  const addSocial = () =>
    update({ social: [...social, { platform: "New", url: "#" }] });
  const removeSocial = (i: number) =>
    update({ social: social.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <Field label="Logo text">
        <Input
          value={data.logoText || ""}
          onChange={(e) => update({ logoText: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={data.description || ""}
          onChange={(e) => update({ description: e.target.value })}
          rows={2}
          className="bg-white/5 border-white/10"
        />
      </Field>

      <p className="text-xs font-semibold text-white/80">
        Link columns ({columns.length})
      </p>
      <div className="space-y-2">
        {columns.map((col: any, i: number) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/5 p-2.5"
          >
            <Field label={`Column ${i + 1} title`}>
              <Input
                value={col.title || ""}
                onChange={(e) => updateColumn(i, { title: e.target.value })}
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
            <Field
              label="Links (one per line: Label | /link)"
              hint="e.g. About | /about"
            >
              <Textarea
                value={(col.links || [])
                  .map((l: any) => `${l.label}|${l.link}`)
                  .join("\n")}
                onChange={(e) => updateColumnLinks(i, e.target.value)}
                rows={4}
                className="bg-white/5 border-white/10"
              />
            </Field>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/80">Social links</p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-white/15 text-xs"
          onClick={addSocial}
        >
          <Plus className="size-3" /> Add
        </Button>
      </div>
      <div className="space-y-1.5">
        {social.map((s: any, i: number) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="Platform">
              <Input
                value={s.platform || ""}
                onChange={(e) => updateSocial(i, { platform: e.target.value })}
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
            <Field label="URL">
              <Input
                value={s.url || ""}
                onChange={(e) => updateSocial(i, { url: e.target.value })}
                className="h-9 bg-white/5 border-white/10"
              />
            </Field>
            <Button
              size="icon"
              variant="ghost"
              className="size-9 text-white/50 hover:text-rose-400"
              onClick={() => removeSocial(i)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Field label="Copyright text">
        <Input
          value={data.copyright || ""}
          onChange={(e) => update({ copyright: e.target.value })}
          className="h-9 bg-white/5 border-white/10"
        />
      </Field>
    </div>
  );
}

function SectionEditor({ section, onChange }: { section: PageSection; onChange: (data: any) => void }) {
  switch (section.type) {
    case "hero":
      return <HeroEditor data={section.data} onChange={onChange} />;
    case "features":
      return <FeaturesEditor data={section.data} onChange={onChange} />;
    case "pricing":
      return <PricingEditor data={section.data} onChange={onChange} />;
    case "testimonials":
      return <TestimonialsEditor data={section.data} onChange={onChange} />;
    case "cta":
      return <CtaEditor data={section.data} onChange={onChange} />;
    case "stats":
      return <StatsEditor data={section.data} onChange={onChange} />;
    case "gallery":
      return <GalleryEditor data={section.data} onChange={onChange} />;
    case "faq":
      return <FaqEditor data={section.data} onChange={onChange} />;
    case "footer":
      return <FooterEditor data={section.data} onChange={onChange} />;
    default:
      return null;
  }
}

// ============================================================================
// Section list sidebar item
// ============================================================================

function SectionListItem({
  section,
  index,
  total,
  active,
  onSelect,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  section: PageSection;
  index: number;
  total: number;
  active: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const meta = SECTION_META[section.type];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "group rounded-lg border p-2 transition-all",
        active
          ? "border-blue-500/50 bg-blue-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20",
        !section.visible && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-md",
              active
                ? "bg-blue-500/30 text-blue-200"
                : "bg-white/10 text-white/70",
            )}
          >
            <Icon className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {meta.label}
            </p>
            <p className="truncate text-[10px] text-white/40">
              {meta.description}
            </p>
          </div>
        </button>
        <button
          onClick={onToggle}
          title={section.visible ? "Hide section" : "Show section"}
          className="size-6 shrink-0 rounded text-white/50 hover:text-white"
        >
          {section.visible ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="size-6 text-white/50 hover:text-white"
          onClick={onMoveUp}
          disabled={index === 0}
        >
          <ChevronUp className="size-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-6 text-white/50 hover:text-white"
          onClick={onMoveDown}
          disabled={index === total - 1}
        >
          <ChevronDown className="size-3" />
        </Button>
        <span className="ml-auto text-[9px] text-white/30">#{index + 1}</span>
        <Button
          size="icon"
          variant="ghost"
          className="size-6 text-white/50 hover:text-rose-400"
          onClick={onDelete}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Add section dialog
// ============================================================================

function AddSectionDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: SectionType) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new section</DialogTitle>
          <DialogDescription>
            Choose a section type to insert at the end of the page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SECTION_TYPES.map((type) => {
            const meta = SECTION_META[type];
            const Icon = meta.icon;
            return (
              <button
                key={type}
                onClick={() => {
                  onAdd(type);
                  onOpenChange(false);
                }}
                className="flex flex-col items-start gap-1.5 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-blue-500/50 hover:bg-blue-500/10"
              >
                <div className="grid size-8 place-items-center rounded-md bg-blue-500/15 text-blue-300">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {meta.label}
                  </p>
                  <p className="text-[10px] text-white/50">{meta.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main module
// ============================================================================

export function WebsiteBuilderModule() {
  const qc = useQueryClient();
  const [config, setConfig] = React.useState<PageConfig | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["website-builder-config"],
    queryFn: () => api.websiteBuilderGet(),
    staleTime: 30_000,
  });

  // Hydrate local state once the query resolves.
  React.useEffect(() => {
    if (data?.config) {
      setConfig(data.config as PageConfig);
      // Auto-select the first section if nothing is selected.
      setSelectedId((prev) => {
        if (prev) return prev;
        const sections = (data.config as PageConfig).sections || [];
        return sections[0]?.id ?? null;
      });
    }
  }, [data]);

  const sections = config?.sections ?? [];
  const selected = sections.find((s) => s.id === selectedId) ?? null;

  // ===== Mutations on local state =====

  const updateSectionData = React.useCallback(
    (id: string, newData: any) => {
      setConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === id ? { ...s, data: newData } : s,
          ),
        };
      });
    },
    [],
  );

  const toggleVisibility = (id: string) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === id ? { ...s, visible: !s.visible } : s,
            ),
          }
        : prev,
    );
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const idx = prev.sections.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.sections.length) return prev;
      const next = prev.sections.slice();
      const [item] = next.splice(idx, 1);
      next.splice(newIdx, 0, item);
      return { ...prev, sections: next };
    });
  };

  const deleteSection = (id: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = prev.sections.filter((s) => s.id !== id);
      return { ...prev, sections: next };
    });
    if (selectedId === id) {
      const remaining = sections.filter((s) => s.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
    toast.success("Section removed");
  };

  const addSection = (type: SectionType) => {
    const newSection = createDefaultSection(type);
    setConfig((prev) =>
      prev
        ? { ...prev, sections: [...prev.sections, newSection] }
        : {
            title: "Homepage",
            sections: [newSection],
            updatedAt: new Date().toISOString(),
          },
    );
    setSelectedId(newSection.id);
    toast.success(`${SECTION_META[type].label} section added`);
  };

  const resetAll = () => {
    setConfig({
      title: "Homepage",
      sections: [],
      updatedAt: new Date().toISOString(),
    });
    setSelectedId(null);
    toast.success("All sections cleared");
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await api.websiteBuilderPut(config);
      toast.success(res.message || "Saved");
      qc.invalidateQueries({ queryKey: ["website-builder-config"] });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to save configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== Render =====

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-9 w-40 bg-white/10" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 bg-white/10" />
          <Skeleton className="h-64 bg-white/10" />
          <Skeleton className="h-64 bg-white/10" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-rose-500/30 bg-rose-500/5">
        <CardContent className="py-12 text-center">
          <p className="text-sm font-medium text-rose-300">
            Failed to load website builder configuration.
          </p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() =>
              qc.invalidateQueries({ queryKey: ["website-builder-config"] })
            }
          >
            <RefreshCw className="mr-2 size-3.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20">
            <Layout className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
              Website Builder
            </h1>
            <p className="text-sm text-white/60">
              Visual section-based editor for your homepage
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {config?.updatedAt && (
            <Badge
              variant="outline"
              className="hidden border-white/15 text-white/50 sm:flex"
            >
              <Clock className="mr-1 size-3" />
              Saved{" "}
              {new Date(config.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setShowPreview((v) => !v)}
          >
            <Eye className="mr-1.5 size-3.5" />
            {showPreview ? "Hide" : "Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={resetAll}
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
            onClick={handleSave}
            disabled={saving || !config}
          >
            {saving ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-3.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* 3-column workspace */}
      <div
        className={cn(
          "grid gap-4",
          showPreview
            ? "lg:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]",
        )}
      >
        {/* Sections sidebar */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Sections ({sections.length})
              </p>
              <Button
                size="sm"
                className="h-7 bg-blue-600 text-xs hover:bg-blue-500"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-3" /> Add
              </Button>
            </div>
            <div className="space-y-1.5">
              {sections.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/15 p-4 text-center">
                  <Layout className="mx-auto mb-1.5 size-5 text-white/30" />
                  <p className="text-[11px] text-white/50">
                    No sections yet.
                  </p>
                  <p className="text-[10px] text-white/30">
                    Click Add to insert one.
                  </p>
                </div>
              )}
              {sections.map((s, i) => (
                <SectionListItem
                  key={s.id}
                  section={s}
                  index={i}
                  total={sections.length}
                  active={selectedId === s.id}
                  onSelect={() => setSelectedId(s.id)}
                  onToggle={() => toggleVisibility(s.id)}
                  onMoveUp={() => moveSection(s.id, -1)}
                  onMoveDown={() => moveSection(s.id, 1)}
                  onDelete={() => deleteSection(s.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit panel */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-4">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = SECTION_META[selected.type].icon;
                      return (
                        <div className="grid size-8 place-items-center rounded-md bg-blue-500/15 text-blue-300">
                          <Icon className="size-4" />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {SECTION_META[selected.type].label} section
                      </p>
                      <p className="text-[10px] text-white/40">
                        Editing section #{sections.indexOf(selected) + 1}
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-white/70">
                    <Switch
                      checked={selected.visible}
                      onCheckedChange={() => toggleVisibility(selected.id)}
                    />
                    Visible
                  </label>
                </div>
                <SectionEditor
                  section={selected}
                  onChange={(newData) =>
                    updateSectionData(selected.id, newData)
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Settings2 className="mb-2 size-8 text-white/30" />
                <p className="text-sm font-medium text-white/60">
                  Select a section to edit
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Click any section in the sidebar to start editing its content.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live preview */}
        {showPreview && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  Live Preview
                </p>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-300"
                >
                  <span className="mr-1 size-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </Badge>
              </div>
              {/* Fake browser chrome */}
              <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0a0a14]">
                <div className="flex items-center gap-1.5 border-b border-white/10 bg-black/40 px-3 py-2">
                  <span className="size-2 rounded-full bg-rose-500/70" />
                  <span className="size-2 rounded-full bg-amber-500/70" />
                  <span className="size-2 rounded-full bg-emerald-500/70" />
                  <div className="mx-auto flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[9px] text-white/40">
                    <Globe className="size-2.5" />
                    playbeat.digital
                  </div>
                </div>
                <div className="max-h-[600px] space-y-2 overflow-y-auto p-3 pb-scrollbar">
                  {sections.filter((s) => s.visible).length === 0 ? (
                    <div className="py-12 text-center">
                      <EyeOff className="mx-auto mb-2 size-6 text-white/30" />
                      <p className="text-xs text-white/50">
                        No visible sections to preview.
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {sections
                        .filter((s) => s.visible)
                        .map((s) => (
                          <motion.div
                            key={s.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SectionPreview section={s} />
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[10px] text-white/40">
                <ExternalLink className="size-2.5" />
                Preview is a simplified render. Hidden sections are not shown.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddSectionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={addSection}
      />
    </div>
  );
}
