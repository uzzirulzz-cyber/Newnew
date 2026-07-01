"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  ShoppingCart,
  Zap,
  Loader2,
  Tag,
  FileText,
  HardDrive,
  History,
  ShieldCheck,
  Lock,
  MessageSquare,
  Star,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCover } from "./product-cover";
import { StarRating } from "./star-rating";
import { usePlaybeatStore } from "@/lib/store";
import {
  api,
  formatMoney,
  formatDate,
  type Review,
} from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
      <Icon className="size-3.5 text-primary" />
      <div className="text-xs">
        <div className="text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

export function ProductDetailSheet() {
  const slug = usePlaybeatStore((s) => s.selectedProductSlug);
  const close = usePlaybeatStore((s) => s.closeProduct);
  const addToCart = usePlaybeatStore((s) => s.addToCart);
  const setCartOpen = usePlaybeatStore((s) => s.setCartOpen);
  const user = usePlaybeatStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.product(slug as string),
    enabled: !!slug,
    staleTime: 30_000,
  });

  const product = data?.product;
  const reviews: Review[] = data?.reviews ?? [];
  const breakdown = data?.ratingBreakdown ?? [];
  const totalReviews = reviews.length || product?.reviewCount || 0;

  // New review form state
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!slug) {
      setRating(5);
      setTitle("");
      setComment("");
    }
  }, [slug]);

  const handleAddToCart = (mode: "cart" | "buy") => {
    if (!product) return;
    if (product.effectivePrice === 0 && product.type === "AFFILIATE_PRODUCT") {
      toast.info("This is an affiliate offer — use your referral link.");
      return;
    }
    addToCart(product);
    if (mode === "buy") {
      setCartOpen(true);
      close();
    } else {
      toast.success(`${product.title} added to cart`);
      setCartOpen(true);
    }
  };

  const submitReview = async () => {
    if (!product) return;
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    setSubmitting(true);
    try {
      await api.submitReview({
        productId: product.id,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      toast.success("Review submitted — verified purchase badge applied");
      setTitle("");
      setComment("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["product", slug] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const open = !!slug;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle className="text-base">
            {isLoading ? "Loading product..." : product?.title || "Product"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            View product details, reviews, and purchase options.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pb-scrollbar">
          {isLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="aspect-[16/9] w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-1/3" />
            </div>
          ) : isError || !product ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Couldn&apos;t load this product. Please try again.
            </div>
          ) : (
            <div className="space-y-6 p-4">
              {/* Cover + title */}
              <div className="space-y-3">
                <ProductCover
                  cover={product.cover}
                  className="aspect-[16/9] w-full"
                  iconSize={72}
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.type.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                    {product.category && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: product.category.color || undefined,
                          color: product.category.color || undefined,
                        }}
                      >
                        {product.category.name}
                      </Badge>
                    )}
                    {product.featured && (
                      <Badge className="bg-amber-400/20 text-amber-300">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold leading-tight">
                    {product.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {product.vendor && (
                      <span className="flex items-center gap-1">
                        {product.vendor.storeName}
                        {product.vendor.verified && (
                          <BadgeCheck className="size-3.5 text-primary" />
                        )}
                      </span>
                    )}
                    <StarRating
                      rating={product.rating}
                      showValue
                      reviewCount={product.reviewCount}
                    />
                  </div>
                </div>
              </div>

              {/* Price block */}
              <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    {product.effectivePrice === 0
                      ? "Free"
                      : formatMoney(product.effectivePrice)}
                  </span>
                  {product.discountPrice !== null &&
                    product.discountPercent > 0 && (
                      <>
                        <span className="text-base text-muted-foreground line-through">
                          {formatMoney(product.price)}
                        </span>
                        <Badge className="bg-accent text-accent-foreground">
                          −{product.discountPercent}%
                        </Badge>
                      </>
                    )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {product.licenseType && (
                    <InfoPill
                      icon={ShieldCheck}
                      label="License"
                      value={product.licenseType}
                    />
                  )}
                  {product.version && (
                    <InfoPill
                      icon={Tag}
                      label="Version"
                      value={product.version}
                    />
                  )}
                  {product.fileSize && (
                    <InfoPill
                      icon={HardDrive}
                      label="Size"
                      value={product.fileSize}
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  About this product
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      <Tag className="size-2.5" />
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Changelog */}
              {product.changelog.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                    <History className="size-3.5" /> Changelog
                  </h3>
                  <div className="space-y-2">
                    {product.changelog.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border/60 bg-card/40 p-3"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <Badge className="bg-primary/15 text-primary">
                            v{c.version}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatDate(c.date)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{c.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Reviews */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-1.5 text-base font-semibold">
                  <MessageSquare className="size-4" />
                  Reviews ({totalReviews})
                </h3>

                {/* Summary */}
                {totalReviews > 0 && (
                  <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card/40 p-4">
                      <div className="text-4xl font-bold">
                        {product.rating.toFixed(1)}
                      </div>
                      <StarRating rating={product.rating} size={16} />
                      <div className="mt-1 text-xs text-muted-foreground">
                        {totalReviews} reviews
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const entry = breakdown.find((b) => b.star === star);
                        const count = entry?.count || 0;
                        const pct =
                          totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                          <div
                            key={star}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className="w-3 text-muted-foreground">
                              {star}
                            </span>
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <Progress
                              value={pct}
                              className="h-1.5 flex-1"
                            />
                            <span className="w-6 text-right text-muted-foreground">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews list */}
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No reviews yet. Be the first!
                    </p>
                  ) : (
                    reviews.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border border-border/60 bg-card/40 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                              {r.authorName.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-sm font-medium">
                              {r.authorName}
                            </span>
                            {r.verified && (
                              <Badge
                                variant="outline"
                                className="border-primary/30 text-[10px] text-primary"
                              >
                                <BadgeCheck className="size-2.5" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(r.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <StarRating rating={r.rating} size={12} />
                        </div>
                        {r.title && (
                          <p className="mt-1.5 text-sm font-semibold">
                            {r.title}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {r.comment}
                        </p>
                        {r.vendorReply && (
                          <div className="mt-2 rounded-md border-l-2 border-primary bg-primary/5 p-2 text-xs">
                            <div className="font-medium text-primary">
                              Vendor reply
                            </div>
                            {r.vendorReply}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add review form */}
                <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <h4 className="text-sm font-semibold">Leave a review</h4>
                  {!user ? (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                      <Lock className="size-3.5 text-primary" />
                      Sign in to leave a review. Verified-purchase reviews get a
                      badge.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Your rating</Label>
                        <StarRating
                          value={rating}
                          onChange={setRating}
                          size={22}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="review-title" className="text-xs">
                          Title (optional)
                        </Label>
                        <Input
                          id="review-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Summarize your experience"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="review-comment" className="text-xs">
                          Comment
                        </Label>
                        <Textarea
                          id="review-comment"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="What did you like? What could be better?"
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={submitReview}
                        disabled={submitting || !comment.trim()}
                        size="sm"
                      >
                        {submitting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <FileText className="size-3.5" />
                        )}
                        Submit review
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {product && !isLoading && (
          <div className="border-t border-border/60 bg-card/40 p-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleAddToCart("cart")}
              >
                <ShoppingCart className="size-4" />
                Add to cart
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleAddToCart("buy")}
              >
                <Zap className="size-4" />
                Buy now
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
