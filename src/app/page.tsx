"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { FeaturedProjectorsInline } from "@/components/playbeat/featured-projectors";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";
import { usePlaybeatStore } from "@/lib/store";
import { CheckCircle2, XCircle, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * Home page — the storefront.
 *
 * URL params:
 *   ?payment=success  → shows success banner with order confirmation
 *   ?payment=failed   → shows failure banner
 *   ?category=games   → filters products by category
 *   ?sort=price_asc   → sorts products
 */
function StorefrontWithSearchParams() {
  const searchParams = useSearchParams();
  const setNavFilter = usePlaybeatStore((s) => s.setNavFilter);
  const setSearchQuery = usePlaybeatStore((s) => s.setSearchQuery);
  const setCartOpen = usePlaybeatStore((s) => s.setCartOpen);
  const [paymentBanner, setPaymentBanner] = React.useState<"success" | "failed" | null>(null);

  // Sync URL query params → Zustand store on mount + when params change
  React.useEffect(() => {
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "popular";
    const search = searchParams.get("search") || "";

    setNavFilter(category, sort);
    if (search) setSearchQuery(search);

    // Check for payment result
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success" || paymentStatus === "failed") {
      setPaymentBanner(paymentStatus);
      const msg = searchParams.get("msg") || "";
      const orderRef = searchParams.get("order") || searchParams.get("ref") || "";

      if (paymentStatus === "success") {
        toast.success(`Payment successful! Order ${orderRef}`, {
          description: msg || "Your order has been confirmed.",
          duration: 6000,
        });
      } else {
        toast.error(`Payment failed`, {
          description: msg || "Your transaction was not successful.",
          duration: 6000,
        });
      }

      // Clean the URL — remove payment params so refresh doesn't re-show banner
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment");
      newUrl.searchParams.delete("msg");
      newUrl.searchParams.delete("ref");
      newUrl.searchParams.delete("order");
      newUrl.searchParams.delete("rrn");
      newUrl.searchParams.delete("amount");
      newUrl.searchParams.delete("currency");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams, setNavFilter, setSearchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Payment result banner */}
      <AnimatePresence>
        {paymentBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-x-0 top-14 z-50 mx-auto max-w-2xl px-4 ${
              paymentBanner === "success" ? "" : ""
            }`}
          >
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${
                paymentBanner === "success"
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              {paymentBanner === "success" ? (
                <CheckCircle2 className="size-6 shrink-0 text-green-500" />
              ) : (
                <XCircle className="size-6 shrink-0 text-red-500" />
              )}
              <div className="flex-1">
                <h3 className="text-sm font-bold">
                  {paymentBanner === "success"
                    ? "Payment Successful!"
                    : "Payment Failed"}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {paymentBanner === "success"
                    ? `Order ${searchParams.get("order") || searchParams.get("ref") || ""} has been confirmed. Your license keys have been delivered to your email.`
                    : searchParams.get("msg") || "Your transaction was not successful. Please try again."}
                </p>
                {paymentBanner === "success" && (
                  <Button
                    size="sm"
                    className="mt-2 h-7 gap-1.5 text-xs"
                    onClick={() => {
                      setCartOpen(true);
                      setPaymentBanner(null);
                    }}
                  >
                    <ShoppingBag className="size-3" />
                    View Order
                  </Button>
                )}
              </div>
              <button
                onClick={() => setPaymentBanner(null)}
                className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* Featured Products — Smart Projectors pinned to top */}
        <FeaturedProjectorsInline />
        <Marketplace />
      </main>
      <Footer />
      {/* Global overlays */}
      <ProductDetailSheet />
      <CartSheet />
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <StorefrontWithSearchParams />
    </React.Suspense>
  );
}

