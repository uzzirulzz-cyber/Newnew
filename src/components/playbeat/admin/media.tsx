"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Image as ImageIcon,
  Search,
  Trash2,
  Upload,
  FileText,
  Video,
  Music,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const typeIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon size={16} className="text-blue-500" />,
  video: <Video size={16} className="text-purple-500" />,
  document: <FileText size={16} className="text-orange-500" />,
  audio: <Music size={16} className="text-green-500" />,
};

export function AdminMedia() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("all");
  const [showUpload, setShowUpload] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    url: "",
    type: "image" as string,
    size: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-media", type, search],
    queryFn: () =>
      api.adminMediaList({
        search: search || undefined,
        type: type === "all" ? undefined : type,
      }),
    staleTime: 30_000,
  });
  const media = data?.items || [];

  const handleAdd = async () => {
    if (!form.name || !form.url) {
      toast.error("Name and URL required");
      return;
    }
    try {
      await api.adminMediaAdd({
        name: form.name,
        url: form.url,
        type: form.type,
        size: Number(form.size) || 0,
      });
      toast.success("Media added");
      setShowUpload(false);
      setForm({ name: "", url: "", type: "image", size: "" });
      qc.invalidateQueries({ queryKey: ["admin-media"] });
    } catch {
      toast.error("Failed to add media");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.adminMediaDelete(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-media"] });
    } catch {
      toast.error("Failed to delete media");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage images, videos, and documents
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Upload size={16} />
          Add Media
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search media..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon
              size={40}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <p className="text-muted-foreground">No media found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {media.map((m: any) => (
            <div
              key={m._id ?? m.id}
              className="group relative rounded-lg border bg-muted overflow-hidden aspect-square"
            >
              {m.type === "image" ? (
                <img
                  src={m.url}
                  alt={m.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  {typeIcons[m.type]}
                  <p className="text-xs text-muted-foreground text-center px-2 truncate w-full">
                    {m.name}
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => handleDelete(m._id ?? m.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{m.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="file-name.jpg"
              />
            </div>
            <div>
              <Label>URL *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
