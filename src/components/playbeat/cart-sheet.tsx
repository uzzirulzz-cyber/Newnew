"use client";

import * as React from "react";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  Tag,
  Loader2,
  CheckCircle2,
  Copy,
  Download,
  PartyPopper,
  X,
  Lock,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCover } from "./product-cover";
import { usePlaybeatStore } from "@/lib/store";
import { api, formatInCurrency, displayProductPrice, type Order } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { value: "JAZZCASH", label: "JazzCash — Mobile Wallet / Card (Default)" },
  { value: "BANK_ALFALAH", label: "Bank Alfalah — IBFT / Cash Deposit" },
  { value: "EASYPAISA", label: "Easypaisa — Hosted Checkout" },
  { value: "PAYPAL", label: "PayPal — International / Cards" },
  { value: "CRYPTO", label: "Crypto — BTC/ETH/USDT/USDC" },
];

function CartRow({
  item,
}: {
  item: { product: any; quantity: number };
}) {
  const updateQuantity = usePlaybeatStore((s) => s.updateQuantity);
  const removeFromCart = usePlaybeatStore((s) => s.removeFromCart);
  const currency = usePlaybeatStore((s) => s.currency);
  const p = item.product;
  return (
    <div className="flex gap-3 rounded-lg border border-border/60 bg-card/40 p-3">
      <ProductCover
        cover={p.cover}
        className="size-16 shrink-0"
        iconSize={28}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="line-clamp-1 text-sm font-medium">{p.title}</div>
            <div className="text-xs text-muted-foreground">
              {p.vendor?.storeName || "Independent"}
            </div>
          </div>
          <button
            onClick={() => removeFromCart(p.id)}
            aria-label="Remove from cart"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/40">
            <button
              onClick={() => updateQuantity(p.id, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="grid size-7 place-items-center rounded-l-md hover:bg-accent/50"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(p.id, item.quantity + 1)}
              aria-label="Increase quantity"
              className="grid size-7 place-items-center rounded-r-md hover:bg-accent/50"
            >
              <Plus className="size-3" />
            </button>
          </div>
          <div className="text-sm font-semibold">
            {displayProductPrice(
              { effectivePrice: p.effectivePrice * item.quantity, currency: p.currency },
              currency,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSuccess({ order }: { order: Order }) {
  const close = usePlaybeatStore((s) => s.setCartOpen);
  const clearCart = usePlaybeatStore((s) => s.clearCart);
  const setActiveTab = usePlaybeatStore((s) => s.setActiveTab);
  const currency = usePlaybeatStore((s) => s.currency);

  const downloadables = order.items.filter((i) => i.licenseKey);

  return (
    <div className="flex h-full flex-col items-center gap-4 overflow-y-auto p-6 text-center pb-scrollbar">
      <div className="grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
        <PartyPopper className="size-8" />
      </div>
      <div>
        <h3 className="text-xl font-bold">Order placed!</h3>
        <p className="text-sm text-muted-foreground">
          Thank you for your purchase. Your order{" "}
          <span className="font-mono text-foreground">
            {order.orderNumber}
          </span>{" "}
          is confirmed.
        </p>
      </div>

      {downloadables.length > 0 && (
        <div className="w-full space-y-2 text-left">
          <div className="text-sm font-semibold">Your license keys</div>
          {order.items.map((it) => (
            <div
              key={it.id}
              className="rounded-lg border border-border/60 bg-card/40 p-3"
            >
              <div className="line-clamp-1 text-sm font-medium">
                {it.title}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted/60 px-2 py-1 font-mono text-xs">
                  {it.licenseKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => {
                    navigator.clipboard?.writeText(it.licenseKey);
                    toast.success("License key copied");
                  }}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="w-full rounded-lg border border-border/60 bg-card/40 p-3 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total paid</span>
          <span className="font-bold">{formatInCurrency(order.total, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment</span>
          <span className="font-medium">
            {order.provider === "BANK_ALFALAH" ? "Bank Alfalah (Manual)" : 
             order.provider === "EASYPAISA" ? "Easypaisa (Manual)" :
             order.provider || "—"}
          </span>
        </div>
      </div>

      {/* Manual payment instructions for Bank Alfalah / Easypaisa */}
      {(order.provider === "BANK_ALFALAH" || order.provider === "EASYPAISA") && (
        <div className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-left text-sm">
          <p className="font-semibold text-foreground">Payment Instructions</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Send the exact amount to the account below, then email your transaction reference to
            <a href="mailto:support@playbeat.digital" className="text-primary hover:underline"> support@playbeat.digital</a> with your order number.
          </p>
          {order.provider === "BANK_ALFALAH" ? (
            <div className="mt-3 space-y-1 text-xs">
              <p><strong>Bank:</strong> Bank Alfalah</p>
              <p><strong>Account Title:</strong> PLAYBEAT DIGITAL (PRIVATE LIMITED)</p>
              <p><strong>Account Number:</strong> 00681011050474</p>
              <p><strong>Currency:</strong> PKR</p>
            </div>
          ) : (
            <div className="mt-3 space-y-1 text-xs">
              <p><strong>Bank:</strong> Easypaisa (Telenor Microfinance Bank)</p>
              <p><strong>Account Title:</strong> Playbeat Digital</p>
              <p><strong>Account Number:</strong> 0000000094799151</p>
              <p><strong>IBAN:</strong> PK25TMFB0000000094799151</p>
              <p><strong>Currency:</strong> PKR</p>
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Your order will be confirmed once payment is verified (usually within 30 minutes).
          </p>
        </div>
      )}

      <div className="flex w-full gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            clearCart();
            close(false);
            toast.message("Downloads would start in a real environment");
          }}
        >
          <Download className="size-3.5" />
          Download all
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            clearCart();
            close(false);
            setActiveTab("marketplace");
          }}
        >
          Continue shopping
        </Button>
      </div>
    </div>
  );
}

export function CartSheet() {
  const open = usePlaybeatStore((s) => s.cartOpen);
  const setOpen = usePlaybeatStore((s) => s.setCartOpen);
  const cart = usePlaybeatStore((s) => s.cart);
  const subtotal = usePlaybeatStore((s) => s.cartSubtotal());
  const clearCart = usePlaybeatStore((s) => s.clearCart);
  const appliedCoupon = usePlaybeatStore((s) => s.appliedCoupon);
  const setAppliedCoupon = usePlaybeatStore((s) => s.setAppliedCoupon);
  const setActiveTab = usePlaybeatStore((s) => s.setActiveTab);
  const currency = usePlaybeatStore((s) => s.currency);

  const [couponInput, setCouponInput] = React.useState("");
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [provider, setProvider] = React.useState("JAZZCASH");
  const [placing, setPlacing] = React.useState(false);
  const [placedOrder, setPlacedOrder] = React.useState<Order | null>(null);

  const discount = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  React.useEffect(() => {
    if (!open) {
      // keep placedOrder so success screen remains until close
    }
  }, [open]);

  React.useEffect(() => {
    if (!open && placedOrder) {
      // Reset success state when sheet is fully closed
      const t = setTimeout(() => setPlacedOrder(null), 300);
      return () => clearTimeout(t);
    }
  }, [open, placedOrder]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error("Enter a coupon code");
      return;
    }
    if (subtotal <= 0) {
      toast.error("Add items first");
      return;
    }
    setCouponLoading(true);
    try {
      const result = await api.validateCoupon(couponInput.trim(), subtotal);
      setAppliedCoupon({
        code: result.coupon.code,
        discount: result.discount,
      });
      setCouponInput("");
      toast.success(
        `Coupon applied — you saved ${formatInCurrency(result.discount, currency)}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!name.trim() || !email.includes("@")) {
      toast.error("Enter your name and a valid email");
      return;
    }
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      if (provider === "JAZZCASH") {
        // JazzCash — live Pakistani payment gateway.
        // 1. Create the order record locally (PENDING).
        // 2. Create a JazzCash transaction with the order total.
        // 3. Build + submit a POST form to the JazzCash gateway URL so the
        //    browser redirects the customer to the JazzCash payment page.
        const orderResult = await api.placeOrder({
          items: cart.map((c) => ({ productId: c.product.id })),
          customerName: name.trim(),
          customerEmail: email.trim(),
          couponCode: appliedCoupon?.code,
          provider: "JAZZCASH",
        });
        const txn = await api.jazzcashCreate({
          amount: total,
          description: cart
            .map((c) => `${c.product.title} ×${c.quantity}`)
            .join(", ")
            .slice(0, 255),
          billReference: orderResult.order.orderNumber.slice(0, 24),
          customerEmail: email.trim(),
        });
        // Submit the signed params to the JazzCash gateway via a hidden form.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = txn.gatewayUrl;
        for (const [key, val] of Object.entries(txn.params)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = val;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        toast.success("Redirecting to JazzCash to complete payment…");
        setPlacedOrder(orderResult.order);
        clearCart();
      } else if (provider === "CRYPTO") {
        // Crypto (Binance) — create order, then redirect to crypto payment page
        const orderResult = await api.placeOrder({
          items: cart.map((c) => ({ productId: c.product.id })),
          customerName: name.trim(),
          customerEmail: email.trim(),
          couponCode: appliedCoupon?.code,
          provider: "CRYPTO",
        });
        const cryptoResult = await api.cryptoCreate({
          amount: total,
          description: cart
            .map((c) => `${c.product.title} ×${c.quantity}`)
            .join(", ")
            .slice(0, 255),
          orderNumber: orderResult.order.orderNumber,
          customerEmail: email.trim(),
        });
        window.location.href = cryptoResult.checkoutUrl;
        toast.success("Redirecting to crypto payment page…");
        setPlacedOrder(orderResult.order);
        clearCart();
      } else if (provider === "PAYPAL") {
        // PayPal — create order, then redirect to PayPal approval URL
        const orderResult = await api.placeOrder({
          items: cart.map((c) => ({ productId: c.product.id })),
          customerName: name.trim(),
          customerEmail: email.trim(),
          couponCode: appliedCoupon?.code,
          provider: "PAYPAL",
        });
        const paypalRes = await fetch("/api/v1/payments/paypal/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "USD",
            description: cart
              .map((c) => `${c.product.title} ×${c.quantity}`)
              .join(", ")
              .slice(0, 127),
            billReference: orderResult.order.orderNumber,
            customerEmail: email.trim(),
          }),
        });
        const paypalData = await paypalRes.json();
        if (paypalData.success && paypalData.data.approveUrl) {
          window.location.href = paypalData.data.approveUrl;
          toast.success("Redirecting to PayPal to complete payment…");
        } else {
          toast.error("PayPal payment initiation failed");
        }
        setPlacedOrder(orderResult.order);
        clearCart();
      } else if (provider === "EASYPAISA") {
        // Easypaisa — hosted checkout: create order, redirect to Easypaisa payment page
        const orderResult = await api.placeOrder({
          items: cart.map((c) => ({ productId: c.product.id })),
          customerName: name.trim(),
          customerEmail: email.trim(),
          couponCode: appliedCoupon?.code,
          provider: "EASYPAISA",
        });
        const easypaisaRes = await fetch("/api/v1/payments/easypaisa/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            orderRefNum: orderResult.order.orderNumber.slice(0, 24),
          }),
        });
        const easypaisaData = await easypaisaRes.json();
        if (easypaisaData.success && easypaisaData.data.checkoutUrl) {
          window.location.href = easypaisaData.data.checkoutUrl;
          toast.success("Redirecting to Easypaisa to complete payment…");
        } else {
          toast.error("Easypaisa payment initiation failed — showing manual instructions instead");
          // Fallback to manual payment instructions
          setPlacedOrder(orderResult.order);
        }
        setPlacedOrder(orderResult.order);
        clearCart();
      } else if (provider === "BANK_ALFALAH") {
        // Bank Alfalah / Easypaisa — manual payment: create order as PENDING,
        // show account details in the order confirmation, customer sends money
        // then submits the transaction reference
        const orderResult = await api.placeOrder({
          items: cart.map((c) => ({ productId: c.product.id })),
          customerName: name.trim(),
          customerEmail: email.trim(),
          couponCode: appliedCoupon?.code,
          provider,
        });
        setPlacedOrder(orderResult.order);
        toast.success(`Order ${orderResult.order.orderNumber} created — see payment instructions below`);
        clearCart();
      } else {
        // Fallback: create order as PENDING
        const result = await api.placeOrder({
          items: cart.map((c) => ({ productId: c.product.id })),
          customerName: name.trim(),
          customerEmail: email.trim(),
          couponCode: appliedCoupon?.code,
          provider,
        });
        setPlacedOrder(result.order);
        toast.success(`Order ${result.order.orderNumber} created`);
        clearCart();
      }
      // Track purchase with Meta Pixel for ad attribution
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase", {
          value: total,
          currency: "PKR",
          content_type: "product",
          contents: cart.map((c) => ({
            id: c.product.id,
            quantity: c.quantity,
            item_price: c.product.effectivePrice,
          })),
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="size-4 text-primary" />
            {placedOrder ? "Order confirmed" : "Your cart"}
            {!placedOrder && itemCount > 0 && (
              <Badge className="bg-primary/15 text-primary">{itemCount}</Badge>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review your cart items, apply coupons, and checkout.
          </SheetDescription>
        </SheetHeader>

        {placedOrder ? (
          <OrderSuccess order={placedOrder} />
        ) : cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-muted/40">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Browse the marketplace and add products you love.
              </p>
            </div>
            <Button
              onClick={() => {
                setOpen(false);
                setActiveTab("marketplace");
              }}
            >
              Browse products
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Items */}
            <div className="flex-1 space-y-2 overflow-y-auto p-4 pb-scrollbar">
              {cart.map((item) => (
                <CartRow key={item.product.id} item={item} />
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-border/60 p-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-2">
                  <div className="flex items-center gap-2">
                    <Tag className="size-3.5 text-primary" />
                    <div className="text-xs">
                      <div className="font-medium">{appliedCoupon.code}</div>
                      <div className="text-muted-foreground">
                        −{formatInCurrency(appliedCoupon.discount, currency)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      toast.message("Coupon removed");
                    }}
                    aria-label="Remove coupon"
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code (try AI50, SAVE10)"
                    className="h-9"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="h-9"
                  >
                    {couponLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Checkout */}
            <div className="border-t border-border/60 space-y-3 p-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatInCurrency(subtotal, currency)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount</span>
                    <span>−{formatInCurrency(discount, currency)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatInCurrency(total, currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="co-name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="co-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="co-email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="co-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Payment method</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={placeOrder}
                disabled={placing}
                className="w-full"
                size="lg"
              >
                {placing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {provider === "JAZZCASH"
                  ? `Pay with JazzCash · ${formatInCurrency(total, currency)}`
                  : provider === "BANK_ALFALAH"
                    ? `Bank Alfalah · ${formatInCurrency(total, currency)}`
                    : provider === "EASYPAISA"
                      ? `Easypaisa · ${formatInCurrency(total, currency)}`
                      : provider === "PAYPAL"
                        ? `Pay with PayPal · $${(total / 280).toFixed(2)}`
                        : provider === "CRYPTO"
                          ? `Pay with Crypto · ${formatInCurrency(total, currency)}`
                          : `Place order · ${formatInCurrency(total, currency)}`}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <Lock className="size-3" />
                Secured checkout · instant delivery after payment
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
