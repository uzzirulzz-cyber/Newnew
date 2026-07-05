"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, ArrowRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicLayout } from "@/components/website-builder/public-layout";

type Job = {
  id: string;
  slug: string;
  title: string;
  department?: string;
  location?: string;
  type?: string;
  description: string;
  published: boolean;
  order: number;
};

const typeColors: Record<string, string> = {
  "full-time": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "part-time": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "contract": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function CareersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["careers"],
    queryFn: () => api.careersList(),
  });
  const [activeDept, setActiveDept] = useState("All");

  const published = ((data?.items ?? []) as Job[]).filter((j) => j.published);
  const departments = [
    "All",
    ...Array.from(new Set(published.map((j) => j.department).filter(Boolean) as string[])),
  ];
  const filtered = activeDept === "All" ? published : published.filter((j) => j.department === activeDept);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Careers</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Join our team</h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            We&apos;re always looking for talented people. Explore our open roles below.
          </p>
        </motion.div>

        {/* Department filter */}
        {departments.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
                  activeDept === dept
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {dept}
              </button>
            ))}
          </div>
        )}

        {/* Job listings */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-border rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1">No open positions</h3>
            <p className="text-sm text-muted-foreground">Check back soon for new opportunities.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
              >
                <a
                  href={`/careers/${job.slug}`}
                  className="group block bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/6 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {job.type && (
                          <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", typeColors[job.type] ?? "bg-muted text-muted-foreground")}>
                            {job.type}
                          </span>
                        )}
                        {job.department && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3" /> {job.department}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {job.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
