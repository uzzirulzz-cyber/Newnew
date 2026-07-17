"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";
import { usePlaybeatStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

/**
 * Product page: /product/[slug]
 *
 * Examples:
 *   /product/netflix-premium-4k → Netflix Premium 4K product page
 *   /product/geo-iptv           → GEO IPTV product page
 *   /product/chatgpt-plus       → ChatGPT Plus product page
 *
 * This page opens the product detail sheet for the given slug.
 */
function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const setActiveProductSlug = usePlaybeatStore((s: any) => s.setActiveProductSlug);
  const setProductDetailOpen = usePlaybeatStore((s: any) => s.setProductDetailOpen);

  React.useEffect(() => {
    if (slug) {
      // Open the product detail sheet with this slug
      setActiveProductSlug(slug);
      setProductDetailOpen(true);
    }
  }, [slug, setActiveProductSlug, setProductDetailOpen]);

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

export default function ProductPageWrapper() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProductPage />
    </React.Suspense>
  );
}
