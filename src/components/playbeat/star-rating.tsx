"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  value?: number;
  onChange?: (v: number) => void;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
  readOnly?: boolean;
}

export function StarRating({
  rating,
  value,
  onChange,
  size = 14,
  showValue = false,
  reviewCount,
  className,
  readOnly,
}: StarRatingProps) {
  const current = value ?? rating ?? 0;
  const interactive = typeof onChange === "function" && !readOnly;
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? current;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => interactive && setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = display >= star - 0.25;
          const half = !filled && display >= star - 0.75;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(star)}
              onMouseEnter={() => interactive && setHover(star)}
              className={cn(
                "relative inline-flex",
                interactive
                  ? "cursor-pointer transition-transform hover:scale-110"
                  : "cursor-default"
              )}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                size={size}
                className={cn(
                  "transition-colors",
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : half
                    ? "fill-amber-400/50 text-amber-400"
                    : "fill-muted-foreground/20 text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-foreground/80 tabular-nums">
          {current.toFixed(1)}
        </span>
      )}
      {typeof reviewCount === "number" && (
        <span className="text-xs text-muted-foreground">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
