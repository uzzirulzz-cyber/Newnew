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
  return (
    <img
      src="/logo.png"
      alt="playbeat logo"
      width={size}
      height={size}
      className="shrink-0 rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-lg font-extrabold tracking-tight lowercase text-foreground", className)}>
      <span className="text-foreground">play</span>
      <span className="text-primary">b</span>
      <span className="text-foreground">eat</span>
    </span>
  );
}
