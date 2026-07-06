"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

/**
 * PLAYBEAT brand logo.
 *
 * Logo mark: rounded-square with logo.png image
 * Wordmark: "PLAY" in silver/white, "BEAT" in red, "T" accent in blue
 * Matches the PlayBeat Digital brand identity (black bg + silver + red + blue).
 */
export function Logo({ className, showWordmark = true, size = 36 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 cursor-pointer select-none", className)}>
      <LogoMark size={size} />
      {showWordmark && <LogoWordmark />}
    </div>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="PLAYBEAT logo"
      width={size}
      height={size}
      className="shrink-0 rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-xl font-black uppercase tracking-tight",
        className
      )}
      style={{ letterSpacing: "-0.02em" }}
    >
      <span style={{ color: "#e2e8f0" }}>PLAY</span>
      <span style={{ color: "#ef4444" }}>BEA</span>
      <span style={{ color: "#3b82f6" }}>T</span>
    </span>
  );
}
