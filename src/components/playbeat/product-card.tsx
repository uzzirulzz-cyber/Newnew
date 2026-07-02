"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Heart,
  ShoppingCart,
  Star,
  Sparkles,
  Zap,
  Download,
  Crown,
  KeyRound,
  TrendingUp,
  Eye,
  Share2,
  Check,
  Package,
  HardDrive,
  GitBranch,
  Infinity as InfinityIcon,
  Award,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCover } from "./product-cover";
import { StarRating } from "./star-rating";
import { usePlaybeatStore } from "@/lib/store";
import { formatPrice, displayProductPrice, type Product } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

/* ---------- Reusable badge component ---------- */
function ProductBadge({
  icon: Icon,
  label,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur",
        className,
      )}
    >
      {Icon && <Icon className="size-2.5" />}
      {label}
    </span>
  );
}

/* ---------- Metadata icon chip ---------- */
function MetaChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span
      className="flex items-center gap-1 text-[10px] text-muted-foreground"
      title={label}
    >
      <Icon className="size-3 shrink-0 text-accent" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const openProduct = usePlaybeatStore((s) => s.openProduct);
  const addToCart = usePlaybeatStore((s) => s.addToCart);
  const setCartOpen = usePlaybeatStore((s) => s.setCartOpen);
  const currency = usePlaybeatStore((s) => s.currency);
  const favorites = usePlaybeatStore((s) => s.favorites);
  const toggleFavorite = usePlaybeatStore((s) => s.toggleFavorite);
  const favorited = favorites.includes(product.id);
  const [shared, setShared] = React.useState(false);

  const isAffiliate = product.type === "AFFILIATE_PRODUCT";
  const isSubscription =
    product.type === "SAAS_SUBSCRIPTION" ||
    product.type === "MEMBERSHIP" ||
    product.licenseType?.toLowerCase().includes("subscription") ||
    product.licenseType?.toLowerCase().includes("membership");
  const isFree = product.effectivePrice === 0;
  const isBestseller = product.salesCount > 800;
  const isAI = product.type === "AI_TOOL" || product.tags?.includes("AI");
  const isDigital = !!product.downloadFile;
  const hasLicense = !!product.licenseType;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAffiliate) {
      toast.info("This is an affiliate offer — use your referral link instead.");
      return;
    }
    addToCart(product);
    toast.success(`${product.title} added to cart`);
    setCartOpen(true);
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "AddToCart", {
        content_name: product.title,
        content_ids: [product.id],
        content_type: "product",
        value: product.effectivePrice,
        currency: product.currency || "USD",
      });
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAffiliate) {
      toast.info("This is an affiliate offer — use your referral link instead.");
      return;
    }
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: product.title,
        content_ids: [product.id],
        content_type: "product",
        value: product.effectivePrice,
        currency: product.currency || "USD",
      });
    }
    // Lemon Squeezy products redirect to the LS hosted checkout
    if (product.buyNowUrl) {
      window.open(product.buyNowUrl, "_blank", "noopener,noreferrer");
      return;
    }
    addToCart(product);
    setCartOpen(true);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
    toast.success(favorited ? "Removed from favorites" : "Added to favorites");
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    openProduct(product.slug);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?p=${product.slug}`;
    if (navigator.share) {
      navigator.share({ title: product.title, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setShared(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className="h-full"
    >
      <Card
        onClick={() => openProduct(product.slug)}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5"
      >
        {/* ---- Thumbnail (16:9) with zoom-on-hover ---- */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <div className="size-full transition-transform duration-500 group-hover:scale-105">
            <ProductCover
              cover={product.cover}
              className="size-full rounded-none"
              iconSize={48}
            />
          </div>
          {/* gradient overlay for badge legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-card/30" />

          {/* Top-left badge stack */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.featured && (
              <ProductBadge
                icon={Sparkles}
                label="Featured"
                className="bg-accent text-accent-foreground"
              />
            )}
            {isBestseller && (
              <ProductBadge
                icon={Crown}
                label="Bestseller"
                className="bg-primary text-primary-foreground"
              />
            )}
            {isAI && (
              <ProductBadge
                icon={Zap}
                label="AI Pick"
                className="bg-background/80 text-foreground"
              />
            )}
          </div>

          {/* Top-right discount badge */}
          {product.discountPercent > 0 && (
            <div className="absolute right-2 top-2">
              <ProductBadge
                label={`−${product.discountPercent}%`}
                className="bg-destructive text-white"
              />
            </div>
          )}

          {/* Top-right action buttons (wishlist + share) — fade in on hover */}
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [.group:hover_&]:opacity-100" style={{ opacity: undefined }}>
          </div>
          <div className="absolute bottom-2 right-2 flex gap-1">
            <button
              onClick={handleFavorite}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
              className="grid size-7 place-items-center rounded-full bg-background/80 backdrop-blur transition-all hover:scale-110 hover:bg-background"
            >
              <Heart
                className={cn(
                  "size-3.5 transition-all",
                  favorited
                    ? "fill-primary text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
              />
            </button>
            <button
              onClick={handleShare}
              aria-label="Share product"
              className="grid size-7 place-items-center rounded-full bg-background/80 backdrop-blur transition-all hover:scale-110 hover:bg-background"
            >
              {shared ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <Share2 className="size-3.5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Subscription badge */}
          {isSubscription && (
            <div className="absolute bottom-2 left-2">
              <ProductBadge
                icon={InfinityIcon}
                label="Subscription"
                className="bg-primary/90 text-primary-foreground"
              />
            </div>
          )}
        </div>

        {/* ---- Body ---- */}
        <CardContent className="flex flex-1 flex-col gap-2 p-3.5">
          {/* Category pill + vendor */}
          <div className="flex items-center justify-between gap-2">
            {product.category && (
              <Badge
                variant="outline"
                className="shrink-0 border-accent/30 text-[9px] uppercase tracking-wide text-accent"
              >
                {product.category.name}
              </Badge>
            )}
            <div className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
              <span className="truncate">
                {product.vendor?.storeName || "Independent"}
              </span>
              {product.vendor?.verified && (
                <BadgeCheck className="size-3 shrink-0 text-primary" />
              )}
            </div>
          </div>

          {/* Title (2 lines) */}
          <h3
            className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-accent"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Short description */}
          {product.shortDescription && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          {/* Rating + sales */}
          <div className="flex items-center justify-between">
            <StarRating
              rating={product.rating}
              showValue
              reviewCount={product.reviewCount}
            />
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="size-3" />
              {product.salesCount.toLocaleString()} sold
            </span>
          </div>

          {/* Metadata chips row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-border/40 py-2">
            {isDigital && <MetaChip icon={Download} label="Instant" />}
            <MetaChip icon={Package} label="Digital" />
            {hasLicense && <MetaChip icon={KeyRound} label="License" />}
            {product.fileSize && (
              <MetaChip icon={HardDrive} label={product.fileSize} />
            )}
            {product.version && (
              <MetaChip icon={GitBranch} label={`v${product.version}`} />
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-lg font-extrabold leading-none text-foreground">
                {isFree
                  ? "Free"
                  : displayProductPrice(product, currency)}
              </span>
              {product.discountPrice !== null && product.discountPercent > 0 && !product.priceFormatted && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground line-through">
                    {formatPrice(product.price, currency)}
                  </span>
                  <span className="rounded bg-primary/15 px-1 text-[9px] font-bold text-primary">
                    SAVE {product.discountPercent}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-auto flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleBuyNow}
              className="h-9 flex-1 gap-1.5 text-xs font-semibold"
              aria-label={`Buy ${product.title} now`}
            >
              <Zap className="size-3.5" />
              Buy Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToCart}
              className="h-9 gap-1.5 border-border/60 text-xs"
              aria-label={`Add ${product.title} to cart`}
            >
              <ShoppingCart className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleQuickView}
              className="h-9 gap-1.5 px-2 text-xs text-muted-foreground"
              aria-label={`Quick view ${product.title}`}
            >
              <Eye className="size-3.5" />
            </Button>
          </div>

          {/* Quick stats footer */}
          <div className="mt-1 grid grid-cols-3 gap-1 border-t border-border/40 pt-2 text-center">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground">
                {product.salesCount.toLocaleString()}
              </span>
              <span className="text-[8px] uppercase tracking-wide text-muted-foreground">
                Sales
              </span>
            </div>
            <div className="flex flex-col border-x border-border/40">
              <span className="flex items-center justify-center gap-0.5 text-[11px] font-bold text-foreground">
                <Star className="size-2.5 fill-accent text-accent" />
                {product.rating.toFixed(1)}
              </span>
              <span className="text-[8px] uppercase tracking-wide text-muted-foreground">
                Rating
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground">
                {product.reviewCount}
              </span>
              <span className="text-[8px] uppercase tracking-wide text-muted-foreground">
                Reviews
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/60">
      <div className="aspect-[16/9] w-full animate-pulse bg-muted" />
      <CardContent className="space-y-2.5 p-3.5">
        <div className="flex gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
        <div className="flex justify-between pt-1">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-12 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
