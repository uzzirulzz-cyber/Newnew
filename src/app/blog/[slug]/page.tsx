"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, Calendar } from "lucide-react";
import { useEffect } from "react";
import { PublicLayout } from "@/components/website-builder/public-layout";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  tags?: string[];
  coverImage?: string;
  publishedAt?: string;
  status: string;
};

function readTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

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

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => api.blogPost(slug),
    enabled: !!slug,
  });

  const post = data?.post as BlogPost | undefined;

  // If the post can't be found (or isn't published), bounce back to the listing.
  useEffect(() => {
    if (!slug) return;
    if (isError || (!isLoading && post && post.status !== "published")) {
      router.replace("/blog");
    }
  }, [slug, isError, isLoading, post, router]);

  if (isLoading || !post) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-10"
        >
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6 text-balance">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {readTime(post.content)} min read
            </span>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden aspect-video bg-muted">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 font-medium border-l-4 border-primary pl-5">
              {post.excerpt}
            </p>
          )}

          {/* Body */}
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-code:text-primary">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </motion.div>
      </article>
    </PublicLayout>
  );
}
