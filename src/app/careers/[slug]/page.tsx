"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Building2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
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

export default function CareerDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["career", slug],
    queryFn: () => api.career(slug),
    enabled: !!slug,
  });

  const job = data?.job as Job | undefined;

  // If the job can't be found (or isn't published), bounce back to the listing.
  useEffect(() => {
    if (!slug) return;
    if (isError || (!isLoading && job && !job.published)) {
      router.replace("/careers");
    }
  }, [slug, isError, isLoading, job, router]);

  if (isLoading || !job) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-64 w-full rounded-xl mt-8" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-10"
        >
          <a
            href="/careers"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Careers
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Type badge */}
          {job.type && (
            <span className={cn("inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4", typeColors[job.type] ?? "bg-muted text-muted-foreground")}>
              {job.type}
            </span>
          )}

          <h1 className="text-4xl font-extrabold tracking-tight mb-4">{job.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
            {job.department && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {job.department}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {job.location}
              </span>
            )}
            {job.type && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {job.type}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>{job.description}</ReactMarkdown>
          </div>

          {/* Apply CTA */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 text-center">
            <h3 className="font-bold text-lg mb-2">Interested in this role?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Send your resume and a short introduction to apply.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Apply via Contact Page
            </a>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
