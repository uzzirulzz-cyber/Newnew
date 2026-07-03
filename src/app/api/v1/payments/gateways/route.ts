import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";

/**
 * GET /api/v1/payments/gateways
 *
 * Returns the live status of all payment gateways based on which env vars
 * are actually configured. This is real data — not mock.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  const gateways = [
    {
      id: "lemonsqueezy",
      name: "Lemon Squeezy",
      description: "Primary merchant of record for digital products",
      fees: "5% + $0.50",
      settlement: "Daily",
      active: Boolean(
        process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID,
      ),
      mode:
        process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID
          ? "LIVE"
          : "SANDBOX",
      configKeys: ["LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_STORE_ID"],
      color: "from-yellow-500 to-amber-600",
      icon: "CreditCard",
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Cards, Apple Pay, Google Pay, ACH",
      fees: "2.9% + $0.30",
      settlement: "Weekly",
      active: Boolean(process.env.STRIPE_SECRET_KEY),
      mode: process.env.STRIPE_SECRET_KEY ? "LIVE" : "SANDBOX",
      configKeys: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"],
      color: "from-purple-600 to-indigo-600",
      icon: "CreditCard",
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "PayPal balance & credit",
      fees: "3.49% + $0.49",
      settlement: "Monthly",
      active: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      mode:
        process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
          ? "LIVE"
          : "SANDBOX",
      configKeys: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"],
      color: "from-blue-500 to-blue-700",
      icon: "CreditCard",
    },
    {
      id: "paddle",
      name: "Paddle",
      description: "Merchant of record for SaaS",
      fees: "5% + $0.50",
      settlement: "Weekly",
      active: Boolean(process.env.PADDLE_API_KEY),
      mode: process.env.PADDLE_API_KEY ? "LIVE" : "SANDBOX",
      configKeys: ["PADDLE_API_KEY", "PADDLE_VENDOR_ID"],
      color: "from-pink-500 to-rose-600",
      icon: "CreditCard",
    },
    {
      id: "jazzcash",
      name: "JazzCash",
      description: "Pakistan mobile wallet payments",
      fees: "1.5% + Rs 5",
      settlement: "Daily",
      active: Boolean(
        process.env.JAZZCASH_MERCHANT_ID &&
          process.env.JAZZCASH_PASSWORD &&
          process.env.JAZZCASH_INTEGRITY_SALT,
      ),
      mode:
        process.env.JAZZCASH_MERCHANT_ID &&
        process.env.JAZZCASH_PASSWORD &&
        process.env.JAZZCASH_INTEGRITY_SALT
          ? process.env.JAZZCASH_SANDBOX === "true"
            ? "SANDBOX"
            : "LIVE"
          : "SANDBOX",
      configKeys: [
        "JAZZCASH_MERCHANT_ID",
        "JAZZCASH_PASSWORD",
        "JAZZCASH_INTEGRITY_SALT",
        "JAZZCASH_SANDBOX",
        "JAZZCASH_RETURN_URL",
        "JAZZCASH_POSTBACK_URL",
      ],
      color: "from-red-500 to-orange-600",
      icon: "Smartphone",
    },
    {
      id: "easypaisa",
      name: "EasyPaisa",
      description: "Pakistan mobile wallet & retail",
      fees: "1.2% + Rs 3",
      settlement: "Daily",
      active: Boolean(process.env.EASYPAISA_MERCHANT_ID && process.env.EASYPAISA_PASSWORD),
      mode:
        process.env.EASYPAISA_MERCHANT_ID && process.env.EASYPAISA_PASSWORD
          ? "LIVE"
          : "SANDBOX",
      configKeys: ["EASYPAISA_MERCHANT_ID", "EASYPAISA_PASSWORD", "EASYPAISA_STORE_ID"],
      color: "from-green-500 to-emerald-600",
      icon: "Smartphone",
    },
    {
      id: "crypto",
      name: "Crypto",
      description: "BTC, ETH, USDT, USDC via Coinbase Commerce",
      fees: "1.0% flat",
      settlement: "Instant",
      active: Boolean(process.env.COINBASE_API_KEY),
      mode: process.env.COINBASE_API_KEY ? "LIVE" : "SANDBOX",
      configKeys: ["COINBASE_API_KEY", "COINBASE_WEBHOOK_SECRET"],
      color: "from-amber-500 to-yellow-600",
      icon: "Bitcoin",
    },
    {
      id: "banktransfer",
      name: "Bank Transfer",
      description: "Direct bank deposit (Bank Alfalah)",
      fees: "Flat Rs 50",
      settlement: "Manual",
      active: Boolean(process.env.BANK_ALFALAH_ACCOUNT_NUMBER),
      mode: process.env.BANK_ALFALAH_ACCOUNT_NUMBER ? "LIVE" : "SANDBOX",
      configKeys: [
        "BANK_ALFALAH_ACCOUNT_NUMBER",
        "BANK_ALFALAH_ACCOUNT_TITLE",
        "BANK_ALFALAH_IBAN",
      ],
      color: "from-cyan-500 to-blue-600",
      icon: "Building2",
    },
  ];

  const activeCount = gateways.filter((g) => g.active).length;
  const liveCount = gateways.filter((g) => g.active && g.mode === "LIVE").length;
  const sandboxCount = gateways.filter(
    (g) => g.active && g.mode === "SANDBOX",
  ).length;

  return ok({
    gateways,
    summary: {
      total: gateways.length,
      active: activeCount,
      inactive: gateways.length - activeCount,
      live: liveCount,
      sandbox: sandboxCount,
    },
  });
}
