"use client";

import * as React from "react";
import {
  Layout,
  Plus,
  Eye,
  Pencil,
  Copy,
  Trash2,
  FileCode,
  Save,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatPill,
  StatusBadge,
  notifyMock,
  notifyComingSoon,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PAGES = [
  { id: "home", name: "Homepage", path: "/", sections: 12, status: "published", updated: "2 hours ago", views: 48210 },
  { id: "marketplace", name: "Marketplace", path: "/marketplace", sections: 6, status: "published", updated: "1 day ago", views: 18420 },
  { id: "blog", name: "Blog", path: "/blog", sections: 4, status: "published", updated: "3 days ago", views: 4280 },
  { id: "faq", name: "FAQ", path: "/faq", sections: 8, status: "published", updated: "1 week ago", views: 1840 },
  { id: "contact", name: "Contact", path: "/contact", sections: 3, status: "published", updated: "2 weeks ago", views: 820 },
  { id: "privacy", name: "Privacy Policy", path: "/privacy", sections: 10, status: "published", updated: "1 month ago", views: 412 },
  { id: "terms", name: "Terms of Service", path: "/terms", sections: 11, status: "published", updated: "1 month ago", views: 318 },
  { id: "refund", name: "Refund Policy", path: "/refund-policy", sections: 8, status: "published", updated: "1 month ago", views: 224 },
  { id: "landing-summer", name: "Summer Campaign", path: "/summer-sale", sections: 5, status: "draft", updated: "5 hours ago", views: 0 },
];

const CMS_SECTIONS = [
  { id: "s1", name: "Hero Banner", type: "hero", visible: true },
  { id: "s2", name: "Featured Products", type: "grid", visible: true },
  { id: "s3", name: "Categories Strip", type: "strip", visible: true },
  { id: "s4", name: "Testimonials", type: "carousel", visible: true },
  { id: "s5", name: "Brand Strip", type: "logos", visible: true },
  { id: "s6", name: "Newsletter Signup", type: "form", visible: false },
  { id: "s7", name: "Footer CTA", type: "cta", visible: true },
];

export function WebsiteBuilderModule() {
  const [activePage, setActivePage] = React.useState("home");
  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [sections, setSections] = React.useState(CMS_SECTIONS);

  const toggleSection = (id: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
    notifyMock("Section visibility updated");
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Website Builder"
        description="Manage CMS pages, sections, and content"
        icon={Layout}
        actions={
          <>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Opening live preview")}>
              <Eye className="size-4" /> Preview
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("New page wizard")}>
              <Plus className="size-4" /> New Page
            </Button>
          </>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Total Pages" value="9" accent="blue" />
        <StatPill label="Published" value="8" accent="green" />
        <StatPill label="Drafts" value="1" accent="amber" />
        <StatPill label="Page Views (30d)" value="78,720" accent="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Page list */}
        <AdminCard className="lg:col-span-1">
          <AdminCardHeader title="Pages" icon={FileCode} />
          <div className="p-3 space-y-1 max-h-[520px] overflow-y-auto pb-scrollbar">
            {PAGES.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePage(p.id)}
                className={cn(
                  "w-full text-left rounded-lg p-3 border transition-colors",
                  activePage === p.id
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500/40 text-white"
                    : "border-transparent text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-1 text-xs text-white/40 flex items-center gap-2">
                  <span className="font-mono">{p.path}</span>
                  <span>·</span>
                  <span>{p.sections} sections</span>
                </div>
              </button>
            ))}
          </div>
        </AdminCard>

        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <AdminCard>
            <AdminCardHeader
              title={PAGES.find((p) => p.id === activePage)?.name || "Page"}
              icon={Layout}
              description={PAGES.find((p) => p.id === activePage)?.path || "/"}
              action={
                <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={cn(
                      "p-1.5 rounded-md",
                      previewDevice === "desktop" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white",
                    )}
                  >
                    <Monitor className="size-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={cn(
                      "p-1.5 rounded-md",
                      previewDevice === "mobile" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white",
                    )}
                  >
                    <Smartphone className="size-4" />
                  </button>
                </div>
              }
            />
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Page Title</Label>
                <Input
                  defaultValue={PAGES.find((p) => p.id === activePage)?.name || ""}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Meta Description</Label>
                <Textarea
                  defaultValue="Premium digital products marketplace — streaming, AI tools, games, and more."
                  rows={2}
                  className="bg-white/5 border-white/10 text-white resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("Page saved")}>
                  <Save className="size-3.5" /> Save Changes
                </Button>
                <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Page duplicated")}>
                  <Copy className="size-3.5" /> Duplicate
                </Button>
                <Button size="sm" variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" onClick={() => notifyMock("Page deleted")}>
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </div>
          </AdminCard>

          {/* Sections */}
          <AdminCard>
            <AdminCardHeader
              title="Page Sections"
              icon={Layout}
              description="Drag to reorder · toggle to show/hide"
              action={
                <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("Section picker")}>
                  <Plus className="size-3.5" /> Add Section
                </Button>
              }
            />
            <div className="p-4 space-y-2">
              {sections.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <span className="grid size-7 place-items-center rounded-md bg-white/10 text-xs text-white/60 font-mono">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{s.name}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wide">{s.type}</div>
                  </div>
                  <button
                    onClick={() => toggleSection(s.id)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      s.visible ? "bg-emerald-500" : "bg-white/15",
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                      s.visible && "translate-x-5",
                    )} />
                  </button>
                  <Button variant="ghost" size="icon" className="size-7 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => notifyMock("Editing section")}>
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
