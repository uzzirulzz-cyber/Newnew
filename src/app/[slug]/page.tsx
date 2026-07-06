"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { PublicLayout } from "@/components/website-builder/public-layout";

type StaticPageDoc = {
  title: string;
  content: string;
  updatedAt: string;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function StaticPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["static-page", slug],
    queryFn: () => api.staticPage(slug),
    enabled: !!slug,
  });

  const page = data?.page as StaticPageDoc | undefined;

  // Unknown slug → bounce to home. The /api/v1/pages/[slug] endpoint returns
  // 404 for any slug other than the ones we ship (currently "about").
  useEffect(() => {
    if (!slug) return;
    if (isError) {
      router.replace("/");
    }
  }, [slug, isError, router]);

  if (isLoading || !page) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 pt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">{page.title}</h1>
          <p className="text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
            Last updated {formatDate(page.updatedAt)}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
