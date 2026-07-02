"use client";

import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BrandStripProps {
  /** Image URL under /brand/ */
  image: string;
  /** Eyebrow label */
  eyebrow: string;
  /** Headline (supports a gold-highlighted segment) */
  title: React.ReactNode;
  /** Supporting copy */
  description: string;
  /** CTA button label */
  cta: string;
  onCta?: () => void;
  /** Lucide icon for the CTA */
  icon?: LucideIcon;
  /** Overlay intensity — heavier = darker */
  overlay?: "light" | "medium" | "heavy";
  /** Text alignment */
  align?: "left" | "center";
  className?: string;
}

const OVERLAY = {
  light: "from-background/60 via-background/40 to-background/70",
  medium: "from-background/80 via-background/60 to-background/85",
  heavy: "from-background/92 via-background/80 to-background/92",
};

export function BrandStrip({
  image,
  eyebrow,
  title,
  description,
  cta,
  onCta,
  icon: Icon = ArrowRight,
  overlay = "medium",
  align = "left",
  className,
}: BrandStripProps) {
  return (
    <section className={cn("relative overflow-hidden border-y border-border/40", className)}>
      {/* Background image — covers the strip, fixed on desktop for parallax feel */}
      <div
        className="absolute inset-0 bg-cover bg-center md:bg-fixed"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      {/* Dark gradient overlay for readability */}
      <div className={cn("absolute inset-0 bg-gradient-to-r", OVERLAY[overlay])} />
      {/* Bottom fade into page bg for smooth transition */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />

      <div
        className={cn(
          "relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20",
          align === "center" && "text-center",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className={cn("max-w-2xl", align === "center" && "mx-auto")}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent backdrop-blur">
            {eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-base text-foreground/80 sm:text-lg">
            {description}
          </p>
          <div className={cn("mt-7", align === "center" && "flex justify-center")}>
            <Button
              size="lg"
              onClick={onCta}
              className="h-12 gap-2 px-6 text-sm font-semibold uppercase tracking-wide"
            >
              {cta}
              <Icon className="size-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
