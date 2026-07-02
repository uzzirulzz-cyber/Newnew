"use client";

import * as React from "react";
import {
  Image as ImageIcon,
  Upload,
  Folder,
  Film,
  FileText,
  Layout as LayoutIcon,
  Trash2,
  Copy,
  Download,
  Wand2,
  Plus,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  SearchInput,
  StatPill,
  notifyMock,
  notifyComingSoon,
} from "./shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FOLDERS = [
  { name: "All Media", icon: Folder, count: 1248, active: true, color: "text-blue-300" },
  { name: "Images", icon: ImageIcon, count: 824, active: false, color: "text-emerald-300" },
  { name: "Videos", icon: Film, count: 42, active: false, color: "text-pink-300" },
  { name: "Documents", icon: FileText, count: 184, active: false, color: "text-amber-300" },
  { name: "Logos", icon: ImageIcon, count: 38, active: false, color: "text-cyan-300" },
  { name: "Banners", icon: LayoutIcon, count: 160, active: false, color: "text-purple-300" },
];

const MEDIA = [
  { name: "Netflix hero banner", type: "image", size: "1.2 MB", dim: "1920×600", folder: "Banners" },
  { name: "ChatGPT logo", type: "logo", size: "48 KB", dim: "256×256", folder: "Logos" },
  { name: "Apple TV key art", type: "image", size: "820 KB", dim: "800×1200", folder: "Images" },
  { name: "Promo reel 2026", type: "video", size: "42 MB", dim: "1080p · 1:24", folder: "Videos" },
  { name: "Refund policy PDF", type: "document", size: "184 KB", dim: "8 pages", folder: "Documents" },
  { name: "Disney+ premium cover", type: "image", size: "640 KB", dim: "800×1200", folder: "Images" },
  { name: "Brand mark — white", type: "logo", size: "24 KB", dim: "512×512", folder: "Logos" },
  { name: "IPTV channel grid banner", type: "image", size: "1.4 MB", dim: "2400×800", folder: "Banners" },
  { name: "Quick start guide", type: "document", size: "98 KB", dim: "4 pages", folder: "Documents" },
  { name: "Crunchyroll cover art", type: "image", size: "510 KB", dim: "800×1200", folder: "Images" },
  { name: "Midjourney showcase", type: "image", size: "920 KB", dim: "1600×900", folder: "Images" },
  { name: "Trailers compilation", type: "video", size: "82 MB", dim: "4K · 4:12", folder: "Videos" },
];

function MediaThumb({ item }: { item: typeof MEDIA[number] }) {
  const icon = item.type === "video" ? <Film className="size-6" /> :
               item.type === "document" ? <FileText className="size-6" /> :
               item.type === "logo" ? <ImageIcon className="size-6" /> :
               <ImageIcon className="size-6" />;
  const gradient = item.type === "video" ? "from-pink-600/40 to-rose-600/40" :
                   item.type === "document" ? "from-amber-600/40 to-yellow-600/40" :
                   item.type === "logo" ? "from-cyan-600/40 to-blue-600/40" :
                   "from-blue-600/40 to-purple-600/40";
  return (
    <div className={cn("grid place-items-center rounded-lg bg-gradient-to-br text-white/80", gradient)}>
      {icon}
    </div>
  );
}

export function MediaModule() {
  const [activeFolder, setActiveFolder] = React.useState("All Media");
  const [search, setSearch] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);

  const filtered = MEDIA.filter((m) => {
    if (activeFolder !== "All Media" && m.folder !== activeFolder) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Media Library"
        description="Upload, organize, and manage digital assets"
        icon={ImageIcon}
        actions={
          <>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Optimizing all media…")}>
              <Wand2 className="size-4" /> Optimize All
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Upload from URL")}>
              <Upload className="size-4" /> Upload
            </Button>
          </>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Total Files" value="1,248" accent="blue" />
        <StatPill label="Storage Used" value="4.2 GB" accent="purple" />
        <StatPill label="Avg Compression" value="38%" accent="green" />
        <StatPill label="Bandwidth (30d)" value="148 GB" accent="pink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Folders sidebar */}
        <AdminCard className="lg:col-span-1">
          <AdminCardHeader title="Folders" icon={Folder} />
          <div className="p-3 space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-2 border-dashed border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
              onClick={() => notifyComingSoon("Create folder")}
            >
              <Plus className="size-3.5" /> New Folder
            </Button>
            {FOLDERS.map((f) => (
              <button
                key={f.name}
                onClick={() => setActiveFolder(f.name)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  activeFolder === f.name
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-blue-500/40"
                    : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <f.icon className={cn("size-4", f.color)} />
                  {f.name}
                </span>
                <span className="text-xs text-white/50">{f.count}</span>
              </button>
            ))}
          </div>
        </AdminCard>

        {/* Media grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Upload area */}
          <AdminCard
            className={cn(
              "border-2 border-dashed transition-colors",
              dragOver ? "border-blue-500/50 bg-blue-500/5" : "border-white/15",
            )}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                notifyMock(`Uploaded ${e.dataTransfer.files?.length || 0} file(s)`);
              }}
              className="p-8 text-center"
            >
              <div className="grid size-12 mx-auto place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                <Upload className="size-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-white">
                Drag &amp; drop files here, or click to browse
              </p>
              <p className="mt-1 text-xs text-white/50">
                Supports JPG, PNG, WebP, MP4, PDF · Max 100MB per file
              </p>
              <Button size="sm" className="mt-4 bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("File picker")}>
                <Upload className="size-3.5" /> Choose Files
              </Button>
            </div>
          </AdminCard>

          {/* Search */}
          <AdminCard>
            <div className="p-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search media by name…"
                className="max-w-md"
              />
            </div>
          </AdminCard>

          {/* Grid */}
          <AdminCard>
            <AdminCardHeader
              title={activeFolder}
              icon={ImageIcon}
              description={`${filtered.length} files`}
            />
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((m, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-blue-500/30 transition-colors"
                >
                  <div className="aspect-square">
                    <MediaThumb item={m} />
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-medium text-white line-clamp-1">{m.name}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{m.dim} · {m.size}</div>
                    <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => notifyMock("File URL copied")} className="text-white/60 hover:text-white">
                        <Copy className="size-3.5" />
                      </button>
                      <button onClick={() => notifyMock("Downloading file")} className="text-white/60 hover:text-white">
                        <Download className="size-3.5" />
                      </button>
                      <button onClick={() => notifyMock("File deleted")} className="text-rose-300 hover:text-rose-200">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
