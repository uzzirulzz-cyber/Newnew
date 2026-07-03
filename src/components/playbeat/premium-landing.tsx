"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import {
  Globe,
  Film,
  Activity,
  Headphones,
  Tv,
  Play,
  Sparkles,
  Code,
  Package,
  Zap,
  Shield,
  Cloud,
  Brain,
  Menu,
  ArrowRight,
  CheckCircle2,
  Star,
  Mail,
  MessageCircle,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  Music2,
  Send,
  Lock,
  Truck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Shared helpers                                                            */
/* -------------------------------------------------------------------------- */

const NAV_LINKS = [
  { label: "Home", href: "/", target: "internal" as const },
  { label: "IPTV", href: "#iptv", target: "coming" as const },
  { label: "Streaming", href: "#streaming", target: "coming" as const },
  { label: "AI", href: "#ai", target: "coming" as const },
  { label: "Development", href: "#dev", target: "coming" as const },
  { label: "Marketplace", href: "/admin", target: "internal" as const },
  { label: "Pricing", href: "#pricing", target: "coming" as const },
  { label: "Blog", href: "#blog", target: "coming" as const },
  { label: "Contact", href: "#contact", target: "coming" as const },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

function useReveal() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return { ref, inView };
}

function handleNavLink(href: string, target: "internal" | "coming") {
  if (target === "internal") return;
  toast.info("Coming soon", {
    description: `${href.replace("#", "")} is launching soon. Stay tuned!`,
  });
}

/* -------------------------------------------------------------------------- */
/*  Animated Counter                                                          */
/* -------------------------------------------------------------------------- */

function AnimatedCounter({
  value,
  suffix = "",
  duration = 2000,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="font-numeric">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section Title                                                             */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={cn(
        "mb-12 max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400",
            align === "center" && "justify-center",
          )}
        >
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
          {eyebrow}
        </div>
      )}
      <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  1. Navbar                                                                 */
/* -------------------------------------------------------------------------- */

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "pb-glass border-b border-white/10 bg-black/60 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 pb-neon-blue">
            <Music2 className="h-5 w-5 text-white" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            PLAY<span className="pb-text-gradient">BEAT</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) =>
            link.target === "internal" ? (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                onClick={() => handleNavLink(link.href, link.target)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white"
              >
                {link.label}
              </button>
            ),
          )}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Login", { description: "Coming soon" })}
            className="text-muted-foreground hover:text-white"
          >
            Login
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("Register", { description: "Coming soon" })
            }
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Register
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 pb-neon-blue"
          >
            <Link href="/admin">
              Get Started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] border-white/10 bg-black/95 p-0"
          >
            <SheetHeader className="border-b border-white/10 px-6 py-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400">
                  <Music2 className="h-4 w-4 text-white" />
                </span>
                <span className="font-heading font-bold text-white">
                  PLAY<span className="pb-text-gradient">BEAT</span>
                </span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link) =>
                link.target === "internal" ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                ) : (
                  <button
                    key={link.label}
                    onClick={() => {
                      handleNavLink(link.href, link.target);
                      setMobileOpen(false);
                    }}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                ),
              )}
              <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    toast.info("Login", { description: "Coming soon" });
                    setMobileOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    toast.info("Register", { description: "Coming soon" });
                    setMobileOpen(false);
                  }}
                >
                  Register
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/admin">
                    Get Started <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  2. Hero                                                                   */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0 pb-grid opacity-60" />
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="pb-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-600/30 blur-[120px]" />
        <div
          className="pb-float absolute -right-32 top-40 h-96 w-96 rounded-full bg-cyan-500/25 blur-[120px]"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="pb-float absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-[100px]"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Video background */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        autoPlay
        muted
        loop
        playsInline
        poster=""
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8"
      >
        <motion.div variants={itemVariants}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-md">
            <span className="pb-pulse-glow relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400" />
            </span>
            Global Digital Entertainment Platform
          </div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="font-heading text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl"
        >
          Everything Digital.
          <br />
          <span className="pb-text-gradient">One Platform.</span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-6 max-w-3xl text-base text-muted-foreground sm:text-lg md:text-xl"
        >
          IPTV • Streaming • Digital Products • AI Solutions • Web Development •
          Software • Global Entertainment
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 pb-neon-blue sm:w-auto"
          >
            <Link href="/admin">
              Explore Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white sm:w-auto"
            onClick={() =>
              toast.info("Start Streaming", { description: "Coming soon" })
            }
          >
            <Play className="mr-2 h-4 w-4" />
            Start Streaming
          </Button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground sm:text-sm"
        >
          <span className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-cyan-400" /> Secure
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:inline-block" />
          <span className="flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-cyan-400" /> Instant Delivery
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:inline-block" />
          <span className="flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-cyan-400" /> 150+ Countries
          </span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/20 p-1.5">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-2 w-1 rounded-full bg-cyan-400"
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  3. Statistics                                                             */
/* -------------------------------------------------------------------------- */

function Statistics() {
  const stats = [
    {
      icon: Globe,
      value: 150,
      suffix: "+",
      label: "Countries",
      desc: "Served worldwide",
    },
    {
      icon: Film,
      value: 20000,
      suffix: "+",
      label: "Entertainment Assets",
      desc: "Channels, movies, products",
    },
    {
      icon: Activity,
      value: 99,
      suffix: ".9%",
      label: "Uptime",
      desc: "Enterprise-grade reliability",
    },
    {
      icon: Headphones,
      value: 24,
      suffix: "/7",
      label: "Support",
      desc: "Always here to help",
    },
  ];

  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="pb-glass-card group h-full overflow-hidden border-white/10 transition-all duration-300 hover:-translate-y-1 hover:pb-neon-blue">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/30 text-cyan-300 transition-transform group-hover:scale-110">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl font-bold text-white sm:text-4xl">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {stat.desc}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  4. Featured Services                                                      */
/* -------------------------------------------------------------------------- */

function FeaturedServices() {
  const services = [
    {
      icon: Tv,
      title: "IPTV",
      desc: "Watch thousands of live TV channels",
      tags: ["HD", "FHD", "4K", "Sports", "Movies", "News", "Kids", "Music"],
    },
    {
      icon: Play,
      title: "Streaming",
      desc: "Movies, Series, Documentaries, Anime, Entertainment",
      tags: ["Netflix", "Prime", "Disney+", "HBO", "Anime", "Docs"],
    },
    {
      icon: Sparkles,
      title: "AI",
      desc: "Chatbots, Automation, Voice AI, Image Generation, Business Solutions",
      tags: ["ChatGPT", "Claude", "Midjourney", "Voice", "Automation"],
    },
    {
      icon: Code,
      title: "Web Development",
      desc: "React, Next.js, Node.js, MongoDB, Cloud, Payment Integration",
      tags: ["React", "Next.js", "Node", "MongoDB", "Cloud", "Payments"],
    },
    {
      icon: Package,
      title: "Digital Marketplace",
      desc: "Software, Templates, Courses, Subscriptions, Digital Downloads",
      tags: ["Software", "Templates", "Courses", "Subscriptions"],
    },
  ];

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="What We Offer"
          title={
            <>
              Featured <span className="pb-text-gradient">Services</span>
            </>
          }
          subtitle="Everything you need for digital entertainment and growth — under one roof."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {services.map((service) => (
            <motion.div key={service.title} variants={itemVariants}>
              <Card className="pb-glass-card group h-full border-white/10 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:pb-neon-blue">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white transition-transform duration-300 group-hover:scale-110">
                    <service.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {service.desc}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {service.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-white/10 bg-white/5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  5. Live TV Showcase                                                       */
/* -------------------------------------------------------------------------- */

const TV_CATEGORIES: Record<
  string,
  { gradient: string; channels: { name: string; viewers: string }[] }
> = {
  Sports: {
    gradient: "from-orange-500 to-red-600",
    channels: [
      { name: "ESPN Sports", viewers: "82K" },
      { name: "Sky Sports HD", viewers: "65K" },
      { name: "BeIN Sports 1", viewers: "47K" },
      { name: "Fox Sports", viewers: "39K" },
      { name: "Tennis Channel", viewers: "21K" },
      { name: "NBA TV", viewers: "58K" },
      { name: "Golf Channel", viewers: "18K" },
      { name: "UFC Fight Pass", viewers: "44K" },
    ],
  },
  Entertainment: {
    gradient: "from-purple-500 to-pink-600",
    channels: [
      { name: "FX Entertainment", viewers: "55K" },
      { name: "Comedy Central", viewers: "38K" },
      { name: "TNT HD", viewers: "42K" },
      { name: "AMC Premium", viewers: "31K" },
      { name: "Bravo TV", viewers: "27K" },
      { name: "E! Network", viewers: "24K" },
      { name: "USA Network", viewers: "33K" },
      { name: "SyFy Channel", viewers: "19K" },
    ],
  },
  News: {
    gradient: "from-blue-500 to-indigo-600",
    channels: [
      { name: "CNN International", viewers: "71K" },
      { name: "BBC World News", viewers: "63K" },
      { name: "Al Jazeera", viewers: "48K" },
      { name: "Sky News HD", viewers: "37K" },
      { name: "Fox News", viewers: "59K" },
      { name: "MSNBC", viewers: "44K" },
      { name: "France 24", viewers: "22K" },
      { name: "NDTV 24x7", viewers: "29K" },
    ],
  },
  Movies: {
    gradient: "from-rose-500 to-purple-700",
    channels: [
      { name: "HBO Cinema", viewers: "68K" },
      { name: "Sony Movies", viewers: "41K" },
      { name: "MGM Channel", viewers: "26K" },
      { name: "Star Movies HD", viewers: "52K" },
      { name: "TCM Classics", viewers: "17K" },
      { name: "Film4 HD", viewers: "23K" },
      { name: "AXN Movies", viewers: "31K" },
      { name: "Cinema One", viewers: "28K" },
    ],
  },
  Kids: {
    gradient: "from-yellow-400 to-orange-500",
    channels: [
      { name: "Cartoon Network", viewers: "45K" },
      { name: "Disney Channel", viewers: "62K" },
      { name: "Nickelodeon", viewers: "38K" },
      { name: "Boomerang", viewers: "21K" },
      { name: "Baby TV", viewers: "14K" },
      { name: "PBS Kids", viewers: "29K" },
      { name: "Nick Jr.", viewers: "19K" },
      { name: "Disney Junior", viewers: "33K" },
    ],
  },
  Music: {
    gradient: "from-cyan-400 to-blue-600",
    channels: [
      { name: "MTV Live HD", viewers: "34K" },
      { name: "VH1 Classic", viewers: "22K" },
      { name: "Mtv Hits", viewers: "27K" },
      { name: "BET Soul", viewers: "15K" },
      { name: "CMT Music", viewers: "18K" },
      { name: "Stingray Classica", viewers: "9K" },
      { name: "MNet Music", viewers: "12K" },
      { name: "4Music HD", viewers: "16K" },
    ],
  },
  International: {
    gradient: "from-emerald-500 to-teal-600",
    channels: [
      { name: "Zee TV", viewers: "41K" },
      { name: "Star Plus", viewers: "38K" },
      { name: "Sony TV", viewers: "29K" },
      { name: "ARY Digital", viewers: "23K" },
      { name: "GEO Entertainment", viewers: "26K" },
      { name: "TVB Jade", viewers: "17K" },
      { name: "KBS World", viewers: "21K" },
      { name: "NHK World", viewers: "19K" },
    ],
  },
};

function LiveTVShowcase() {
  const [activeCategory, setActiveCategory] =
    React.useState<keyof typeof TV_CATEGORIES>("Sports");

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Streaming"
          title={
            <>
              Live TV <span className="pb-text-gradient">Channels</span>
            </>
          }
          subtitle="Thousands of channels across every category — stream anywhere, anytime."
        />

        {/* Category tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-scrollbar pb-2">
          {(Object.keys(TV_CATEGORIES) as (keyof typeof TV_CATEGORIES)[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all",
                  activeCategory === cat
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white pb-neon-blue"
                    : "pb-glass border border-white/10 text-muted-foreground hover:text-white",
                )}
              >
                {cat}
              </button>
            ),
          )}
        </div>

        {/* Channel cards */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-4 overflow-x-auto pb-scrollbar pb-4"
        >
          {TV_CATEGORIES[activeCategory].channels.map((channel) => (
            <div
              key={channel.name}
              className={cn(
                "group relative aspect-video w-64 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br",
                TV_CATEGORIES[activeCategory].gradient,
              )}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:bg-black/60" />

              {/* LIVE badge */}
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                <span className="pb-pulse-glow h-1.5 w-1.5 rounded-full bg-white" />
                Live
              </div>

              {/* Viewers */}
              <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                {channel.viewers} viewers
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <Tv className="mb-2 h-8 w-8 text-white/80 transition-transform group-hover:scale-110" />
                <div className="font-heading text-sm font-bold text-white drop-shadow-lg">
                  {channel.name}
                </div>
              </div>

              {/* Watch overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Button
                  size="sm"
                  className="bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
                  onClick={() =>
                    toast.info("Live TV", {
                      description: `${channel.name} — Coming soon with a subscription.`,
                    })
                  }
                >
                  <Play className="mr-1 h-3 w-3" /> Watch
                </Button>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  6. Why Choose PlayBeat                                                    */
/* -------------------------------------------------------------------------- */

function WhyChoose() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      desc: "Optimized CDN delivers your content with sub-100ms latency worldwide.",
    },
    {
      icon: Globe,
      title: "Global CDN",
      desc: "Edge servers in 150+ countries ensure smooth streaming everywhere.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      desc: "Bank-grade encryption with Stripe, PayPal, JazzCash & crypto support.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      desc: "Real humans ready to help any time, every day — no bots, no queues.",
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      desc: "99.9% uptime on enterprise-grade cloud with auto-scaling & failover.",
    },
    {
      icon: Brain,
      title: "AI Powered",
      desc: "Smart recommendations, automated workflows, and AI-driven insights.",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute inset-0 pb-glow opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Why Us"
          title={
            <>
              Why Choose <span className="pb-text-gradient">PlayBeat</span>
            </>
          }
          subtitle="We combine premium technology with a relentless focus on user experience."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={itemVariants}>
              <Card className="pb-glass-card group h-full border-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:pb-neon-blue">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-white transition-transform group-hover:scale-110">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  7. Company Timeline                                                       */
/* -------------------------------------------------------------------------- */

function Timeline() {
  const milestones = [
    {
      year: "2025",
      title: "Founded",
      desc: "PlayBeat Digital is born with a vision to unify digital entertainment globally.",
    },
    {
      year: "2025",
      title: "Global Expansion",
      desc: "Expanded operations across 150+ countries with localized payment rails.",
    },
    {
      year: "2026",
      title: "Digital Marketplace",
      desc: "Launched our marketplace for software, templates, courses & subscriptions.",
    },
    {
      year: "2026",
      title: "Streaming Platform",
      desc: "IPTV + on-demand streaming went live with 20,000+ assets and live channels.",
    },
    {
      year: "2026",
      title: "AI Products",
      desc: "Released chatbots, voice AI, image generation & business automation tools.",
    },
    {
      year: "2026",
      title: "Worldwide Brand",
      desc: "PlayBeat becomes a recognized global brand trusted by millions of users.",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Milestones"
          title={
            <>
              Our <span className="pb-text-gradient">Journey</span>
            </>
          }
          subtitle="From a bold idea to a global entertainment platform — every step of the way."
        />

        <div className="relative">
          {/* Center line on desktop */}
          <div className="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-blue-600 via-cyan-500 to-transparent md:left-1/2 md:-translate-x-1/2" />

          <div className="space-y-8 md:space-y-12">
            {milestones.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={`${m.year}-${m.title}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={cn(
                    "relative flex items-center gap-6 pl-12 md:pl-0",
                    isLeft ? "md:flex-row" : "md:flex-row-reverse",
                  )}
                >
                  {/* Dot */}
                  <div className="absolute left-4 z-10 flex h-3 w-3 -translate-x-1/2 items-center justify-center rounded-full bg-cyan-400 pb-neon-cyan md:left-1/2" />

                  {/* Card */}
                  <div className="md:w-1/2">
                    <Card className="pb-glass-card border-white/10">
                      <CardContent className="p-5">
                        <div className="mb-2 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-0.5 text-xs font-bold text-white">
                          {m.year}
                        </div>
                        <h3 className="font-heading text-base font-bold text-white">
                          {m.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {m.desc}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Spacer on the other side for desktop */}
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  8. Pricing                                                                */
/* -------------------------------------------------------------------------- */

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: 9,
      desc: "Perfect for trying things out",
      features: [
        "Basic features",
        "5 products",
        "Community support",
        "Standard CDN",
        "Email notifications",
      ],
      popular: false,
    },
    {
      name: "Professional",
      price: 29,
      desc: "For growing creators & businesses",
      features: [
        "All features",
        "50 products",
        "Priority support",
        "AI tools included",
        "Advanced analytics",
        "Custom branding",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: 99,
      desc: "Unlimited scale & dedicated help",
      features: [
        "Everything in Pro",
        "Unlimited products",
        "Dedicated support",
        "White label solution",
        "SLA & uptime guarantees",
        "Custom integrations",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Pricing"
          title={
            <>
              Pricing <span className="pb-text-gradient">Plans</span>
            </>
          }
          subtitle="Simple, transparent pricing. Cancel anytime. No hidden fees."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className={cn(
                "relative",
                plan.popular && "lg:-mt-4 lg:mb-4",
              )}
            >
              <Card
                className={cn(
                  "relative h-full overflow-hidden border-white/10",
                  plan.popular
                    ? "pb-gradient-border pb-neon-blue"
                    : "pb-glass-card",
                )}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0">
                    <div className="rounded-bl-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Popular
                    </div>
                  </div>
                )}
                <CardContent className="p-6 sm:p-8">
                  <h3 className="font-heading text-xl font-bold text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.desc}
                  </p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-4xl font-bold font-numeric text-white sm:text-5xl">
                      ${plan.price}
                    </span>
                    <span className="mb-1.5 text-sm text-muted-foreground">
                      /mo
                    </span>
                  </div>

                  <Button
                    className={cn(
                      "mt-6 w-full",
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90"
                        : "border border-white/20 bg-white/5 text-white hover:bg-white/10",
                    )}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() =>
                      toast.info("Checkout", {
                        description: `${plan.name} plan checkout coming soon!`,
                      })
                    }
                  >
                    Choose {plan.name}
                  </Button>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  9. Testimonials                                                           */
/* -------------------------------------------------------------------------- */

function Testimonials() {
  const reviews = [
    {
      name: "Ayesha Khan",
      role: "Content Creator",
      quote:
        "PlayBeat transformed how I deliver content to my audience. The streaming quality is unreal and the support team is incredible.",
      rating: 5,
    },
    {
      name: "Marcus Lee",
      role: "Digital Entrepreneur",
      quote:
        "I've tried every platform out there — none come close. From IPTV to AI tools, everything just works. Best investment I've made this year.",
      rating: 5,
    },
    {
      name: "Sofia Ramirez",
      role: "SaaS Founder",
      quote:
        "The marketplace + dev tools combo is unbeatable. We launched our product on PlayBeat and reached 10k users in the first month.",
      rating: 5,
    },
  ];

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Testimonials"
          title={
            <>
              What Our Users <span className="pb-text-gradient">Say</span>
            </>
          }
          subtitle="Trusted by creators, founders, and entertainment lovers worldwide."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {reviews.map((r) => (
            <motion.div key={r.name} variants={itemVariants}>
              <Card className="pb-glass-card h-full border-white/10">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-cyan-400 text-cyan-400"
                      />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                    “{r.quote}”
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 font-heading text-sm font-bold text-white">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {r.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  10. Partners Marquee                                                      */
/* -------------------------------------------------------------------------- */

function Partners() {
  const partners = [
    "Stripe",
    "PayPal",
    "Google",
    "Microsoft",
    "AWS",
    "Cloudflare",
    "MongoDB",
    "Vercel",
    "GitHub",
    "Lemon Squeezy",
  ];
  const doubled = [...partners, ...partners];

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Partners"
          title={
            <>
              Trusted By Industry <span className="pb-text-gradient">Leaders</span>
            </>
          }
          subtitle="Powering PlayBeat with the best infrastructure and payment partners in the world."
        />
      </div>

      <div className="relative mt-10">
        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

        <div className="flex w-max pb-marquee gap-4">
          {doubled.map((p, idx) => (
            <div
              key={`${p}-${idx}`}
              className="flex h-16 min-w-44 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 backdrop-blur-md"
            >
              <span className="font-heading text-lg font-semibold text-white/70">
                {p}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  11. FAQ                                                                   */
/* -------------------------------------------------------------------------- */

function FAQ() {
  const faqs = [
    {
      q: "What is PlayBeat Digital?",
      a: "PlayBeat Digital is a global digital entertainment platform offering IPTV, streaming, digital products, AI solutions, web development, software, and a digital marketplace — all in one place.",
    },
    {
      q: "How do I receive my products?",
      a: "Products are delivered instantly via email and your account dashboard. License keys and download links appear immediately after a successful purchase.",
    },
    {
      q: "Are the products legitimate?",
      a: "Yes, all products are verified and sourced from authorized partners. We work directly with vendors to ensure authenticity and full licensing compliance.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Lemon Squeezy, JazzCash, EasyPaisa, Visa, Mastercard, Stripe, PayPal, and cryptocurrency. Available methods may vary by region.",
    },
    {
      q: "Do you offer refunds?",
      a: "Yes. Refund eligibility depends on the product type and is outlined in our refund policy. Digital subscriptions typically qualify if requested within 24 hours of purchase.",
    },
    {
      q: "Can I access IPTV channels?",
      a: "Yes. IPTV access is included with any subscription plan. You'll get thousands of live TV channels across sports, news, movies, kids, music and international content.",
    },
    {
      q: "Is there a mobile app?",
      a: "Our mobile apps for Android and iOS are coming soon. In the meantime, the web platform is fully responsive and works flawlessly on mobile browsers.",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="FAQ"
          title={
            <>
              Frequently Asked <span className="pb-text-gradient">Questions</span>
            </>
          }
          subtitle="Everything you need to know about PlayBeat Digital."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <Card className="pb-glass-card border-white/10">
            <CardContent className="p-2 sm:p-4">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="border-white/10"
                  >
                    <AccordionTrigger className="px-4 text-left text-base font-semibold text-white hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  12. Contact                                                               */
/* -------------------------------------------------------------------------- */

function Contact() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    // Simulate async submit
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("Message sent!", {
      description: "We'll get back to you soon.",
    });
  };

  const socials = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Music2, label: "TikTok", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Github, label: "GitHub", href: "#" },
  ];

  const contactInfo = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "0332 102 9333",
      href: "https://wa.me/923321029333",
    },
    {
      icon: Mail,
      label: "Email",
      value: "info@playbeat.digital",
      href: "mailto:info@playbeat.digital",
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Pakistan",
      href: "#",
    },
  ];

  return (
    <section id="contact" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Contact"
          title={
            <>
              Get In <span className="pb-text-gradient">Touch</span>
            </>
          }
          subtitle="Have questions, partnership ideas, or need support? We'd love to hear from you."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <Card className="pb-glass-card h-full border-white/10">
              <CardContent className="p-6 sm:p-8">
                <h3 className="mb-6 font-heading text-xl font-bold text-white">
                  Send us a message
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Your name"
                        className="border-white/10 bg-white/5 text-white placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className="border-white/10 bg-white/5 text-white placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      placeholder="How can we help?"
                      className="border-white/10 bg-white/5 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      placeholder="Tell us more..."
                      rows={5}
                      className="resize-none border-white/10 bg-white/5 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 pb-neon-blue"
                  >
                    {sending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact info + socials */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            {contactInfo.map((info) => (
              <a
                key={info.label}
                href={info.href}
                target={info.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="pb-glass-card group border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:pb-neon-blue">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white transition-transform group-hover:scale-110">
                      <info.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        {info.label}
                      </div>
                      <div className="font-heading text-sm font-semibold text-white sm:text-base">
                        {info.value}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}

            <Card className="pb-glass-card border-white/10">
              <CardContent className="p-5">
                <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Follow us
                </div>
                <div className="flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <Button
                      key={s.label}
                      variant="outline"
                      size="icon"
                      aria-label={s.label}
                      onClick={() =>
                        toast.info(s.label, {
                          description: "Follow link coming soon",
                        })
                      }
                      className="h-10 w-10 border-white/10 bg-white/5 text-white hover:bg-gradient-to-br hover:from-blue-600 hover:to-cyan-400"
                    >
                      <s.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  13. Footer                                                                */
/* -------------------------------------------------------------------------- */

function Footer() {
  const cols = [
    {
      title: "Company",
      links: [
        { label: "About", href: "#", target: "coming" as const },
        { label: "Blog", href: "#", target: "coming" as const },
        { label: "Careers", href: "#", target: "coming" as const },
        { label: "Contact", href: "#contact", target: "coming" as const },
      ],
    },
    {
      title: "Products",
      links: [
        { label: "IPTV", href: "#", target: "coming" as const },
        { label: "Streaming", href: "#", target: "coming" as const },
        { label: "AI", href: "#", target: "coming" as const },
        { label: "Marketplace", href: "/admin", target: "internal" as const },
        { label: "Pricing", href: "#pricing", target: "coming" as const },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy", target: "internal" as const },
        { label: "Terms", href: "/terms", target: "internal" as const },
        {
          label: "Refund Policy",
          href: "/refund-policy",
          target: "internal" as const,
        },
        { label: "Admin", href: "/admin", target: "internal" as const },
      ],
    },
  ];

  const socials = [
    { icon: Facebook, label: "Facebook" },
    { icon: Instagram, label: "Instagram" },
    { icon: Music2, label: "TikTok" },
    { icon: Youtube, label: "YouTube" },
    { icon: Linkedin, label: "LinkedIn" },
    { icon: Github, label: "GitHub" },
  ];

  const payments = [
    "Visa",
    "Mastercard",
    "JazzCash",
    "EasyPaisa",
    "Stripe",
    "PayPal",
    "Lemon Squeezy",
    "Crypto",
  ];

  return (
    <footer className="mt-auto border-t border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 pb-neon-blue">
                <Music2 className="h-5 w-5 text-white" />
              </span>
              <span className="font-heading text-lg font-bold tracking-tight text-white">
                PLAY<span className="pb-text-gradient">BEAT</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The global digital entertainment platform. IPTV, streaming, AI
              tools, web development, software & a digital marketplace — all in
              one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {socials.map((s) => (
                <Button
                  key={s.label}
                  variant="outline"
                  size="icon"
                  aria-label={s.label}
                  onClick={() =>
                    toast.info(s.label, {
                      description: "Follow link coming soon",
                    })
                  }
                  className="h-9 w-9 border-white/10 bg-white/5 text-white hover:bg-gradient-to-br hover:from-blue-600 hover:to-cyan-400"
                >
                  <s.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.target === "internal" ? (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-cyan-300"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleNavLink(link.href, link.target)}
                        className="text-sm text-muted-foreground transition-colors hover:text-cyan-300"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment badges */}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
          <span className="mr-2 text-xs uppercase tracking-wider text-muted-foreground">
            We accept
          </span>
          {payments.map((p) => (
            <span
              key={p}
              className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 PlayBeat Digital. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="pb-pulse-glow h-2 w-2 rounded-full bg-emerald-400" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export function PremiumLanding() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Statistics />
        <FeaturedServices />
        <LiveTVShowcase />
        <WhyChoose />
        <Timeline />
        <Pricing />
        <Testimonials />
        <Partners />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
