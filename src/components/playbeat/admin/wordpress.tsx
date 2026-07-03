"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Plus,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function AdminWordPress() {
  const [search, setSearch] = React.useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wp-posts"],
    queryFn: () => api.wordpressPosts(),
    staleTime: 60_000,
  });

  const configured = data?.configured ?? false;
  const error = data?.error;
  const posts = (data?.items || []).filter(
    (p) =>
      !search ||
      p.title.rendered.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
          <FileText className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">WordPress CMS</h1>
          <p className="text-sm text-muted-foreground">
            Manage blog posts, pages, and content from your WordPress site
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5"
          onClick={() => {
            refetch();
            toast.success("Refreshing WordPress content...");
          }}
        >
          <RefreshCw className="size-4" /> Refresh
        </Button>
        <Button onClick={() => toast.message("Post editor — coming soon")}>
          <Plus className="size-4" /> New Post
        </Button>
      </div>

      {/* Not configured state */}
      {!configured && !isLoading && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="size-8 text-amber-400" />
            <div className="flex-1">
              <p className="font-semibold">WordPress is not connected</p>
              <p className="text-sm text-muted-foreground">
                Add this env var to your <code>.env</code> file to connect your
                WordPress site:
              </p>
              <pre className="mt-2 rounded-lg bg-black/40 p-3 text-[11px] text-muted-foreground">
{`WORDPRESS_API_URL=https://playbeat.live/wp-json/wp/v2
# Optional (for authenticated endpoints):
WORDPRESS_USERNAME=your_wp_username
WORDPRESS_APP_PASSWORD=your_app_password`}
              </pre>
              <p className="mt-2 text-xs text-muted-foreground">
                Generate an application password at: WordPress → Users → Profile → Application Passwords
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {configured && error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="size-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {configured && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="border-white/10 bg-white/5 pl-9"
          />
        </div>
      )}

      {/* Posts grid */}
      {configured && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))
          ) : posts.length === 0 ? (
            <Card className="col-span-full border-white/10 bg-white/5">
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto mb-3 size-12 text-muted-foreground" />
                <p className="font-medium">No posts found</p>
                <p className="text-sm text-muted-foreground">
                  Create posts in your WordPress dashboard
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card
                key={post.id}
                className="group border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-blue-500/30"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-semibold leading-snug">
                      {stripHtml(post.title.rendered) || "Untitled"}
                    </h3>
                    <Badge
                      className={
                        post.status === "publish"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-amber-500/15 text-amber-400"
                      }
                    >
                      {post.status}
                    </Badge>
                  </div>
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {stripHtml(post.excerpt.rendered) || "No excerpt available"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar className="size-3" />
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => window.open(post.link, "_blank")}
                    >
                      View <ExternalLink className="ml-1 size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
