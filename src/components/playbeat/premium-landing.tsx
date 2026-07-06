"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Play,
  Tv,
  Film,
  Sparkles,
  Code2,
  ShoppingBag,
  Zap,
  Globe,
  Shield,
  Clock,
  Cloud,
  Cpu,
  ChevronDown,
  ArrowRight,
  Star,
  Menu,
  X,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LogoMark } from "@/components/playbeat/logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── NAV ─── */
function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Home", "IPTV", "Streaming", "AI", "Development", "Marketplace", "Pricing", "Blog", "Contact"];
  // Routes that should navigate to a separate page instead of scrolling
  const routeLinks: Record<string, string> = {
    Marketplace: "/marketplace",
  };

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "pb-glass py-3" : "py-5",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="text-xl font-black uppercase tracking-tight" style={{ letterSpacing: "-0.02em" }}><span style={{ color: "#e2e8f0" }}>PLAY</span><span style={{ color: "#ef4444" }}>BEA</span><span style={{ color: "#3b82f6" }}>T</span></span>
        </div>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const route = routeLinks[l];
            return route ? (
              <a
                key={l}
                href={route}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l}
              </a>
            ) : (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l}
              </a>
            );
          })}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href="/admin">Login</a>
          </Button>
          <Button size="sm" className="gap-1.5 bg-primary pb-neon" asChild>
            <a href="/marketplace">Get Started <ArrowRight className="size-3.5" /></a>
          </Button>
        </div>
        <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="pb-glass mt-3 px-6 py-4 lg:hidden">
          {links.map((l) => {
            const route = routeLinks[l];
            return route ? (
              <a
                key={l}
                href={route}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {l}
              </a>
            ) : (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {l}
              </a>
            );
          })}
          <Button size="sm" className="mt-3 w-full" asChild>
            <a href="/marketplace">Get Started</a>
          </Button>
        </div>
      )}
    </nav>
  );
}

/* ─── HERO ─── */
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Animated bg */}
      <div className="absolute inset-0 pb-grid opacity-40" />
      <div className="absolute inset-0 pb-glow" />
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute left-1/4 top-1/4 size-96 rounded-full bg-primary/20 blur-[120px] pb-pulse-glow" />
        <div className="absolute right-1/4 top-1/3 size-80 rounded-full bg-accent/15 blur-[100px] pb-pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/4 left-1/3 size-72 rounded-full bg-primary/10 blur-[90px] pb-pulse-glow" style={{ animationDelay: "2s" }} />
      </motion.div>

      {/* Floating cards */}
      <FloatingCards />

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Globe className="size-3" /> Global Digital Entertainment Platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
        >
          Everything Digital.{" "}
          <span className="pb-text-gradient">One Platform.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          IPTV • Streaming • Digital Products • AI Solutions • Web Development •
          Software • Global Entertainment
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg" className="h-12 gap-2 px-8 pb-neon">
            Explore Services <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 gap-2 border-primary/30 px-8 hover:bg-primary/10"
          >
            <Play className="size-4" /> Start Streaming
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="size-6 animate-bounce text-muted-foreground" />
      </motion.div>
    </section>
  );
}

function FloatingCards() {
  const cards = [
    { icon: Tv, label: "Live TV", pos: "left-[5%] top-[20%]", delay: 0 },
    { icon: Film, label: "Movies", pos: "right-[8%] top-[25%]", delay: 0.5 },
    { icon: Sparkles, label: "AI", pos: "left-[10%] bottom-[15%]", delay: 1 },
    { icon: Play, label: "Sports", pos: "right-[6%] bottom-[20%]", delay: 1.5 },
  ];
  return (
    <div className="absolute inset-0 hidden lg:block">
      {cards.map((c) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + c.delay, duration: 0.5 }}
          className={cn("absolute", c.pos)}
        >
          <div className="pb-glass flex items-center gap-2 rounded-2xl px-4 py-3 pb-float" style={{ animationDelay: `${c.delay}s` }}>
            <c.icon className="size-5 text-primary" />
            <span className="text-sm font-medium">{c.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── STATS ─── */
function Stats() {
  const stats = [
    { value: "150+", label: "Countries" },
    { value: "20,000+", label: "Entertainment Assets" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
  ];
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl font-extrabold pb-text-gradient sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SERVICES ─── */
function Services() {
  const services = [
    {
      icon: Tv,
      title: "IPTV",
      desc: "Watch thousands of live TV channels",
      tags: ["HD", "FHD", "4K", "Sports", "Movies", "News", "Kids", "Music"],
      color: "from-blue-600 to-cyan-500",
    },
    {
      icon: Film,
      title: "Streaming",
      desc: "On-demand entertainment library",
      tags: ["Movies", "Series", "Documentaries", "Anime", "Entertainment"],
      color: "from-purple-600 to-pink-500",
    },
    {
      icon: Sparkles,
      title: "AI Solutions",
      desc: "Cutting-edge artificial intelligence",
      tags: ["Chatbots", "Automation", "Voice AI", "Image Generation", "Business"],
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: Code2,
      title: "Web Development",
      desc: "Enterprise-grade web applications",
      tags: ["React", "Next.js", "Node.js", "MongoDB", "Cloud", "Payments"],
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: ShoppingBag,
      title: "Digital Marketplace",
      desc: "Buy and sell digital products globally",
      tags: ["Software", "Templates", "Courses", "Subscriptions", "Downloads"],
      color: "from-amber-500 to-orange-500",
    },
  ];
  return (
    <section id="iptv" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Featured Services"
          title="One platform, every digital service"
          subtitle="From IPTV to AI, streaming to software — PlayBeat Digital covers your entire digital entertainment and business needs."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="pb-glass-hover group rounded-2xl p-6"
            >
              <div className={cn("mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br shadow-lg", s.color)}>
                <s.icon className="size-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── LIVE TV SHOWCASE ─── */
function LiveTV() {
  const categories = [
    { name: "Sports", icon: Play, count: "120+ channels" },
    { name: "Entertainment", icon: Tv, count: "340+ channels" },
    { name: "News", icon: Globe, count: "80+ channels" },
    { name: "Movies", icon: Film, count: "200+ channels" },
    { name: "Kids", icon: Sparkles, count: "60+ channels" },
    { name: "Music", icon: Play, count: "90+ channels" },
    { name: "International", icon: Globe, count: "500+ channels" },
  ];
  return (
    <section id="streaming" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Live TV"
          title="Netflix-style browsing experience"
          subtitle="Thousands of live channels across every category, with a premium browsing interface."
        />
        <div className="mt-10 flex gap-4 overflow-x-auto pb-scrollbar pb-4">
          {categories.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="pb-glass-hover group flex min-w-[200px] cursor-pointer flex-col items-center gap-3 rounded-2xl p-6"
            >
              <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                <c.icon className="size-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.count}</p>
              </div>
              <Button size="sm" variant="outline" className="mt-1 opacity-0 transition-opacity group-hover:opacity-100">
                Watch
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── WHY CHOOSE ─── */
function WhyChoose() {
  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Global CDN with sub-100ms latency" },
    { icon: Globe, title: "Global CDN", desc: "Edge servers in 150+ countries" },
    { icon: Shield, title: "Secure Payments", desc: "PCI-DSS compliant, encrypted" },
    { icon: Clock, title: "24/7 Support", desc: "Round-the-clock expert help" },
    { icon: Cloud, title: "Cloud Infrastructure", desc: "Auto-scaling, 99.9% uptime" },
    { icon: Cpu, title: "AI Powered", desc: "Smart recommendations & automation" },
  ];
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Why PlayBeat"
          title="Built for performance and scale"
          subtitle="Enterprise-grade infrastructure powering global digital entertainment."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="pb-glass-hover flex items-start gap-4 rounded-2xl p-6"
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10">
                <f.icon className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TIMELINE ─── */
function Timeline() {
  const milestones = [
    { year: "2025", title: "Founded", desc: "PlayBeat Digital is born" },
    { year: "2025", title: "Global Expansion", desc: "Launched in 50+ countries" },
    { year: "2026", title: "Digital Marketplace", desc: "Launched product marketplace" },
    { year: "2026", title: "Streaming Platform", desc: "On-demand streaming live" },
    { year: "2026", title: "AI Products", desc: "AI solutions launched" },
    { year: "2026", title: "Worldwide Brand", desc: "150+ countries served" },
  ];
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading eyebrow="Our Journey" title="From startup to global platform" />
        <div className="mt-12 space-y-8">
          {milestones.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-6"
            >
              <div className="flex flex-col items-center">
                <div className="grid size-12 place-items-center rounded-full bg-primary/15 pb-neon">
                  <span className="text-xs font-bold text-primary">{m.year.slice(-2)}</span>
                </div>
                {i < milestones.length - 1 && (
                  <div className="mt-2 h-12 w-px bg-gradient-to-b from-primary/40 to-transparent" />
                )}
              </div>
              <div className="pb-glass flex-1 rounded-xl p-4">
                <h3 className="font-bold">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
                <span className="text-xs text-primary">{m.year}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
function Pricing() {
  const plans = [
    { name: "Starter", price: "Rs 999", period: "/month", features: ["10 IPTV channels", "Basic streaming", "Email support", "1 device"], popular: false },
    { name: "Professional", price: "Rs 2,499", period: "/month", features: ["500+ IPTV channels", "HD streaming", "Priority support", "5 devices", "AI tools access", "Marketplace access"], popular: true },
    { name: "Enterprise", price: "Rs 9,999", period: "/month", features: ["All channels (4K)", "Full streaming library", "24/7 dedicated support", "Unlimited devices", "Custom AI solutions", "White-label option", "API access"], popular: false },
  ];
  return (
    <section id="pricing" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Pricing" title="Plans for every scale" subtitle="Transparent pricing. No hidden fees. Cancel anytime." />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "pb-glass-hover relative rounded-2xl p-8",
                p.popular && "border-primary/50 pb-neon",
              )}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground pb-neon">
                  POPULAR
                </span>
              )}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <div className="size-1.5 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" variant={p.popular ? "default" : "outline"}>
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
function Testimonials() {
  const reviews = [
    { name: "Ahmed R.", role: "IPTV Subscriber", text: "Best streaming service I've used. 4K quality, zero buffering, and thousands of channels.", rating: 5 },
    { name: "Sarah K.", role: "Business Owner", text: "The AI solutions transformed our customer support. Response times dropped 80%.", rating: 5 },
    { name: "Mike T.", role: "Developer", text: "PlayBeat's web development team delivered our platform in 2 weeks. Incredible quality.", rating: 5 },
    { name: "Priya N.", role: "Marketplace Seller", text: "Sold 500+ digital products in the first month. The platform is seamless.", rating: 5 },
  ];
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Testimonials" title="Loved by thousands worldwide" />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="pb-glass-hover rounded-2xl p-6"
            >
              <div className="flex gap-1">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">"{r.text}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PARTNERS ─── */
function Partners() {
  const partners = ["Stripe", "PayPal", "Google", "Microsoft", "AWS", "Cloudflare", "MongoDB", "Vercel", "GitHub"];
  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-7xl overflow-hidden px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Trusted by industry leaders
        </p>
        <div className="mt-8 overflow-hidden">
          <div className="pb-marquee flex gap-12">
            {[...partners, ...partners].map((p, i) => (
              <span key={i} className="whitespace-nowrap text-xl font-bold text-muted-foreground/40">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    { q: "What is PlayBeat Digital?", a: "PlayBeat Digital is a global digital entertainment platform offering IPTV, streaming, AI solutions, web development, and a digital marketplace — all in one place." },
    { q: "How many channels do you offer?", a: "We offer 1,400+ live TV channels across Sports, Movies, News, Kids, Music, and International categories, in HD, FHD, and 4K quality." },
    { q: "Can I cancel my subscription anytime?", a: "Yes, all subscriptions can be cancelled anytime with no cancellation fees. Your access remains until the end of the billing period." },
    { q: "Do you offer custom AI solutions?", a: "Yes, our Enterprise plan includes custom AI solutions tailored to your business needs, including chatbots, automation, and voice AI." },
    { q: "What payment methods do you accept?", a: "We accept JazzCash, EasyPaisa, bank transfer, credit/debit cards via Stripe, PayPal, Lemon Squeezy, and cryptocurrency." },
    { q: "Is there a free trial?", a: "Yes, we offer a 7-day free trial on all plans. No credit card required to start." },
  ];
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="pb-glass rounded-xl px-5">
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─── CONTACT ─── */
function Contact() {
  return (
    <section id="contact" className="relative py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading eyebrow="Contact" title="Get in touch" subtitle="We're here 24/7. Reach out anytime." />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="pb-glass rounded-2xl p-6">
            <h3 className="font-bold">Send us a message</h3>
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent! We'll respond within 24 hours."); }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input placeholder="Your name" className="border-white/10 bg-white/5" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" placeholder="you@email.com" className="border-white/10 bg-white/5" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Message</Label>
                <Textarea placeholder="How can we help?" className="min-h-[120px] border-white/10 bg-white/5" />
              </div>
              <Button type="submit" className="w-full pb-neon">Send Message</Button>
            </form>
          </div>
          <div className="space-y-4">
            {[
              { icon: MessageCircle, label: "WhatsApp", value: "0332 102 9333", href: "https://wa.me/923321029333" },
              { icon: Mail, label: "Email", value: "info@playbeat.digital", href: "mailto:info@playbeat.digital" },
              { icon: Phone, label: "Phone", value: "+92 332 102 9333", href: "tel:+923321029333" },
              { icon: MapPin, label: "Location", value: "Karachi, Pakistan", href: "#" },
            ].map((c) => (
              <a key={c.label} href={c.href} className="pb-glass-hover flex items-center gap-4 rounded-xl p-5">
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10">
                  <c.icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="font-medium">{c.value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-black/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <LogoMark size={32} />
              <span className="text-xl font-black uppercase tracking-tight" style={{ letterSpacing: "-0.02em" }}><span style={{ color: "#e2e8f0" }}>PLAY</span><span style={{ color: "#ef4444" }}>BEA</span><span style={{ color: "#3b82f6" }}>T</span></span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Everything Digital. One Platform. Global entertainment, AI solutions, and digital products.
            </p>
            <div className="mt-4 flex gap-2">
              {["Facebook", "Instagram", "TikTok", "YouTube", "LinkedIn", "GitHub"].map((s) => (
                <a key={s} href="#" className="grid size-9 place-items-center rounded-lg bg-white/5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                  {s.charAt(0)}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold">Products</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="/marketplace" className="hover:text-primary">Marketplace</a></li>
              <li><a href="/games" className="hover:text-primary">Games</a></li>
              <li><a href="/ai-tools" className="hover:text-primary">AI Tools</a></li>
              <li><a href="/marketplace?category=gift-cards" className="hover:text-primary">Gift Cards</a></li>
              <li><a href="/marketplace?category=software-licenses" className="hover:text-primary">Software</a></li>
              <li><a href="/marketplace?category=saas-subscriptions" className="hover:text-primary">Subscriptions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="/privacy" className="hover:text-primary">Privacy</a></li>
              <li><a href="/terms" className="hover:text-primary">Terms</a></li>
              <li><a href="/refund-policy" className="hover:text-primary">Refund Policy</a></li>
              <li><a href="/admin" className="hover:text-primary">Admin</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">© 2026 PlayBeat Digital. All rights reserved.</p>
          <div className="flex gap-2">
            {["JazzCash", "Stripe", "PayPal", "Lemon Squeezy"].map((p) => (
              <span key={p} className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── SHARED ─── */
function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.05 }}
        className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/* ─── MAIN ─── */
export function PremiumLanding() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Stats />
      <Services />
      <LiveTV />
      <WhyChoose />
      <Timeline />
      <Pricing />
      <Testimonials />
      <Partners />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
