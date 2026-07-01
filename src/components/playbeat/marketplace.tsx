"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Package,
  Store,
  DollarSign,
  Users,
  ArrowRight,
  X,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { ProductCover } from "./product-cover";
import { resolveIcon } from "./product-cover";
import { usePlaybeatStore } from "@/lib/store";
import {
  api,
  formatMoney,
  formatNumber,
  type Product,
  type ProductQuery,
} from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
];

const TYPE_OPTIONS = [
  { value: "AI_TOOL", label: "AI Tool" },
  { value: "SOFTWARE_LICENSE", label: "Software License" },
  { value: "SAAS_SUBSCRIPTION", label: "SaaS Subscription" },
  { value: "DIGITAL_DOWNLOAD", label: "Digital Download" },
  { value: "EBOOK", label: "eBook" },
  { value: "TEMPLATE", label: "Template" },
  { value: "GRAPHICS", label: "Graphics" },
  { value: "COURSE", label: "Course" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "AFFILIATE_PRODUCT", label: "Affiliate Offer" },
];

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <div className="text-lg font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Hero() {
  const setSearchQuery = usePlaybeatStore((s) => s.setSearchQuery);
  const [local, setLocal] = React.useState("");
  const gridRef = React.useRef<HTMLDivElement>(null);

  const { data: dash } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.analytics(),
    staleTime: 60_000,
  });

  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => api.featuredProducts(),
    staleTime: 60_000,
  });

  const summary = dash?.summary;
  const preview = (featured?.items || []).slice(0, 3);

  const explore = () => {
    setSearchQuery(local);
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 pb-grid opacity-60" />
      <div className="absolute inset-0 pb-glow" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col justify-center">
          <Badge
            variant="outline"
            className="mb-4 w-fit border-primary/40 bg-primary/10 text-primary"
          >
            <Sparkles className="size-3" />
            Over {summary?.products ?? 24} digital products · 8 verified vendors
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            The global marketplace for{" "}
            <span className="pb-text-gradient">
              AI tools, software &amp; digital products
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Discover, sell, and resell AI tools, software licenses, SaaS
            subscriptions, templates, courses, and affiliate offers — all in one
            premium storefront.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && explore()}
                placeholder="Search AI tools, templates, courses..."
                className="h-11 pl-9"
              />
            </div>
            <Button size="lg" onClick={explore} className="h-11">
              Explore
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat
              icon={Package}
              label="Products"
              value={summary ? formatNumber(summary.products) : "—"}
            />
            <HeroStat
              icon={Store}
              label="Vendors"
              value={summary ? formatNumber(summary.vendors) : "—"}
            />
            <HeroStat
              icon={DollarSign}
              label="Revenue"
              value={summary ? formatMoney(summary.revenue) : "—"}
            />
            <HeroStat
              icon={Users}
              label="Customers"
              value={summary ? formatNumber(summary.customers) : "—"}
            />
          </div>
        </div>

        {/* Floating product preview */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-full w-full max-w-md">
              {preview.map((p, i) => {
                const positions = [
                  "left-0 top-6 rotate-[-6deg] z-10",
                  "right-0 top-0 rotate-[4deg] z-20",
                  "left-1/4 bottom-0 rotate-[2deg] z-30",
                ];
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                    className={cn(
                      "absolute w-64 cursor-pointer",
                      positions[i]
                    )}
                    onClick={() =>
                      usePlaybeatStore.getState().openProduct(p.slug)
                    }
                  >
                    <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-xl">
                      <ProductCover
                        cover={p.cover}
                        className="aspect-[4/3] w-full rounded-none"
                        iconSize={48}
                      />
                      <CardContent className="space-y-1 p-3">
                        <div className="text-xs text-muted-foreground">
                          {p.vendor?.storeName}
                        </div>
                        <div className="line-clamp-1 text-sm font-semibold">
                          {p.title}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-primary">
                            {p.effectivePrice === 0
                              ? "Free"
                              : formatMoney(p.effectivePrice)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {p.rating.toFixed(1)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div ref={gridRef} />
    </section>
  );
}

function CategoryPills({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (slug: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories(),
    staleTime: 60_000,
  });
  const items = data?.items ?? [];

  return (
    <div className="flex gap-2 overflow-x-auto pb-scrollbar pb-2">
      <button
        onClick={() => onSelect("")}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          selected === ""
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <Sparkles className="size-3" />
        All
      </button>
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-24 shrink-0 animate-pulse rounded-full bg-muted"
            />
          ))
        : items.map((c) => {
            const Icon = resolveIcon(c.icon);
            const active = selected === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(active ? "" : c.slug)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: c.color || "#10b981" }}
                />
                <Icon className="size-3" />
                {c.name}
                <span className="ml-0.5 text-[10px] opacity-70">
                  {c.productCount}
                </span>
              </button>
            );
          })}
    </div>
  );
}

function FilterBar({
  query,
  setQuery,
}: {
  query: ProductQuery;
  setQuery: (q: ProductQuery) => void;
}) {
  const reset = () =>
    setQuery({
      search: query.search,
      category: query.category,
      sort: "popular",
      page: 1,
      limit: 12,
    });

  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            <SlidersHorizontal className="inline size-3" /> Keyword
          </Label>
          <Input
            value={query.search || ""}
            onChange={(e) =>
              setQuery({ ...query, search: e.target.value, page: 1 })
            }
            placeholder="Refine by keyword..."
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={query.type || "ALL"}
            onValueChange={(v) =>
              setQuery({
                ...query,
                type: v === "ALL" ? undefined : v,
                page: 1,
              })
            }
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sort</Label>
          <Select
            value={query.sort || "popular"}
            onValueChange={(v) => setQuery({ ...query, sort: v, page: 1 })}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Min $</Label>
            <Input
              type="number"
              min={0}
              value={query.minPrice || ""}
              onChange={(e) =>
                setQuery({
                  ...query,
                  minPrice: e.target.value || undefined,
                  page: 1,
                })
              }
              placeholder="0"
              className="h-9 w-20"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Max $</Label>
            <Input
              type="number"
              min={0}
              value={query.maxPrice || ""}
              onChange={(e) =>
                setQuery({
                  ...query,
                  maxPrice: e.target.value || undefined,
                  page: 1,
                })
              }
              placeholder="∞"
              className="h-9 w-20"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 space-y-0 pb-1.5">
          <Switch
            id="featured"
            checked={query.featured === "true"}
            onCheckedChange={(c) =>
              setQuery({
                ...query,
                featured: c ? "true" : undefined,
                page: 1,
              })
            }
          />
          <Label htmlFor="featured" className="text-xs text-muted-foreground">
            Featured only
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="h-9">
          <X className="size-3.5" /> Clear
        </Button>
      </CardContent>
    </Card>
  );
}

export function Marketplace() {
  const searchQuery = usePlaybeatStore((s) => s.searchQuery);

  const [query, setQuery] = React.useState<ProductQuery>({
    search: searchQuery || "",
    category: "",
    type: undefined,
    sort: "popular",
    page: 1,
    limit: 12,
  });

  // Debounce search sync
  React.useEffect(() => {
    const t = setTimeout(() => {
      setQuery((q) => ({ ...q, search: searchQuery, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", query],
    queryFn: () => api.products(query),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const items: Product[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;

  return (
    <div>
      <Hero />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h2 className="text-xl font-bold">Browse by category</h2>
          <p className="text-sm text-muted-foreground">
            Tap a category to filter the grid below.
          </p>
        </div>
        <CategoryPills
          selected={query.category || ""}
          onSelect={(slug) => setQuery({ ...query, category: slug, page: 1 })}
        />

        <FilterBar query={query} setQuery={setQuery} />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {query.category ? "Filtered" : "All products"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {total} {total === 1 ? "result" : "results"}
            </span>
          </h2>
          {isError && (
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          )}
        </div>

        {isError ? (
          <Card className="bg-card/60">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <TrendingUp className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Couldn&apos;t load products</p>
                <p className="text-sm text-muted-foreground">
                  Something went wrong. Please try again.
                </p>
              </div>
              <Button onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        ) : isLoading && items.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="bg-card/60">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <Package className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No products found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search keywords.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setQuery({
                    search: "",
                    category: "",
                    type: undefined,
                    sort: "popular",
                    page: 1,
                    limit: 12,
                  })
                }
              >
                Reset filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-6 justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setQuery({ ...query, page: Math.max(1, page - 1) });
                  }}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                const p = i + 1;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setQuery({ ...query, page: p });
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 7 && (
                <PaginationItem>
                  <span className="px-2 text-muted-foreground">...</span>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setQuery({ ...query, page: Math.min(totalPages, page + 1) });
                  }}
                  aria-disabled={page >= totalPages}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
