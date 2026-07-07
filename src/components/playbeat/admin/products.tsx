"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  CheckCircle2,
  Loader2,
  Clock,
  FileEdit,
  Layers,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Upload,
  Star,
} from "lucide-react";
import { api, formatPrice } from "@/lib/api-client";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Published",
  PENDING: "Pending",
  DRAFT: "Draft",
};

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-500/15 text-green-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  DRAFT: "bg-gray-500/15 text-gray-400",
};

const PRODUCT_TYPES: Array<{ value: string; label: string }> = [
  { value: "AI_TOOL", label: "AI Tool" },
  { value: "SOFTWARE_LICENSE", label: "Software License" },
  { value: "SAAS_SUBSCRIPTION", label: "SaaS Subscription" },
  { value: "DIGITAL_DOWNLOAD", label: "Digital Download" },
  { value: "EBOOK", label: "E-Book" },
  { value: "TEMPLATE", label: "Template" },
  { value: "GRAPHICS", label: "Graphics" },
  { value: "COURSE", label: "Course" },
  { value: "MEMBERSHIP", label: "Membership" },
];

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Package;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div
          className="grid size-10 place-items-center rounded-xl"
          style={{ backgroundColor: `${accent}1a` }}
        >
          <Icon className="size-5" style={{ color: accent }} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // ===== Form state (rich ProductDialog) =====
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState("DIGITAL_DOWNLOAD");
  const [categorySlug, setCategorySlug] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [discountPrice, setDiscountPrice] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");
  const [variants, setVariants] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [version, setVersion] = React.useState("");
  const [licenseType, setLicenseType] = React.useState("");
  const [featured, setFeatured] = React.useState(false);
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");

  // ===== Data queries =====
  // Filtered list (table data)
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products-list", status, search],
    queryFn: () =>
      api.adminProducts({
        status: status === "all" ? undefined : status,
        search: search || undefined,
      }),
    staleTime: 30_000,
  });
  const products = data?.items || [];

  // Unfiltered list (for stats cards)
  const { data: allData } = useQuery({
    queryKey: ["admin-products-all"],
    queryFn: () => api.adminProducts({}),
    staleTime: 30_000,
  });
  const allProducts = allData?.items || [];

  // Categories dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories-for-products"],
    queryFn: () => api.categories(),
    staleTime: 60_000,
  });
  const categories = categoriesData?.items || [];

  const stats = {
    total: allProducts.length,
    published: allProducts.filter((p: any) => p.status === "PUBLISHED").length,
    pending: allProducts.filter((p: any) => p.status === "PENDING").length,
    draft: allProducts.filter((p: any) => p.status === "DRAFT").length,
  };

  const resetForm = () => {
    setTitle("");
    setType("DIGITAL_DOWNLOAD");
    setCategorySlug("");
    setPrice("");
    setDiscountPrice("");
    setShortDescription("");
    setDescription("");
    setCoverUrl("");
    setVariants("");
    setTags("");
    setSku("");
    setStock("");
    setVersion("");
    setLicenseType("");
    setFeatured(false);
    setSeoTitle("");
    setSeoDescription("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.adminProductImageUpload(file);
      setCoverUrl(result.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset the input value so the same file can be re-selected
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price) {
      toast.error("Title and price are required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        type,
        price: Number(price),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        categorySlug: categorySlug || undefined,
        sku: sku.trim() || undefined,
        stock: Number(stock) || 0,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        version: version.trim(),
        licenseType: licenseType.trim(),
        featured,
        cover: coverUrl || undefined,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
      };
      if (discountPrice) payload.discountPrice = Number(discountPrice);
      if (variants.trim()) {
        payload.variants = JSON.stringify(
          variants
            .split("|")
            .map((v) => v.trim())
            .filter(Boolean),
        );
      }
      if (editId) {
        payload.id = editId;
        await api.adminProductUpdate(payload);
        toast.success("Product updated");
        setEditId(null);
      } else {
        await api.adminProductCreate(payload);
        toast.success("Product created");
      }
      resetForm();
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ["admin-products-list"] });
      qc.invalidateQueries({ queryKey: ["admin-products-all"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save product",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: any) => {
    // Cover can be a plain URL string, a JSON object string, or already
    // parsed into an object by the serializer.
    const rawCover = p.cover;
    let coverStr = "";
    if (typeof rawCover === "string") {
      if (rawCover.startsWith("{")) {
        try {
          coverStr = (JSON.parse(rawCover) as any)?.image || "";
        } catch {
          coverStr = "";
        }
      } else {
        coverStr = rawCover;
      }
    } else if (rawCover && typeof rawCover === "object") {
      coverStr = (rawCover as any)?.image || "";
    }
    // Fall back to imageUrl if no cover image was extracted
    if (!coverStr && typeof p.imageUrl === "string") coverStr = p.imageUrl;
    setCoverUrl(coverStr);

    // Variants — stored as JSON string in DB, parsed to array by admin GET
    let v: string[] = [];
    try {
      const raw = p.variants;
      if (raw) v = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      v = [];
    }
    setVariants(Array.isArray(v) ? v.join(" | ") : "");

    setTitle(p.title ?? p.name ?? "");
    setType(
      PRODUCT_TYPES.some((t) => t.value === p.type)
        ? p.type
        : "DIGITAL_DOWNLOAD",
    );
    setCategorySlug(p.category?.slug ?? "");
    setPrice(String(p.price ?? p.effectivePrice ?? ""));
    setDiscountPrice(
      p.discountPrice !== null && p.discountPrice !== undefined
        ? String(p.discountPrice)
        : "",
    );
    setShortDescription(p.shortDescription ?? "");
    setDescription(p.description ?? "");
    setTags(Array.isArray(p.tags) ? p.tags.join(", ") : "");
    setSku(p.sku ?? "");
    setStock(String(p.stock ?? 0));
    setVersion(p.version ?? "");
    setLicenseType(p.licenseType ?? "");
    setFeatured(Boolean(p.featured));
    setSeoTitle(p.seoTitle ?? "");
    setSeoDescription(p.seoDescription ?? "");
    setEditId(p._id ?? p.id);
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.adminProductDelete(id);
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products-list"] });
      qc.invalidateQueries({ queryKey: ["admin-products-all"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product",
      );
    }
  };

  const handleApprove = async (id: string, title: string) => {
    setApprovingId(id);
    try {
      await api.adminProductUpdate({ id, status: "PUBLISHED" });
      toast.success(`"${title}" approved & published`);
      qc.invalidateQueries({ queryKey: ["admin-products-list"] });
      qc.invalidateQueries({ queryKey: ["admin-products-all"] });
      qc.invalidateQueries({ queryKey: ["admin-products-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve product");
    } finally {
      setApprovingId(null);
    }
  };

  const openCreate = () => {
    resetForm();
    setEditId(null);
    setShowCreate(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Total Products"
          value={stats.total}
          accent="#3b82f6"
        />
        <StatCard
          icon={CheckCircle2}
          label="Published"
          value={stats.published}
          accent="#10b981"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          accent="#f59e0b"
        />
        <StatCard
          icon={FileEdit}
          label="Draft"
          value={stats.draft}
          accent="#6b7280"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package
              size={40}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <p className="text-muted-foreground">No products found</p>
            <Button className="mt-4" onClick={openCreate}>
              Add your first product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Product
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Category
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Price
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Stock
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
              {products.map((p: any) => {
                const imgUrl =
                  typeof p.cover === "string"
                    ? p.cover
                    : p.cover?.image ?? p.imageUrl;
                const title = p.title ?? p.name ?? "Untitled";
                const category = p.category?.name ?? p.category;
                const pid = p._id ?? p.id;
                const isPending = p.status === "PENDING";
                return (
                  <tr
                    key={pid}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={title}
                            className="w-9 h-9 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                            <Package
                              size={14}
                              className="text-muted-foreground"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <div>
                            <p className="font-medium flex items-center gap-1.5">
                              {title}
                              {p.featured && (
                                <Star
                                  size={12}
                                  className="fill-amber-400 text-amber-400"
                                />
                              )}
                            </p>
                            {p.sku && (
                              <p className="text-xs text-muted-foreground">
                                SKU: {p.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {p.discountPrice &&
                      Number(p.discountPrice) < Number(p.price ?? 0) ? (
                        <span className="inline-flex flex-col items-end leading-tight">
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(Number(p.price ?? 0))}
                          </span>
                          <span>
                            {formatPrice(Number(p.discountPrice))}
                          </span>
                        </span>
                      ) : (
                        formatPrice(
                          Number(p.price ?? p.effectivePrice ?? 0),
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {p.stock ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] ?? "bg-gray-500/15 text-gray-400"}`}
                      >
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPending && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 border-green-500/20 bg-green-500/10 text-xs text-green-400 hover:bg-green-500/20"
                            disabled={approvingId === pid}
                            onClick={() => handleApprove(pid, title)}
                          >
                            {approvingId === pid ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3" />
                            )}
                            Approve & Publish
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(p)}
                        >
                          <Edit size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(pid)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Full-featured Product Dialog ===== */}
      <Dialog
        open={showCreate}
        onOpenChange={(o) => {
          setShowCreate(o);
          if (!o) {
            resetForm();
            setEditId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product title"
              />
            </div>

            {/* Type + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Product Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={categorySlug}
                  onValueChange={setCategorySlug}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No categories
                      </SelectItem>
                    ) : (
                      categories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price + Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>
                  Price (PKR) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Discount Price / Offer</Label>
                <div className="relative">
                  <Tag
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Optional"
                    className="pl-9"
                  />
                </div>
                {discountPrice &&
                  price &&
                  Number(discountPrice) < Number(price) && (
                    <p className="text-xs text-amber-400 mt-1">
                      Shows strikethrough on{" "}
                      {formatPrice(Number(price))} →{" "}
                      {formatPrice(Number(discountPrice))}
                    </p>
                  )}
              </div>
            </div>

            {/* Short description */}
            <div>
              <Label>Short Description</Label>
              <Input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One-line summary"
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {shortDescription.length}/150
              </p>
            </div>

            {/* Full description */}
            <div>
              <Label>Full Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product description..."
                rows={4}
              />
            </div>

            {/* Cover image */}
            <div>
              <Label>Product Picture / Cover Image</Label>
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-lg border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://... or upload below"
                  />
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 cursor-pointer"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        {uploading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Upload className="size-3.5" />
                        )}
                        {uploading ? "Uploading..." : "Upload Image"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div>
              <Label>Variants</Label>
              <Input
                value={variants}
                onChange={(e) => setVariants(e.target.value)}
                placeholder="1 Month | 3 Months | 1 Year"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pipe-separated list. Saved as JSON array.
              </p>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai, marketing, premium"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated.
              </p>
            </div>

            {/* SKU + Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Auto-generated if blank"
                />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Version + License */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Version</Label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                />
              </div>
              <div>
                <Label>License Type</Label>
                <Input
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  placeholder="Lifetime, 1 Month, 1 Year"
                />
              </div>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Featured Product</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Show on homepage and category highlights.
                </p>
              </div>
              <Switch
                checked={featured}
                onCheckedChange={setFeatured}
                aria-label="Toggle featured"
              />
            </div>

            {/* SEO */}
            <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  SEO
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Optional — for search engines
                </span>
              </div>
              <div>
                <Label>SEO Title</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Override <title> tag"
                />
              </div>
              <div>
                <Label>SEO Description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCreate(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || uploading}>
              {saving && <Loader2 className="size-4 animate-spin mr-1" />}
              {editId ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
