"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";
import { usePlaybeatStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { PublicLayout } from "@/components/website-builder/public-layout";
import { Loader2 } from "lucide-react";

/**
 * Catch-all slug page: /[slug]
 *
 * Handles two kinds of URLs:
 *  1. Category URLs — /subscriptions, /ai-tools, /software, /iptv
 *     → renders the Marketplace with the category filter applied.
 *  2. CMS pages — /about, /privacy, /terms, etc.
 *     → renders a static page from the CmsPage collection.
 *
 * Category slugs are checked first (static list). Anything else is treated
 * as a CMS page lookup. If neither matches, the user is redirected home.
 */

const CATEGORY_SLUGS = ["subscriptions", "ai-tools", "software", "iptv", "independent"];

type StaticPageDoc = {
  title: string;
  content: string;
  updatedAt: string;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function CategoryView({ slug }: { slug: string }) {
  const setNavFilter = usePlaybeatStore((s) => s.setNavFilter);
  const setSearchQuery = usePlaybeatStore((s) => s.setSearchQuery);

  React.useEffect(() => {
    setNavFilter(slug, "popular");
    setSearchQuery("");
  }, [slug, setNavFilter, setSearchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Marketplace />
      </main>
      <Footer />
      <ProductDetailSheet />
      <CartSheet />
    </div>
  );
}

function CmsPageView({ slug }: { slug: string }) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["static-page", slug],
    queryFn: () => api.staticPage(slug),
    enabled: !!slug,
  });

  const page = data?.page as StaticPageDoc | undefined;

  React.useEffect(() => {
    if (!slug) return;
    if (isError) {
      router.replace("/");
    }
  }, [slug, isError, router]);

  if (isLoading || !page) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 pt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">{page.title}</h1>
          <p className="text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
            Last updated {formatDate(page.updatedAt)}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}

export default function SlugPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  // Category URLs take precedence.
  if (CATEGORY_SLUGS.includes(slug)) {
    return (
      <React.Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <CategoryView slug={slug} />
      </React.Suspense>
    );
  }

  // Everything else → CMS page.
  return <CmsPageView slug={slug} />;
}
