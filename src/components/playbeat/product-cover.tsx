"use client";

import * as React from "react";
import {
  Sparkles,
  KeyRound,
  RefreshCw,
  Download,
  BookOpen,
  LayoutTemplate,
  Palette,
  GraduationCap,
  Crown,
  Share2,
  CreditCard,
  Gamepad2,
  Gift,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { ProductCover } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  KeyRound,
  RefreshCw,
  Download,
  BookOpen,
  LayoutTemplate,
  Palette,
  GraduationCap,
  Crown,
  Share2,
  CreditCard,
  Gamepad2,
  Gift,
  Package,
};

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Package;
  return ICON_MAP[name] || Package;
}

interface ProductCoverProps {
  cover: ProductCover | string | null;
  className?: string;
  iconSize?: number;
  rounded?: string;
}

function parseCover(c: ProductCoverProps["cover"]): ProductCover | null {
  if (!c) return null;
  if (typeof c === "string") {
    try {
      return JSON.parse(c) as ProductCover;
    } catch {
      return null;
    }
  }
  return c;
}

export function ProductCover({
  cover,
  className,
  iconSize = 64,
  rounded = "rounded-xl",
}: ProductCoverProps) {
  const parsed = parseCover(cover);

  // Image cover (Lemon Squeezy products with a real thumbnail)
  if (parsed?.type === "image" && parsed.image) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-muted",
          rounded,
          className,
        )}
      >
        <img
          src={parsed.image}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Gradient cover (fallback)
  const IconComp = resolveIcon(parsed?.icon);
  const c1 = parsed?.colors?.[0] || "#10b981";
  const c2 = parsed?.colors?.[1] || "#0d9488";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        rounded,
        className
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0px, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.25) 0px, transparent 50%)",
        }}
      />
      {React.createElement(IconComp, {
        className: "relative text-white/85 drop-shadow-sm",
        style: { width: iconSize, height: iconSize },
        strokeWidth: 1.4,
      })}
    </div>
  );
}
