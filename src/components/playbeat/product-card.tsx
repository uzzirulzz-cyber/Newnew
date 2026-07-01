"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Heart,
  ShoppingCart,
  Star,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCover } from "./product-cover";
import { StarRating } from "./star-rating";
import { usePlaybeatStore } from "@/lib/store";
import { formatMoney, type Product } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const openProduct = usePlaybeatStore((s) => s.openProduct);
  const addToCart = usePlaybeatStore((s) => s.addToCart);
  const setCartOpen = usePlaybeatStore((s) => s.setCartOpen);
  const favorites = usePlaybeatStore((s) => s.favorites);
  const toggleFavorite = usePlaybeatStore((s) => s.toggleFavorite);
  const favorited = favorites.includes(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.effectivePrice === 0 && product.type === "AFFILIATE_PRODUCT") {
      toast.info("This is an affiliate offer — use your referral link instead.");
      return;
    }
    addToCart(product);
    toast.success(`${product.title} added to cart`);
    setCartOpen(true);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
    toast.success(favorited ? "Removed from favorites" : "Added to favorites");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Card
        onClick={() => openProduct(product.slug)}
        className="group relative cursor-pointer overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
      >
        <div className="relative">
          <ProductCover
            cover={product.cover}
            className="aspect-[4/3] w-full rounded-none"
            iconSize={56}
          />
          {/* Top-left featured badge */}
          {product.featured && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur">
              <Sparkles className="size-3" />
              Featured
            </div>
          )}
          {/* Top-right discount badge */}
          {product.discountPercent > 0 && (
            <div className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
              −{product.discountPercent}%
            </div>
          )}
          {/* Favorite heart */}
          <button
            onClick={handleFavorite}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-background/70 backdrop-blur transition-all hover:bg-background"
          >
            <Heart
              className={cn(
                "size-4 transition-all",
                favorited
                  ? "fill-primary text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            />
          </button>
        </div>

        <CardContent className="space-y-2 p-4">
          {/* Vendor row */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">
              {product.vendor?.storeName || "Independent"}
            </span>
            {product.vendor?.verified && (
              <BadgeCheck className="size-3.5 shrink-0 text-primary" />
            )}
          </div>

          {/* Title */}
          <h3 className="line-clamp-1 font-semibold leading-tight">
            {product.title}
          </h3>

          {/* Short description */}
          {product.shortDescription && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center justify-between">
            <StarRating
              rating={product.rating}
              showValue
              reviewCount={product.reviewCount}
            />
            <span className="text-[10px] text-muted-foreground">
              {product.salesCount.toLocaleString()} sold
            </span>
          </div>

          {/* Price + add to cart */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground">
                {product.effectivePrice === 0
                  ? product.type === "AFFILIATE_PRODUCT"
                    ? "Free"
                    : "Free"
                  : formatMoney(product.effectivePrice)}
              </span>
              {product.discountPrice !== null && product.discountPercent > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatMoney(product.price)}
                </span>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="gap-1"
              aria-label={`Add ${product.title} to cart`}
            >
              <ShoppingCart className="size-3.5" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/60">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <CardContent className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="flex justify-between pt-1">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-7 w-14 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
