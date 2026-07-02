import { db } from "@/lib/db";
import {
  hashPassword,
  generateLicenseKey,
  generateOrderNumber,
  generateAffiliateCode,
} from "@/lib/auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PRODUCT_TYPES = [
  "AI_TOOL",
  "SOFTWARE_LICENSE",
  "SAAS_SUBSCRIPTION",
  "DIGITAL_DOWNLOAD",
  "EBOOK",
  "TEMPLATE",
  "GRAPHICS",
  "COURSE",
  "MEMBERSHIP",
  "AFFILIATE_PRODUCT",
  "PAYMENT_GATEWAY",
  "GAME",
  "GIFT_CARD",
] as const;

// gradient color pairs per type (used as fallback cover visuals)
const TYPE_GRADIENTS: Record<string, [string, string]> = {
  AI_TOOL: ["#10b981", "#0d9488"],
  SOFTWARE_LICENSE: ["#f59e0b", "#ea580c"],
  SAAS_SUBSCRIPTION: ["#14b8a6", "#0891b2"],
  DIGITAL_DOWNLOAD: ["#ec4899", "#be185d"],
  EBOOK: ["#a855f7", "#7e22ce"],
  TEMPLATE: ["#22c55e", "#15803d"],
  GRAPHICS: ["#f43f5e", "#be123c"],
  COURSE: ["#eab308", "#ca8a04"],
  MEMBERSHIP: ["#06b6d4", "#0e7490"],
  AFFILIATE_PRODUCT: ["#8b5cf6", "#6d28d9"],
  PAYMENT_GATEWAY: ["#0ea5e9", "#0369a1"],
  GAME: ["#f97316", "#c2410c"],
  GIFT_CARD: ["#ef4444", "#b91c1c"],
};

const TYPE_ICONS: Record<string, string> = {
  AI_TOOL: "Sparkles",
  SOFTWARE_LICENSE: "KeyRound",
  SAAS_SUBSCRIPTION: "RefreshCw",
  DIGITAL_DOWNLOAD: "Download",
  EBOOK: "BookOpen",
  TEMPLATE: "LayoutTemplate",
  GRAPHICS: "Palette",
  COURSE: "GraduationCap",
  MEMBERSHIP: "Crown",
  AFFILIATE_PRODUCT: "Share2",
  PAYMENT_GATEWAY: "CreditCard",
  GAME: "Gamepad2",
  GIFT_CARD: "Gift",
};

interface SeedProduct {
  title: string;
  type: (typeof PRODUCT_TYPES)[number];
  price: number;
  discountPrice?: number;
  vendorStore: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  tags: string[];
  licenseType?: string;
  fileSize?: string;
  version?: string;
  featured?: boolean;
  stock?: number;
}

const SEED_PRODUCTS: SeedProduct[] = [
  {
    title: "NovaScript AI Writer",
    type: "AI_TOOL",
    price: 79,
    discountPrice: 59,
    vendorStore: "NovaLabs",
    categoryName: "AI Tools",
    shortDescription: "GPT-powered long-form content engine for blogs & ads.",
    description:
      "NovaScript is an AI writing assistant that produces SEO-ready long-form articles, ad copy, and product descriptions in seconds. Includes tone control, plagiarism checks, and one-click WordPress export.",
    tags: ["AI", "writing", "content", "SEO", "GPT"],
    licenseType: "Single-site license",
    fileSize: "48 MB",
    version: "3.2.0",
    featured: true,
  },
  {
    title: "PixelForge Image Generator",
    type: "AI_TOOL",
    price: 129,
    discountPrice: 99,
    vendorStore: "NovaLabs",
    categoryName: "AI Tools",
    shortDescription: "Diffusion-based image studio with style presets.",
    description:
      "PixelForge turns text prompts into production-ready visuals with 40+ curated style presets, inpainting, upscaling to 8K, and a commercial license for every render.",
    tags: ["AI", "image", "diffusion", "art"],
    licenseType: "Commercial license",
    fileSize: "320 MB",
    version: "2.4.1",
    featured: true,
  },
  {
    title: "VoxAI Voice Cloning Suite",
    type: "AI_TOOL",
    price: 199,
    vendorStore: "Echo Dynamics",
    categoryName: "AI Tools",
    shortDescription: "Studio-grade voice cloning & TTS in 32 languages.",
    description:
      "VoxAI clones any voice from 30 seconds of audio and generates natural speech in 32 languages. Includes emotion control, SSML support, and API access.",
    tags: ["AI", "voice", "TTS", "audio"],
    licenseType: "Commercial license",
    fileSize: "540 MB",
    version: "1.8.0",
    featured: true,
  },
  {
    title: "DevGuard Pro License",
    type: "SOFTWARE_LICENSE",
    price: 249,
    discountPrice: 199,
    vendorStore: "SecureStack",
    categoryName: "Software Licenses",
    shortDescription: "Code security scanner with SAST + dependency analysis.",
    description:
      "DevGuard Pro scans your codebase for vulnerabilities, secrets, and risky dependencies. Includes CI/CD plugins for GitHub Actions, GitLab, and Jenkins, plus a compliance dashboard.",
    tags: ["security", "devops", "CI/CD"],
    licenseType: "Team license (up to 25 seats)",
    fileSize: "120 MB",
    version: "5.1.3",
    featured: true,
  },
  {
    title: "SheetFlow Automation",
    type: "SAAS_SUBSCRIPTION",
    price: 19,
    vendorStore: "FlowForge",
    categoryName: "SaaS Subscriptions",
    shortDescription: "No-code workflows connecting 200+ apps. Monthly plan.",
    description:
      "SheetFlow lets you build automations between Sheets, CRMs, and 200+ apps without code. This subscription includes 50k runs/month and priority support.",
    tags: ["automation", "no-code", "SaaS"],
    licenseType: "Subscription (monthly)",
    version: "Cloud",
    featured: true,
  },
  {
    title: "InboxZen Email Marketing",
    type: "SAAS_SUBSCRIPTION",
    price: 39,
    discountPrice: 29,
    vendorStore: "FlowForge",
    categoryName: "SaaS Subscriptions",
    shortDescription: "AI-assisted email campaigns with deliverability analytics.",
    description:
      "InboxZen helps you design, schedule, and optimize email campaigns. Built-in AI writes subject lines, segments audiences, and predicts deliverability.",
    tags: ["email", "marketing", "SaaS"],
    licenseType: "Subscription (monthly)",
    version: "Cloud",
  },
  {
    title: "CineMaster LUTs Bundle",
    type: "DIGITAL_DOWNLOAD",
    price: 49,
    vendorStore: "ColorCraft",
    categoryName: "Digital Downloads",
    shortDescription: "120 cinematic LUTs for Premiere, DaVinci & FCPX.",
    description:
      "A curated pack of 120 cinematic LUTs covering teal-orange, vintage, noir, and sci-fi looks. Compatible with Premiere Pro, DaVinci Resolve, and Final Cut Pro.",
    tags: ["video", "color", "LUTs", "editing"],
    licenseType: "Personal + commercial use",
    fileSize: "1.2 GB",
    version: "2024.1",
  },
  {
    title: "The Indie Maker Playbook",
    type: "EBOOK",
    price: 24,
    discountPrice: 15,
    vendorStore: "MakerPress",
    categoryName: "eBooks",
    shortDescription: "320-page guide to building & launching SaaS solo.",
    description:
      "The Indie Maker Playbook is a 320-page actionable guide on ideation, building, launching, and growing a profitable SaaS as a solo founder. Includes 40 templates.",
    tags: ["ebook", "saas", "startup", "indie"],
    licenseType: "Personal use",
    fileSize: "18 MB",
    version: "2nd edition",
    featured: true,
  },
  {
    title: "LaunchKit Landing Templates",
    type: "TEMPLATE",
    price: 59,
    vendorStore: "PixelCraft Studio",
    categoryName: "Templates",
    shortDescription: "12 conversion-optimized landing pages (React + Tailwind).",
    description:
      "LaunchKit includes 12 responsive, conversion-optimized landing page templates built with React, Next.js, and Tailwind CSS. Fully customizable and documented.",
    tags: ["template", "landing", "react", "tailwind"],
    licenseType: "Developer license",
    fileSize: "64 MB",
    version: "1.5.0",
  },
  {
    title: "Aurora Icon Set",
    type: "GRAPHICS",
    price: 35,
    discountPrice: 25,
    vendorStore: "PixelCraft Studio",
    categoryName: "Graphics",
    shortDescription: "2,400 vector icons in 6 styles, SVG + Figma.",
    description:
      "Aurora is a comprehensive icon system with 2,400 icons across 6 styles (outline, solid, duotone, animated, 3D, hand-drawn). Delivered as SVG, PNG, and Figma library.",
    tags: ["icons", "svg", "figma", "design"],
    licenseType: "Commercial license",
    fileSize: "210 MB",
    version: "4.0",
    featured: true,
  },
  {
    title: "Mastering Prompt Engineering",
    type: "COURSE",
    price: 149,
    discountPrice: 99,
    vendorStore: "LearnAI Academy",
    categoryName: "Courses",
    shortDescription: "8-hour video course + 60 prompt templates.",
    description:
      "Learn to craft prompts that get reliable, high-quality outputs from any LLM. 8 hours of video, 60 ready-to-use templates, weekly office hours, and a certificate.",
    tags: ["course", "AI", "prompts", "LLM"],
    licenseType: "Lifetime access",
    fileSize: "Streaming + 2 GB assets",
    version: "2024 edition",
    featured: true,
  },
  {
    title: "Founders Circle Membership",
    type: "MEMBERSHIP",
    price: 89,
    vendorStore: "MakerPress",
    categoryName: "Memberships",
    shortDescription: "Monthly access to premium tools, community & drops.",
    description:
      "Founders Circle members get monthly drops of premium templates, early access to new tools, a private community, and live monthly AMAs with successful makers.",
    tags: ["membership", "community", "premium"],
    licenseType: "Membership (monthly)",
    version: "Ongoing",
  },
  {
    title: "DataWave Analytics Platform",
    type: "SAAS_SUBSCRIPTION",
    price: 99,
    vendorStore: "SecureStack",
    categoryName: "SaaS Subscriptions",
    shortDescription: "Real-time product analytics with funnel & retention.",
    description:
      "DataWave gives you real-time product analytics with funnels, retention cohorts, and SQL explorer. Connects to 30+ data sources out of the box.",
    tags: ["analytics", "SaaS", "data"],
    licenseType: "Subscription (monthly)",
    version: "Cloud",
  },
  {
    title: "SynthWave Music Pack",
    type: "DIGITAL_DOWNLOAD",
    price: 29,
    vendorStore: "ColorCraft",
    categoryName: "Digital Downloads",
    shortDescription: "80 royalty-free synth loops & one-shots (WAV).",
    description:
      "A royalty-free synthwave sample pack with 80 loops and one-shots, recorded at 24-bit/96kHz. Perfect for producers, streamers, and video creators.",
    tags: ["audio", "music", "samples", "royalty-free"],
    licenseType: "Royalty-free license",
    fileSize: "680 MB",
    version: "1.0",
  },
  {
    title: "CloudVault Backup License",
    type: "SOFTWARE_LICENSE",
    price: 69,
    vendorStore: "SecureStack",
    categoryName: "Software Licenses",
    shortDescription: "Encrypted incremental backups for servers & NAS.",
    description:
      "CloudVault performs encrypted, incremental backups to any S3-compatible storage. Includes deduplication, point-in-time recovery, and a self-hosted dashboard.",
    tags: ["backup", "security", "devops"],
    licenseType: "Server license (up to 10 nodes)",
    fileSize: "85 MB",
    version: "6.2.0",
  },
  {
    title: "BriefBot AI Assistant",
    type: "AFFILIATE_PRODUCT",
    price: 0,
    vendorStore: "NovaLabs",
    categoryName: "Affiliate Offers",
    shortDescription: "Affiliate offer: 30% recurring commission.",
    description:
      "Promote BriefBot, an AI assistant for legal teams, and earn 30% recurring commission for 12 months. This is an affiliate offer — promote with your referral link.",
    tags: ["affiliate", "AI", "recurring"],
    licenseType: "Affiliate program",
  },
  {
    title: "ResumeBoost AI Tool",
    type: "AI_TOOL",
    price: 9,
    vendorStore: "Echo Dynamics",
    categoryName: "AI Tools",
    shortDescription: "AI resume optimizer with ATS scoring.",
    description:
      "ResumeBoost analyzes your resume against job descriptions, scores ATS compatibility, and rewrites bullet points for maximum impact.",
    tags: ["AI", "resume", "career", "ATS"],
    licenseType: "Single-user license",
    fileSize: "12 MB",
    version: "2.0.1",
  },
  {
    title: "PitchDeck Pro Templates",
    type: "TEMPLATE",
    price: 45,
    discountPrice: 35,
    vendorStore: "PixelCraft Studio",
    categoryName: "Templates",
    shortDescription: "30 investor pitch deck templates (PPTX + Figma).",
    description:
      "PitchDeck Pro includes 30 investor-ready pitch deck templates in PowerPoint and Figma formats, with charts, financial models, and design tokens.",
    tags: ["template", "pitch", "investor", "figma"],
    licenseType: "Commercial license",
    fileSize: "320 MB",
    version: "2.1",
  },
  {
    title: "CodeCraft Design Patterns",
    type: "EBOOK",
    price: 32,
    vendorStore: "MakerPress",
    categoryName: "eBooks",
    shortDescription: "180-page guide to modern design patterns (TS/Go/Rust).",
    description:
      "CodeCraft is a 180-page deep dive into design patterns with examples in TypeScript, Go, and Rust. Includes a decision tree for picking the right pattern.",
    tags: ["ebook", "programming", "patterns"],
    licenseType: "Personal use",
    fileSize: "14 MB",
    version: "1.0",
  },
  {
    title: "PhotoFX Lightroom Presets",
    type: "GRAPHICS",
    price: 19,
    vendorStore: "ColorCraft",
    categoryName: "Graphics",
    shortDescription: "60 Lightroom presets for portraits & landscapes.",
    description:
      "PhotoFX delivers 60 hand-crafted Lightroom presets for portraits, landscapes, and street photography. Compatible with Lightroom Mobile & Desktop.",
    tags: ["presets", "lightroom", "photography"],
    licenseType: "Personal + commercial use",
    fileSize: "42 MB",
    version: "3.0",
  },
  {
    title: "Web3 Dev Bootcamp",
    type: "COURSE",
    price: 199,
    vendorStore: "LearnAI Academy",
    categoryName: "Courses",
    shortDescription: "40-hour bootcamp: Solidity, smart contracts, dApps.",
    description:
      "A 40-hour project-based bootcamp covering Solidity, smart contract security, and building full-stack dApps with Hardhat, Wagmi, and Next.js.",
    tags: ["course", "web3", "solidity", "blockchain"],
    licenseType: "Lifetime access",
    fileSize: "Streaming + 4 GB assets",
    version: "2024 edition",
  },
  {
    title: "TaskFlow PM Tool",
    type: "SAAS_SUBSCRIPTION",
    price: 14,
    vendorStore: "FlowForge",
    categoryName: "SaaS Subscriptions",
    shortDescription: "Lightweight project management for small teams.",
    description:
      "TaskFlow is a fast, keyboard-driven project management tool with boards, timelines, and time tracking. Perfect for teams of 1–25.",
    tags: ["SaaS", "project-management", "productivity"],
    licenseType: "Subscription (monthly)",
    version: "Cloud",
  },
  {
    title: "RenderFarm GPU Credits",
    type: "AFFILIATE_PRODUCT",
    price: 0,
    vendorStore: "Echo Dynamics",
    categoryName: "Affiliate Offers",
    shortDescription: "Affiliate offer: $20 credit per signup, 15% recurring.",
    description:
      "Promote RenderFarm GPU cloud and earn $20 per signup plus 15% recurring commission. Affiliate offer — use your referral link.",
    tags: ["affiliate", "GPU", "cloud"],
    licenseType: "Affiliate program",
  },
  {
    title: "BrandKit Logo Bundle",
    type: "GRAPHICS",
    price: 55,
    discountPrice: 39,
    vendorStore: "PixelCraft Studio",
    categoryName: "Graphics",
    shortDescription: "50 editable logo kits in SVG + AI formats.",
    description:
      "BrandKit delivers 50 fully editable logo kits across modern industries. Each kit includes primary, secondary, and icon variants in SVG, AI, and PNG.",
    tags: ["logo", "branding", "vector"],
    licenseType: "Commercial license",
    fileSize: "180 MB",
    version: "2.0",
  },
  // ---- Payment Gateways (products posted in the backend, surfaced on the storefront) ----
  {
    title: "Stripe Connect Integration Kit",
    type: "PAYMENT_GATEWAY",
    price: 149,
    discountPrice: 119,
    vendorStore: "PayBridge Labs",
    categoryName: "Payment Gateways",
    shortDescription: "Drop-in Stripe Connect checkout, subscriptions & marketplace splits.",
    description:
      "A production-ready Stripe Connect integration kit with hosted checkout, subscriptions, Connect Express onboarding, and marketplace split payouts. Includes Next.js + Node adapters, webhooks, and a typed SDK.",
    tags: ["stripe", "payments", "checkout", "subscriptions", "connect"],
    licenseType: "Commercial license (1 domain)",
    fileSize: "24 MB",
    version: "4.1.0",
    featured: true,
  },
  {
    title: "PayPal Checkout Pro",
    type: "PAYMENT_GATEWAY",
    price: 89,
    vendorStore: "PayBridge Labs",
    categoryName: "Payment Gateways",
    shortDescription: "Smart PayPal buttons + Pay Later + vaulted cards.",
    description:
      "PayPal Checkout Pro adds smart payment buttons, Pay Later messaging, and card vaulting to any storefront. Supports 200+ markets, 25 currencies, and fraudnet risk scoring out of the box.",
    tags: ["paypal", "checkout", "payments", "fraud"],
    licenseType: "Commercial license (1 domain)",
    fileSize: "12 MB",
    version: "2.3.0",
  },
  {
    title: "Paddle Billing Suite",
    type: "PAYMENT_GATEWAY",
    price: 199,
    discountPrice: 159,
    vendorStore: "PayBridge Labs",
    categoryName: "Payment Gateways",
    shortDescription: "Merchant-of-record billing, taxes & subscriptions handled.",
    description:
      "Paddle Billing Suite acts as merchant of record, handling global sales tax, VAT, and invoicing for digital products. Includes dunning, proration, and a customer portal. Best for SaaS that wants to sell globally without tax headaches.",
    tags: ["paddle", "billing", "tax", "subscriptions", "merchant-of-record"],
    licenseType: "Commercial license (unlimited domains)",
    fileSize: "31 MB",
    version: "1.7.2",
    featured: true,
  },
  {
    title: "Lemon Squeezy Storefront Pack",
    type: "PAYMENT_GATEWAY",
    price: 79,
    vendorStore: "PayBridge Labs",
    categoryName: "Payment Gateways",
    shortDescription: "Sell digital products & software with built-in licensing.",
    description:
      "The Lemon Squeezy Storefront Pack gives you a hosted checkout, license key generation, and webhook events for digital product sales. Perfect for indie makers selling software, eBooks, and templates.",
    tags: ["lemon-squeezy", "digital-products", "licensing", "checkout"],
    licenseType: "Commercial license (1 store)",
    fileSize: "9 MB",
    version: "1.2.0",
  },
  {
    title: "CryptoPay Gateway",
    type: "PAYMENT_GATEWAY",
    price: 129,
    discountPrice: 99,
    vendorStore: "PayBridge Labs",
    categoryName: "Payment Gateways",
    shortDescription: "Accept BTC, ETH, USDT & 40+ tokens with auto settlement.",
    description:
      "CryptoPay Gateway lets your storefront accept Bitcoin, Ethereum, USDT, and 40+ ERC-20 tokens. Includes real-time conversion, auto settlement to fiat, and non-custodial wallet support.",
    tags: ["crypto", "bitcoin", "ethereum", "usdt", "web3", "payments"],
    licenseType: "Commercial license (1 domain)",
    fileSize: "18 MB",
    version: "3.0.1",
    featured: true,
  },
  {
    title: "Razorpay Route Integration",
    type: "PAYMENT_GATEWAY",
    price: 69,
    vendorStore: "PayBridge Labs",
    categoryName: "Payment Gateways",
    shortDescription: "UPI, cards, netbanking & EMI for the Indian market.",
    description:
      "Razorpay Route Integration adds UPI, RuPay, netbanking, and EMI options optimized for the Indian market. Includes Route splits for marketplace payouts and GST-compliant invoicing.",
    tags: ["razorpay", "upi", "india", "payments", "gst"],
    licenseType: "Commercial license (1 domain)",
    fileSize: "11 MB",
    version: "2.0.0",
  },
  // ---- Games ----
  {
    title: "Neon Drift Racer",
    type: "GAME",
    price: 24,
    discountPrice: 18,
    vendorStore: "Lumen Games",
    categoryName: "Games",
    shortDescription: "Synthwave arcade racer with 40 tracks & online leaderboards.",
    description:
      "Neon Drift Racer is a high-speed synthwave arcade racer with 40 handcrafted tracks, 12 unlockable cars, and global online leaderboards. Drift, boost, and chase the perfect lap. Windows, macOS, and Linux builds included.",
    tags: ["game", "racing", "arcade", "synthwave", "indie"],
    licenseType: "Personal license (single user)",
    fileSize: "2.4 GB",
    version: "1.4.0",
    featured: true,
  },
  {
    title: "Dungeon of Aether",
    type: "GAME",
    price: 19,
    vendorStore: "Lumen Games",
    categoryName: "Games",
    shortDescription: "Roguelike dungeon crawler with procedural levels.",
    description:
      "Dungeon of Aether is a turn-based roguelike with procedurally generated dungeons, 8 character classes, and 200+ unique items. Permadeath, daily challenges, and mod support included.",
    tags: ["game", "roguelike", "rpg", "indie", "dungeon"],
    licenseType: "Personal license (single user)",
    fileSize: "1.1 GB",
    version: "2.1.0",
  },
  {
    title: "Pixel Kingdom Builder Kit",
    type: "GAME",
    price: 34,
    discountPrice: 27,
    vendorStore: "Lumen Games",
    categoryName: "Games",
    shortDescription: "2D pixel-art kingdom builder engine + 500 sprites.",
    description:
      "Pixel Kingdom Builder Kit is a complete 2D game engine for building pixel-art kingdom sims. Includes 500 sprites, tilemap editor, NPC AI, save system, and full Godot 4 source. Make and sell your own game.",
    tags: ["game", "game-engine", "pixel-art", "godot", "assets"],
    licenseType: "Commercial license (sell your game)",
    fileSize: "640 MB",
    version: "3.0",
  },
  {
    title: "Starbound Tactics",
    type: "GAME",
    price: 29,
    vendorStore: "Lumen Games",
    categoryName: "Games",
    shortDescription: "Turn-based space strategy with fleet combat.",
    description:
      "Starbound Tactics is a turn-based 4X space strategy game with fleet combat, diplomacy, and tech trees. Play across 6 alien factions on a procedurally generated galaxy. Cross-platform single-player and hot-seat multiplayer.",
    tags: ["game", "strategy", "4x", "space", "indie"],
    licenseType: "Personal license (single user)",
    fileSize: "1.8 GB",
    version: "1.0.3",
  },
  // ---- Gift Cards ----
  {
    title: "Steam Gift Card $50",
    type: "GIFT_CARD",
    price: 50,
    vendorStore: "PlayBeat Digital",
    categoryName: "Gift Cards",
    shortDescription: "Steam wallet top-up — redeem instantly worldwide.",
    description:
      "A $50 Steam digital gift card. Redeem on any Steam account to add wallet funds for games, DLC, and in-game items. Delivered as a code within seconds of purchase.",
    tags: ["gift card", "steam", "gaming", "wallet"],
    licenseType: "Digital code (instant delivery)",
    fileSize: "Digital code",
    version: "Global",
    featured: true,
  },
  {
    title: "Netflix Gift Card $30",
    type: "GIFT_CARD",
    price: 30,
    vendorStore: "PlayBeat Digital",
    categoryName: "Gift Cards",
    shortDescription: "Netflix subscription credit — works with any plan.",
    description:
      "A $30 Netflix gift card applied to your Netflix account for any subscription plan. No expiry on balances. Delivered as a digital code instantly.",
    tags: ["gift card", "netflix", "streaming", "subscription"],
    licenseType: "Digital code (instant delivery)",
    fileSize: "Digital code",
    version: "Global",
  },
  {
    title: "Spotify Premium 3-Month Card",
    type: "GIFT_CARD",
    price: 29,
    discountPrice: 25,
    vendorStore: "PlayBeat Digital",
    categoryName: "Gift Cards",
    shortDescription: "3 months of Spotify Premium, ad-free music.",
    description:
      "A Spotify Premium gift card giving 3 months of ad-free, offline music streaming. Redeem on any Spotify account. Delivered as a digital code.",
    tags: ["gift card", "spotify", "music", "premium"],
    licenseType: "Digital code (instant delivery)",
    fileSize: "Digital code",
    version: "Global",
    featured: true,
  },
  {
    title: "Amazon Gift Card $100",
    type: "GIFT_CARD",
    price: 100,
    vendorStore: "PlayBeat Digital",
    categoryName: "Gift Cards",
    shortDescription: "Amazon.com balance — shop millions of products.",
    description:
      "A $100 Amazon.com gift card. Redeem to your Amazon account balance and shop millions of products. No expiry. Delivered as a digital code instantly.",
    tags: ["gift card", "amazon", "shopping"],
    licenseType: "Digital code (instant delivery)",
    fileSize: "Digital code",
    version: "US",
  },
];

interface SeedVendor {
  storeName: string;
  ownerName: string;
  email: string;
  description: string;
  verified: boolean;
}

const SEED_VENDORS: SeedVendor[] = [
  { storeName: "NovaLabs", ownerName: "Aria Chen", email: "aria@novalabs.co", description: "AI tools for creators and marketers.", verified: true },
  { storeName: "Echo Dynamics", ownerName: "Marcus Lee", email: "marcus@echodynamics.io", description: "Voice AI and audio solutions.", verified: true },
  { storeName: "SecureStack", ownerName: "Priya Nair", email: "priya@securestack.dev", description: "Developer security & infra tools.", verified: true },
  { storeName: "FlowForge", ownerName: "Diego Ramos", email: "diego@flowforge.app", description: "No-code automation & SaaS apps.", verified: true },
  { storeName: "ColorCraft", ownerName: "Lena Fischer", email: "lena@colorcraft.studio", description: "Creative assets for video & photo.", verified: true },
  { storeName: "PixelCraft Studio", ownerName: "Sam Okafor", email: "sam@pixelcraft.design", description: "Premium design templates & graphics.", verified: true },
  { storeName: "MakerPress", ownerName: "Yuki Tanaka", email: "yuki@makerpress.co", description: "Books & memberships for makers.", verified: false },
  { storeName: "LearnAI Academy", ownerName: "Omar Haddad", email: "omar@learnai.education", description: "Courses on AI & modern engineering.", verified: true },
  { storeName: "PayBridge Labs", ownerName: "Sofia Marin", email: "sofia@paybridge.dev", description: "Payment gateway integrations & checkout SDKs.", verified: true },
  { storeName: "Lumen Games", ownerName: "Kai Nakamura", email: "kai@lumengames.studio", description: "Indie games & game development assets.", verified: true },
  { storeName: "PlayBeat Digital", ownerName: "PlayBeat Team", email: "info@playbeat.digital", description: "Official PlayBeat gift cards & digital codes.", verified: true },
];

const SEED_CATEGORIES = [
  { name: "AI Tools", icon: "Sparkles", color: "#10b981", description: "AI-powered tools for content, image, and voice." },
  { name: "Software Licenses", icon: "KeyRound", color: "#f59e0b", description: "Licensed desktop & server software." },
  { name: "SaaS Subscriptions", icon: "RefreshCw", color: "#14b8a6", description: "Cloud apps on monthly plans." },
  { name: "Digital Downloads", icon: "Download", color: "#ec4899", description: "One-time downloadable assets." },
  { name: "eBooks", icon: "BookOpen", color: "#a855f7", description: "Guides, playbooks, and reference books." },
  { name: "Templates", icon: "LayoutTemplate", color: "#22c55e", description: "Code, web, and design templates." },
  { name: "Graphics", icon: "Palette", color: "#f43f5e", description: "Icons, presets, logos, and illustrations." },
  { name: "Courses", icon: "GraduationCap", color: "#eab308", description: "Video courses and bootcamps." },
  { name: "Memberships", icon: "Crown", color: "#06b6d4", description: "Recurring-access memberships & clubs." },
  { name: "Affiliate Offers", icon: "Share2", color: "#8b5cf6", description: "Programs you can promote for commission." },
  { name: "Payment Gateways", icon: "CreditCard", color: "#0ea5e9", description: "Payment processing integrations & checkout SDKs for your storefront." },
  { name: "Games", icon: "Gamepad2", color: "#f97316", description: "Indie games, game assets, and interactive entertainment." },
  { name: "Gift Cards", icon: "Gift", color: "#ef4444", description: "Digital gift cards for Steam, Netflix, Spotify, Amazon & more." },
];

const REVIEW_SEED = [
  { name: "Jordan M.", rating: 5, title: "Exceeded expectations", comment: "Pays for itself within a week. The output quality is genuinely impressive." },
  { name: "Priya K.", rating: 4, title: "Solid product", comment: "Great value for the price. A few rough edges but the core works flawlessly." },
  { name: "Tomas R.", rating: 5, title: "Game changer", comment: "I replaced two other tools with this. Support is responsive too." },
  { name: "Aisha B.", rating: 5, title: "Highly recommend", comment: "Onboarding was smooth and the docs are excellent. 10/10." },
  { name: "Felix W.", rating: 3, title: "Good but pricey", comment: "Works well, though I wish there was a cheaper tier for hobbyists." },
  { name: "Mei L.", rating: 4, title: "Exactly what I needed", comment: "Solved a real workflow problem for my team. Would buy again." },
  { name: "Carlos D.", rating: 5, title: "Best in class", comment: "Tried three alternatives — this one is clearly the most polished." },
];

export async function runSeed(): Promise<{ created: Record<string, number> }> {
  const created: Record<string, number> = {};

  // Wipe (order matters for FK constraints)
  await db.notification.deleteMany();
  await db.payout.deleteMany();
  await db.affiliateClick.deleteMany();
  await db.affiliate.deleteMany();
  await db.coupon.deleteMany();
  await db.favorite.deleteMany();
  await db.review.deleteMany();
  await db.download.deleteMany();
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.product.deleteMany();
  await db.vendor.deleteMany();
  await db.category.deleteMany();
  await db.settings.deleteMany();
  await db.user.deleteMany();

  // ---- Users ----
  const password = hashPassword("playbeat123");
  const admin = await db.user.create({
    data: { email: "admin@playbeat.io", name: "Admin User", passwordHash: password, role: "ADMIN", verified: true },
  });
  // Executive admin accounts — founder / CEO / director (locked admin landing)
  const founder = await db.user.create({
    data: { email: "founder@playbeat.live", name: "Founder", passwordHash: password, role: "ADMIN", verified: true },
  });
  const ceo = await db.user.create({
    data: { email: "ceo@playbeat.live", name: "CEO", passwordHash: password, role: "ADMIN", verified: true },
  });
  const director = await db.user.create({
    data: { email: "director@playbeat.live", name: "Director", passwordHash: password, role: "ADMIN", verified: true },
  });
  const customer = await db.user.create({
    data: { email: "demo@playbeat.io", name: "Demo Customer", passwordHash: password, role: "CUSTOMER", verified: true, avatar: "" },
  });
  const vendorUsers = await Promise.all(
    SEED_VENDORS.map((v) =>
      db.user.create({
        data: { email: v.email, name: v.ownerName, passwordHash: password, role: "VENDOR", verified: v.verified },
      }),
    ),
  );
  const affiliateUser = await db.user.create({
    data: { email: "partner@playbeat.io", name: "Alex Partner", passwordHash: password, role: "CUSTOMER", verified: true },
  });
  created.users = 6 + vendorUsers.length;

  // ---- Vendors ----
  const vendorMap = new Map<string, { id: string; slug: string }>();
  for (let i = 0; i < SEED_VENDORS.length; i++) {
    const sv = SEED_VENDORS[i];
    const v = await db.vendor.create({
      data: {
        userId: vendorUsers[i].id,
        storeName: sv.storeName,
        slug: slugify(sv.storeName),
        description: sv.description,
        verified: sv.verified,
        totalSales: 0,
        totalRevenue: 0,
        rating: 4.5 + Math.random() * 0.5,
      },
    });
    vendorMap.set(sv.storeName, { id: v.id, slug: v.slug });
  }
  created.vendors = SEED_VENDORS.length;

  // ---- Categories ----
  const categoryMap = new Map<string, string>();
  for (const c of SEED_CATEGORIES) {
    const cat = await db.category.create({
      data: { name: c.name, slug: slugify(c.name), description: c.description, icon: c.icon, color: c.color },
    });
    categoryMap.set(c.name, cat.id);
  }
  created.categories = SEED_CATEGORIES.length;

  // ---- Products ----
  let productCount = 0;
  const createdProducts: { id: string; title: string; type: string; price: number; vendorId: string }[] = [];
  for (const sp of SEED_PRODUCTS) {
    const vendor = vendorMap.get(sp.vendorStore);
    if (!vendor) continue;
    const catId = categoryMap.get(sp.categoryName);
    const gradient = TYPE_GRADIENTS[sp.type] ?? ["#10b981", "#0d9488"];
    const icon = TYPE_ICONS[sp.type] ?? "Package";
    // store cover as a small JSON object so the frontend can render a gradient+icon
    const cover = JSON.stringify({ type: "gradient", colors: gradient, icon, seed: slugify(sp.title) });
    const product = await db.product.create({
      data: {
        title: sp.title,
        slug: slugify(sp.title),
        shortDescription: sp.shortDescription,
        description: sp.description,
        type: sp.type,
        status: "PUBLISHED",
        price: sp.price,
        discountPrice: sp.discountPrice ?? null,
        currency: "USD",
        sku: `PB-${slugify(sp.title).slice(0, 14).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        stock: sp.stock ?? null,
        images: JSON.stringify([cover]),
        tags: JSON.stringify(sp.tags),
        licenseType: sp.licenseType ?? null,
        downloadFile: sp.fileSize ? `/downloads/${slugify(sp.title)}.zip` : null,
        fileSize: sp.fileSize ?? null,
        version: sp.version ?? null,
        changelog: JSON.stringify([
          { version: sp.version ?? "1.0.0", date: "2024-06-01", notes: "Initial PlayBeat release." },
        ]),
        featured: sp.featured ?? false,
        rating: 4 + Math.random(),
        reviewCount: 0,
        salesCount: Math.floor(Math.random() * 1200) + 50,
        vendorId: vendor.id,
        categoryId: catId,
      },
    });
    createdProducts.push({ id: product.id, title: product.title, type: product.type, price: product.price, vendorId: vendor.id });
    productCount++;
  }
  created.products = productCount;

  // ---- Reviews ----
  let reviewCount = 0;
  for (const p of createdProducts) {
    const numReviews = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numReviews; i++) {
      const r = REVIEW_SEED[(p.id.charCodeAt(0) + i) % REVIEW_SEED.length];
      await db.review.create({
        data: {
          productId: p.id,
          userId: customer.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          verified: true,
          status: "APPROVED",
          vendorReply: i === 0 ? "Thank you for the kind words!" : null,
        },
      });
      reviewCount++;
    }
    const avg = numReviews > 0 ? REVIEW_SEED.slice(0, numReviews).reduce((a, b) => a + b.rating, 0) / numReviews : p.price > 0 ? 4.5 : 4;
    await db.product.update({ where: { id: p.id }, data: { reviewCount: numReviews, rating: Math.round(avg * 10) / 10 } });
  }
  created.reviews = reviewCount;

  // ---- Coupons ----
  const coupons = [
    { code: "WELCOME10", type: "PERCENTAGE", value: 10, minPurchase: 0, maxUses: 1000 },
    { code: "SAVE25", type: "PERCENTAGE", value: 25, minPurchase: 100, maxUses: 500 },
    { code: "FLAT15", type: "FIXED", value: 15, minPurchase: 50, maxUses: 1000 },
    { code: "AI50", type: "PERCENTAGE", value: 50, minPurchase: 80, maxUses: 200, vendorId: vendorMap.get("NovaLabs")?.id },
    { code: "FREESHIP", type: "FIXED", value: 5, minPurchase: 0, maxUses: 5000 },
  ];
  for (const c of coupons) {
    await db.coupon.create({
      data: {
        code: c.code,
        type: c.type,
        value: c.value,
        minPurchase: c.minPurchase,
        maxUses: c.maxUses,
        usedCount: Math.floor(Math.random() * (c.maxUses ?? 100)),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
        active: true,
        vendorId: c.vendorId ?? null,
      },
    });
  }
  created.coupons = coupons.length;

  // ---- Affiliate ----
  const affCode = generateAffiliateCode(affiliateUser.name);
  const affiliate = await db.affiliate.create({
    data: {
      userId: affiliateUser.id,
      code: affCode,
      commissionRate: 12,
      totalClicks: 1840,
      totalConversions: 312,
      totalEarnings: 8420.5,
      balance: 1240.75,
      status: "ACTIVE",
    },
  });
  // affiliate clicks
  for (let i = 0; i < 40; i++) {
    await db.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ip: "203.0.113." + (i % 255),
        userAgent: "Mozilla/5.0",
        converted: i % 8 === 0,
      },
    });
  }
  // payouts
  const payouts = [
    { amount: 1820, status: "COMPLETED", method: "PayPal", daysAgo: 45 },
    { amount: 2310, status: "COMPLETED", method: "Bank Transfer", daysAgo: 20 },
    { amount: 1240.75, status: "PENDING", method: "PayPal", daysAgo: 1 },
  ];
  for (const p of payouts) {
    await db.payout.create({
      data: {
        affiliateId: affiliate.id,
        amount: p.amount,
        status: p.status,
        method: p.method,
        createdAt: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }
  created.affiliates = 1;
  created.payouts = payouts.length;

  // ---- Orders (recent, for analytics) ----
  let orderCount = 0;
  const payments: { provider: string }[] = [
    { provider: "STRIPE" },
    { provider: "PAYPAL" },
    { provider: "LEMON_SQUEEZY" },
    { provider: "PADDLE" },
  ];
  for (let i = 0; i < 48; i++) {
    const p = createdProducts[i % createdProducts.length];
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const useDiscount = p.price > 0 && Math.random() > 0.5;
    const finalPrice = useDiscount && p.price > 20 ? p.price * 0.85 : p.price;
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: customer.id,
        status: "COMPLETED",
        subtotal: finalPrice,
        discount: useDiscount && p.price > 20 ? p.price - finalPrice : 0,
        total: finalPrice,
        currency: "USD",
        couponCode: useDiscount && p.price > 20 ? "WELCOME10" : null,
        customerName: ["Demo Customer", "Jordan M.", "Priya K.", "Tomas R.", "Aisha B."][i % 5],
        customerEmail: ["demo@playbeat.io", "jordan@example.com", "priya@example.com", "tomas@example.com", "aisha@example.com"][i % 5],
        affiliateCode: i % 5 === 0 ? affCode : null,
        createdAt,
        items: {
          create: {
            productId: p.id,
            price: finalPrice,
            licenseKey: generateLicenseKey(),
          },
        },
        payment: {
          create: {
            provider: payments[i % payments.length].provider,
            amount: finalPrice,
            currency: "USD",
            status: "COMPLETED",
            transactionId: "txn_" + Math.random().toString(36).slice(2, 12),
          },
        },
      },
    });
    orderCount++;
    // update vendor stats + sales count occasionally
    if (i % 3 === 0) {
      await db.vendor.update({
        where: { id: p.vendorId },
        data: { totalSales: { increment: 1 }, totalRevenue: { increment: finalPrice } },
      });
    }
  }
  created.orders = orderCount;

  // ---- Notifications ----
  const notifs = [
    { type: "ORDER", title: "Order completed", message: "Your order #PB-1024 was completed. Downloads are ready." },
    { type: "PAYMENT", title: "Payment received", message: "Payment of $59.00 was received via Stripe." },
    { type: "PRODUCT", title: "New product approved", message: "NovaScript AI Writer is now published." },
    { type: "AFFILIATE", title: "Affiliate payout processed", message: "Payout of $1,820.00 was sent via PayPal." },
    { type: "REFUND", title: "Refund request", message: "A customer requested a refund for order #PB-1019." },
  ];
  for (const n of notifs) {
    await db.notification.create({
      data: { userId: customer.id, type: n.type, title: n.title, message: n.message, read: Math.random() > 0.5 },
    });
  }
  created.notifications = notifs.length;

  // ---- Settings ----
  const settings = [
    { key: "site_name", value: "PlayBeat Storefront" },
    { key: "currency", value: "USD" },
    { key: "commission_default", value: "10" },
    { key: "payment_gateways", value: JSON.stringify(["stripe", "paypal", "lemonsqueezy", "paddle"]) },
    { key: "maintenance", value: "false" },
  ];
  for (const s of settings) {
    await db.settings.create({ data: s });
  }
  created.settings = settings.length;

  return { created };
}
