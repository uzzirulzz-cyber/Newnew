"use client";

import * as React from "react";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { usePlaybeatStore } from "@/lib/store";

/**
 * Shared category page — sets the nav filter to the given category slug on
 * mount, then renders the full marketplace shell (header + marketplace + footer).
 */
export function CategoryPage({ category, sort = "popular" }: { category: string; sort?: string }) {
  const setNavFilter = usePlaybeatStore((s) => s.setNavFilter);
  const setActiveTab = usePlaybeatStore((s) => s.setActiveTab);

  React.useEffect(() => {
    setActiveTab("marketplace");
    setNavFilter(category, sort);
  }, [category, sort, setActiveTab, setNavFilter]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Marketplace />
      </main>
      <Footer />
    </div>
  );
}
