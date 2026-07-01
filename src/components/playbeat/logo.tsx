"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Show the "playbeat" wordmark next to the mark */
  showWordmark?: boolean;
  /** Size of the logo mark in px */
  size?: number;
}

/**
 * playbeat brand logo.
 *
 * A rounded-square mark with a stylized "P" containing a gold play triangle,
 * flanked by three sound-wave bars (silver / gold / silver). The wordmark
 * reads "playbeat" — "play" in silver, "b" in gold, "eat" in silver.
 *
 * Matches the playbeat.Digital brand identity (deep navy + gold + silver).
 */
export function Logo({ className, showWordmark = true, size = 36 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 cursor-pointer select-none", className)}>
      <LogoMark size={size} />
      {showWordmark && <LogoWordmark />}
    </div>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  const gold = "var(--pb-gold)";
  const silver = "var(--pb-silver)";
  const navyDeep = "var(--pb-navy-deep)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="playbeat logo"
    >
      <defs>
        <linearGradient id="pb-navy-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor={navyDeep} />
          <stop offset="100%" stopColor="oklch(0.2 0.05 260)" />
        </linearGradient>
        <linearGradient id="pb-gold-grad" x1="0" y1="0" x2="0" y2="48">
          <stop offset="0%" stopColor="oklch(0.85 0.15 85)" />
          <stop offset="100%" stopColor="oklch(0.72 0.14 75)" />
        </linearGradient>
        <linearGradient id="pb-silver-grad" x1="0" y1="0" x2="0" y2="48">
          <stop offset="0%" stopColor="oklch(0.9 0.005 250)" />
          <stop offset="100%" stopColor="oklch(0.75 0.01 250)" />
        </linearGradient>
      </defs>

      {/* Rounded navy square background */}
      <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#pb-navy-grad)" />
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="12"
        stroke="url(#pb-gold-grad)"
        strokeWidth="1.5"
        opacity="0.55"
      />

      {/* Sound-wave bars on the left (silver / gold / silver) */}
      <rect x="9" y="18" width="2.5" height="12" rx="1.25" fill="url(#pb-silver-grad)" opacity="0.85" />
      <rect x="13" y="14" width="2.5" height="20" rx="1.25" fill="url(#pb-gold-grad)" />
      <rect x="9" y="18" width="2.5" height="12" rx="1.25" fill="url(#pb-silver-grad)" opacity="0.85" transform="translate(8 0)" />

      {/* Stylized "P" — a rounded vertical stroke + a gold-outlined bowl */}
      <path
        d="M22 12 h7 a7 7 0 0 1 0 14 h-7 z"
        fill="none"
        stroke="url(#pb-gold-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="20" y="12" width="3" height="24" rx="1.5" fill="url(#pb-gold-grad)" />

      {/* Gold play triangle inside the P bowl */}
      <path
        d="M26 18 l6 4 -6 4 z"
        fill="url(#pb-gold-grad)"
      />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-lg font-extrabold tracking-tight lowercase", className)}>
      <span className="pb-text-silver">play</span>
      <span className="text-accent">b</span>
      <span className="pb-text-silver">eat</span>
    </span>
  );
}
