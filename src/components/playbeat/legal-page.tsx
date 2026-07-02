"use client";

import * as React from "react";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { LogoMark } from "@/components/playbeat/logo";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalPage({ title, subtitle, lastUpdated, sections }: LegalPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero band */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 pb-glow" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <LogoMark size={40} />
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                  <Shield className="size-3" />
                  Legal
                </div>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {title}
                </h1>
              </div>
            </motion.div>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="space-y-8">
            {sections.map((s, i) => (
              <motion.div
                key={s.heading}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.03 }}
              >
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                  {s.heading}
                </h2>
                <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {s.body}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact footer */}
          <div className="mt-12 rounded-xl border border-border/60 bg-card/40 p-5">
            <h3 className="text-sm font-semibold">Questions?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Contact us at{" "}
              <a
                href="mailto:info@playbeat.digital"
                className="font-medium text-accent hover:underline"
              >
                info@playbeat.digital
              </a>{" "}
              or WhatsApp{" "}
              <a
                href="https://wa.me/923321029333"
                className="font-medium text-accent hover:underline"
              >
                0332 102 9333
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
