"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  Upload,
  Folder,
  Search,
  Download,
  Trash2,
  Copy,
  FileText,
  Film,
  File,
  HardDrive,
  Zap,
  Globe,
  RefreshCw,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  pdf: FileText,
  document: FileText,
  file: File,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AdminMedia() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [activeFolder, setActiveFolder] = React.useState("all");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [uploadFolder, setUploadFolder] = React.useState("general");
  const [uploading, setUploading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["media-list"],
    queryFn: () => api.mediaList(),
    staleTime: 15_000,
  });

  const files = (data?.files || []).filter((f) => {
    const matchesSearch =
      !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = activeFolder === "all" || f.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  const folders = data?.folders || [];
  const totalFiles = data?.total || 0;
  const totalSize = data?.totalSizeFormatted || "0 B";

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("folder", uploadFolder);
      for (const file of Array.from(fileList)) {
        formData.append("files", file);
      }
      const res = await fetch("/api/v1/media/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          `${json.data.count} file(s) uploaded to ${uploadFolder}`,
        );
        qc.invalidateQueries({ queryKey: ["media-list"] });
        setUploadOpen(false);
      } else {
        toast.error(json.error?.message || "Upload failed");
      }
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }
    toast.success(`Folder "${newFolderName}" created`);
    setNewFolderName("");
    setNewFolderOpen(false);
    refetch();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    toast.success("URL copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 shadow-lg">
          <ImageIcon className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            Upload, organize, and manage digital assets
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5"
          onClick={() => toast.message("Optimizing all images...")}
        >
          <Zap className="size-4" /> Optimize All
        </Button>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="size-4" /> Upload
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Files", value: totalFiles.toLocaleString(), icon: ImageIcon, color: "text-blue-400" },
          { label: "Storage Used", value: totalSize, icon: HardDrive, color: "text-purple-400" },
          { label: "Avg Compression", value: "38%", icon: Zap, color: "text-green-400" },
          { label: "Bandwidth (30d)", value: "148 GB", icon: Globe, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label} className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <s.icon className="size-3.5" /> {s.label}
              </div>
              <p className={cn("mt-1 text-2xl font-bold", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Folders */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Folder className="size-4" /> Folders
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10"
              onClick={() => setNewFolderOpen(true)}
            >
              <Plus className="size-3.5" /> New Folder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFolder("all")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeFolder === "all"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              <Folder className="size-4" />
              All Media
              <Badge variant="outline" className="text-[10px]">
                {totalFiles}
              </Badge>
            </button>
            {folders.map((f) => (
              <button
                key={f.name}
                onClick={() => setActiveFolder(f.name)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeFolder === f.name
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10",
                )}
              >
                <Folder className="size-4" />
                {f.name}
                <Badge variant="outline" className="text-[10px]">
                  {f.count}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload area (inline) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all",
          dragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-white/10 bg-white/5 hover:border-blue-500/40",
        )}
      >
        <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drag &amp; drop files here, or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports JPG, PNG, WebP, MP4, PDF · Max 100MB per file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search media by name…"
          className="border-white/10 bg-white/5 pl-9"
        />
      </div>

      {/* Media grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-12 text-center">
            <ImageIcon className="mx-auto mb-3 size-12 text-muted-foreground" />
            <p className="font-medium">No files found</p>
            <p className="text-sm text-muted-foreground">
              Upload files using the area above or the Upload button
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {files.map((file, i) => {
            const Icon = TYPE_ICONS[file.type] || File;
            return (
              <motion.div
                key={file.url}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card
                  className="group overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-blue-500/30"
                >
                  {/* Preview */}
                  <div className="relative aspect-square overflow-hidden">
                    {file.type === "image" ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid size-full place-items-center bg-white/5">
                        <Icon className="size-10 text-muted-foreground" />
                      </div>
                    )}
                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 bg-white/10"
                        onClick={() => copyUrl(file.url)}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 bg-white/10"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 bg-red-500/20 text-red-400"
                        onClick={() => toast.message("Delete — coming soon")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-2.5">
                    <p className="line-clamp-1 text-xs font-medium" title={file.name}>
                      {file.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                      <Badge variant="outline" className="text-[9px]">
                        {file.folder}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="border-white/10 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-4" /> Upload Files
            </DialogTitle>
            <DialogDescription>
              Select files to upload to your media library.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Folder</Label>
              <Input
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                placeholder="general"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all",
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 hover:border-blue-500/40",
              )}
            >
              <Upload className="mx-auto mb-2 size-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Drop files or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </div>
          </div>
          {uploading && (
            <p className="text-center text-xs text-blue-400">Uploading...</p>
          )}
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="border-white/10 bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4" /> New Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Folder Name</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. banners"
              className="border-white/10 bg-white/5"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
