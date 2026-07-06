"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicLayout } from "@/components/website-builder/public-layout";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category?: string;
  published: boolean;
  order: number;
};

export default function FaqPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["faq"],
    queryFn: () => api.faqList(),
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const published = ((data?.items ?? []) as FaqItem[]).filter((f) => f.published);
  const categories = [
    "All",
    ...Array.from(new Set(published.map((f) => f.category).filter(Boolean) as string[])),
  ];
  const filtered = activeCategory === "All" ? published : published.filter((f) => f.category === activeCategory);

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">FAQ</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Frequently asked questions</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know. Can&apos;t find the answer?{" "}
            <a href="/contact" className="text-primary hover:underline">Contact us.</a>
          </p>
        </motion.div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* FAQs */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-border rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1">No FAQs yet</h3>
            <p className="text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-sm pr-4">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
                      openId === faq.id && "rotate-180"
                    )}
                  />
                </button>
                {openId === faq.id && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {faq.answer}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
