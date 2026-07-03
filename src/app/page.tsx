"use client";

import { PremiumLanding } from "@/components/playbeat/premium-landing";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";

export default function Home() {
  return (
    <>
      <PremiumLanding />
      {/* Global overlays */}
      <ProductDetailSheet />
      <CartSheet />
    </>
  );
}
