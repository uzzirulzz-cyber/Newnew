"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  detectCurrency,
  type Currency,
  type Product,
} from "./api-client";

export interface CartItem {
  product: Product;
  quantity: number;
}

export type TabKey =
  | "marketplace"
  | "vendor"
  | "affiliate"
  | "analytics"
  | "admin";

/**
 * Which nav tabs are visible for a given user role.
 *
 * The public storefront (home) is customer-facing and must NOT display any
 * admin/operator controls. Anonymous visitors and regular customers only see
 * the Marketplace. Operator dashboards are revealed only after signing in with
 * the appropriate role.
 */
export function visibleTabs(role: string | undefined | null): TabKey[] {
  if (!role || role === "CUSTOMER") return ["marketplace"];
  if (role === "ADMIN")
    return ["marketplace", "affiliate", "analytics", "admin"];
  return ["marketplace"];
}

export function canAccessTab(
  tab: TabKey,
  role: string | undefined | null,
): boolean {
  return visibleTabs(role).includes(tab);
}

interface PlaybeatState {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;

  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartSubtotal: () => number;

  cartOpen: boolean;
  setCartOpen: (b: boolean) => void;

  selectedProductSlug: string | null;
  openProduct: (slug: string) => void;
  closeProduct: () => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;

  appliedCoupon: { code: string; discount: number } | null;
  setAppliedCoupon: (c: { code: string; discount: number } | null) => void;

  searchQuery: string;
  setSearchQuery: (s: string) => void;

  // Navigation-driven marketplace filter (set by header nav links)
  navCategory: string;
  navSort: string;
  setNavFilter: (category: string, sort?: string) => void;

  // Display currency — PKR for Pakistan, USD elsewhere. Auto-detected on
  // first load, manually toggleable via the header currency switch.
  currency: Currency;
  setCurrency: (c: Currency) => void;

  // Auth (lightweight demo)
  user: { id: string; name: string; email: string; role: string } | null;
  setUser: (u: PlaybeatState["user"]) => void;
}

export const usePlaybeatStore = create<PlaybeatState>()(
  persist(
    (set, get) => ({
      activeTab: "marketplace",
      setActiveTab: (t) => set({ activeTab: t }),

      cart: [],
      addToCart: (product, qty = 1) => {
        const existing = get().cart.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            cart: get().cart.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
          });
        } else {
          set({ cart: [...get().cart, { product, quantity: qty }] });
        }
      },
      removeFromCart: (productId) =>
        set({ cart: get().cart.filter((i) => i.product.id !== productId) }),
      updateQuantity: (productId, qty) => {
        if (qty <= 0) {
          set({
            cart: get().cart.filter((i) => i.product.id !== productId),
          });
          return;
        }
        set({
          cart: get().cart.map((i) =>
            i.product.id === productId ? { ...i, quantity: qty } : i
          ),
        });
      },
      clearCart: () => set({ cart: [], appliedCoupon: null }),
      cartCount: () =>
        get().cart.reduce((sum, i) => sum + i.quantity, 0),
      cartSubtotal: () =>
        get().cart.reduce(
          (sum, i) => sum + i.product.effectivePrice * i.quantity,
          0
        ),

      cartOpen: false,
      setCartOpen: (b) => set({ cartOpen: b }),

      selectedProductSlug: null,
      openProduct: (slug) => set({ selectedProductSlug: slug }),
      closeProduct: () => set({ selectedProductSlug: null }),

      favorites: [],
      toggleFavorite: (id) => {
        const f = get().favorites;
        if (f.includes(id)) {
          set({ favorites: f.filter((x) => x !== id) });
        } else {
          set({ favorites: [...f, id] });
        }
      },

      appliedCoupon: null,
      setAppliedCoupon: (c) => set({ appliedCoupon: c }),

      searchQuery: "",
      setSearchQuery: (s) => set({ searchQuery: s }),

      navCategory: "",
      navSort: "popular",
      setNavFilter: (category, sort) =>
        set({ navCategory: category, navSort: sort ?? "popular" }),

      currency: detectCurrency(),
      setCurrency: (c) => set({ currency: c }),

      user: null,
      setUser: (u) => set({ user: u }),
    }),
    {
      name: "playbeat-storage",
      // Persist only cart, favorites, user, searchQuery, currency
      partialize: (state) => ({
        cart: state.cart,
        favorites: state.favorites,
        user: state.user,
        searchQuery: state.searchQuery,
        currency: state.currency,
      }),
    }
  )
);
