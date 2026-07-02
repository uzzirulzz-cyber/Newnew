"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlaybeatStore, canAccessTab } from "@/lib/store";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { AffiliateHub } from "@/components/playbeat/affiliate-hub";
import { Analytics } from "@/components/playbeat/analytics";
import { AdminConsole } from "@/components/playbeat/admin-console";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";

function TabContent() {
  const activeTab = usePlaybeatStore((s) => s.activeTab);
  const setActiveTab = usePlaybeatStore((s) => s.setActiveTab);
  const user = usePlaybeatStore((s) => s.user);

  // Guard: if the current user can no longer access the active tab (e.g. they
  // signed out while viewing an operator dashboard), fall back to the public
  // Marketplace so the storefront never exposes admin controls to customers.
  React.useEffect(() => {
    if (!canAccessTab(activeTab, user?.role)) {
      setActiveTab("marketplace");
    }
  }, [activeTab, user?.role, setActiveTab]);

  // Effective tab respects access; operator tabs render nothing until access
  // is confirmed (the effect above will redirect).
  const effectiveTab: typeof activeTab = canAccessTab(activeTab, user?.role)
    ? activeTab
    : "marketplace";

  const content = React.useMemo(() => {
    switch (effectiveTab) {
      case "marketplace":
        return <Marketplace />;
      case "affiliate":
        return <AffiliateHub />;
      case "analytics":
        return <Analytics />;
      case "admin":
        return <AdminConsole />;
      default:
        return <Marketplace />;
    }
  }, [effectiveTab]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={effectiveTab}
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
  );
}
