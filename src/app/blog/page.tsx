"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock } from "lucide-react";
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => api.blogPosts(),
  });

  const posts: BlogPost[] = (data?.items ?? []) as BlogPost[];

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
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Blog</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Latest articles</h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Insights, updates, and stories from our team.
          </p>
        </motion.div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-6">
                <Skeleton className="w-48 h-32 rounded-xl flex-shrink-0 hidden sm:block" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-border rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1">No posts yet</h3>
            <p className="text-sm text-muted-foreground">Check back soon for new articles.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
              >
                <a
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col sm:flex-row gap-6 items-start"
                >
                  {/* Cover */}
                  {post.coverImage ? (
                    <div className="w-full sm:w-48 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="hidden sm:flex w-48 h-36 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 flex-shrink-0 items-center justify-center">
                      <FileText className="w-8 h-8 text-primary/40" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <h2 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {readTime(post.content)} min read
                      </span>
                    </div>
                  </div>
                </a>
                <div className="mt-8 h-px bg-border" />
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
