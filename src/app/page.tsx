"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlaybeatStore } from "@/lib/store";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { VendorStudio } from "@/components/playbeat/vendor-studio";
import { AffiliateHub } from "@/components/playbeat/affiliate-hub";
import { Analytics } from "@/components/playbeat/analytics";
import { AdminConsole } from "@/components/playbeat/admin-console";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";
import { Providers } from "@/components/playbeat/providers";

function TabContent() {
  const activeTab = usePlaybeatStore((s) => s.activeTab);

  const content = React.useMemo(() => {
    switch (activeTab) {
      case "marketplace":
        return <Marketplace />;
      case "vendor":
        return <VendorStudio />;
      case "affiliate":
        return <AffiliateHub />;
      case "analytics":
        return <Analytics />;
      case "admin":
        return <AdminConsole />;
      default:
        return <Marketplace />;
    }
  }, [activeTab]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <TabContent />
        </main>
        <Footer />
        {/* Global overlays */}
        <ProductDetailSheet />
        <CartSheet />
      </div>
    </Providers>
  );
}
