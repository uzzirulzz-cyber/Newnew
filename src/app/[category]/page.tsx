"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";
import { usePlaybeatStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

/**
 * Category page: /[category]
 *
 * Examples:
 *   /subscriptions → Streaming subscriptions (Netflix, Spotify, etc.)
 *   /ai-tools      → AI tools (ChatGPT, Claude, Midjourney, etc.)
 *   /software      → Software licenses (Windows, Office, Antivirus, VPN)
 *   /iptv          → IPTV & memberships
 *
 * This page reads the category from the URL and passes it to the Marketplace
 * component which filters products by category.
 */
function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const setNavFilter = usePlaybeatStore((s) => s.setNavFilter);
  const setSearchQuery = usePlaybeatStore((s) => s.setSearchQuery);

  React.useEffect(() => {
    // Set the category filter from the URL
    setNavFilter(category, "popular");
    setSearchQuery("");
  }, [category, setNavFilter, setSearchQuery]);

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

export default function CategoryPageWrapper() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <CategoryPage />
    </React.Suspense>
  );
}
