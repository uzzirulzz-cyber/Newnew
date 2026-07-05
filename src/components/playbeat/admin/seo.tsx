"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, CheckCircle, XCircle, Save } from "lucide-react";
import { toast } from "sonner";

const pages = [
  {
    path: "/",
    title: "Home",
    metaTitle: "Enterprise CMS - Powerful Platform",
    metaDesc: "Manage your business with our enterprise platform",
    score: 92,
    indexed: true,
  },
  {
    path: "/products",
    title: "Products",
    metaTitle: "Our Products - Enterprise CMS",
    metaDesc: "Browse our complete product catalog",
    score: 78,
    indexed: true,
  },
  {
    path: "/blog",
    title: "Blog",
    metaTitle: "Blog - Enterprise CMS",
    metaDesc: "Latest news and updates from our team",
    score: 65,
    indexed: true,
  },
  {
    path: "/contact",
    title: "Contact",
    metaTitle: "Contact Us - Enterprise CMS",
    metaDesc: "Get in touch with our support team",
    score: 84,
    indexed: false,
  },
];

export function SeoModule() {
  const [selected, setSelected] = React.useState(pages[0]);
  const [metaTitle, setMetaTitle] = React.useState(pages[0].metaTitle);
  const [metaDesc, setMetaDesc] = React.useState(pages[0].metaDesc);

  const handleSelect = (p: (typeof pages)[0]) => {
    setSelected(p);
    setMetaTitle(p.metaTitle);
    setMetaDesc(p.metaDesc);
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-600" : s >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SEO</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Optimize your pages for search engines
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Indexed Pages", value: "76" },
          { label: "Avg SEO Score", value: "80" },
          { label: "Keywords Ranking", value: "124" },
          { label: "Backlinks", value: "3,420" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {pages.map((p) => (
              <button
                key={p.path}
                onClick={() => handleSelect(p)}
                className={`w-full text-left px-3 py-2.5 rounded-md transition-colors text-sm ${selected.path === p.path ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.title}</span>
                  <span
                    className={`text-xs font-bold ${selected.path === p.path ? "text-primary-foreground" : scoreColor(p.score)}`}
                  >
                    {p.score}
                  </span>
                </div>
                <p
                  className={`text-xs ${selected.path === p.path ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {p.path}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Edit SEO: {selected.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {selected.indexed ? (
                <CheckCircle size={14} className="text-green-500" />
              ) : (
                <XCircle size={14} className="text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {selected.indexed
                  ? "Indexed by search engines"
                  : "Not indexed"}
              </span>
            </div>
            <div>
              <Label>Meta Title</Label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {metaTitle.length}/60 characters
              </p>
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {metaDesc.length}/160 characters
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">
                Google Preview
              </p>
              <p className="text-sm text-blue-600 font-medium">{metaTitle}</p>
              <p className="text-xs text-green-700">example.com{selected.path}</p>
              <p className="text-xs text-muted-foreground">{metaDesc}</p>
            </div>
            <Button
              onClick={() => toast.success("SEO settings saved")}
              className="gap-2"
            >
              <Save size={14} />
              Save SEO Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
