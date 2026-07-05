"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Eye,
  FileText,
  Globe,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const localPosts = [
  {
    title: "Getting Started with Our Platform",
    status: "published",
    author: "Admin",
    date: "2026-07-01",
    views: 1240,
    type: "post",
  },
  {
    title: "New Feature: IPTV Dashboard",
    status: "published",
    author: "Marketing",
    date: "2026-06-28",
    views: 890,
    type: "post",
  },
  {
    title: "Terms of Service",
    status: "published",
    author: "Admin",
    date: "2026-06-20",
    views: 320,
    type: "page",
  },
  {
    title: "Privacy Policy",
    status: "published",
    author: "Admin",
    date: "2026-06-20",
    views: 280,
    type: "page",
  },
  {
    title: "Summer Promotion Tips",
    status: "draft",
    author: "Marketing",
    date: "2026-07-04",
    views: 0,
    type: "post",
  },
];

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-blue-100 text-blue-700",
};

export function AdminWordPress() {
  const [search, setSearch] = React.useState("");
  const { data: wpData } = useQuery({
    queryKey: ["wordpress-posts"],
    queryFn: () => api.wordpressPosts(),
    staleTime: 60_000,
  });

  const posts =
    wpData?.items?.map((p: any) => ({
      title: p.title?.rendered ?? "Untitled",
      status: p.status,
      author: "—",
      date: new Date(p.date).toISOString().split("T")[0],
      views: 0,
      type: "post",
    })) || localPosts;

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950 rounded-xl">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WordPress CMS</h1>
            <p className="text-muted-foreground text-sm">
              Manage posts, pages and content
            </p>
          </div>
        </div>
        <Button
          onClick={() => toast.info("Opening WordPress editor...")}
          className="gap-2"
        >
          <Plus size={16} />
          New Post
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Posts",
            value: "84",
            icon: <FileText size={16} className="text-blue-500" />,
          },
          {
            label: "Published",
            value: "76",
            icon: <Globe size={16} className="text-green-500" />,
          },
          {
            label: "Drafts",
            value: "8",
            icon: <FileText size={16} className="text-yellow-500" />,
          },
          {
            label: "Total Views",
            value: "42,100",
            icon: <Eye size={16} className="text-purple-500" />,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search posts and pages..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Title
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                Type
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                Author
              </th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                Views
              </th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.title + i}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground hidden md:table-cell">
                  {p.type}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {p.author}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  {p.views.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[p.status] ?? ""}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toast.info("Opening preview...")}
                    >
                      <Eye size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toast.info("Opening editor...")}
                    >
                      <Edit size={13} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
