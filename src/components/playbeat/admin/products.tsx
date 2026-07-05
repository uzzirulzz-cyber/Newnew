"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Search,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Image as ImageIcon,
  Tag,
  DollarSign,
  X,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductCover } from "@/components/playbeat/product-cover";
import { api, displayProductPrice } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRODUCT_TYPES = [
  { value: "DIGITAL_DOWNLOAD", label: "Digital Download" },
  { value: "SAAS_SUBSCRIPTION", label: "SaaS Subscription" },
  { value: "GIFT_CARD", label: "Gift Card" },
  { value: "AI_TOOL", label: "AI Tool" },
  { value: "GAME", label: "Game" },
  { value: "TEMPLATE", label: "Template" },
  { value: "EBOOK", label: "eBook" },
  { value: "GRAPHIC", label: "Graphic" },
  { value: "COURSE", label: "Course" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "PAYMENT_GATEWAY", label: "Payment Gateway" },
  { value: "AFFILIATE_OFFER", label: "Affiliate Offer" },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PRODUCT_TYPES.map((t) => [t.value, t.label]),
);

export function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<any | null>(null);
  const [deleteProduct, setDeleteProduct] = React.useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: () => api.products({ search, limit: 48 }),
    staleTime: 30_000,
  });

  const products = (data?.items || []).filter((p) => {
    const matchesType = typeFilter === "ALL" || p.type === typeFilter;
    return matchesType;
  });

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      await api.adminProductDelete(deleteProduct.id);
      toast.success(`"${deleteProduct.title}" deleted`);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteProduct(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
          <Package className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Product Management</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} products — create, edit, set prices, upload pictures
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="border-white/10 bg-white/5 pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full border-white/10 bg-white/5 sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {PRODUCT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-12 text-center">
            <Package className="mx-auto mb-3 size-12 text-muted-foreground" />
            <p className="font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">
              Click "Create Product" to add your first product
            </p>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
              <Plus className="size-4" /> Create Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Card
              key={p.id}
              className="group border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-blue-500/30"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl">
                <ProductCover
                  cover={p.cover}
                  className="size-full rounded-none"
                  iconSize={40}
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <Badge className="bg-black/60 text-[9px] uppercase backdrop-blur">
                    {TYPE_LABELS[p.type] || p.type}
                  </Badge>
                  {p.discountPrice && (
                    <Badge className="bg-red-500/80 text-[9px] uppercase">
                      Sale
                    </Badge>
                  )}
                </div>
                {p.featured && (
                  <div className="absolute left-2 top-2">
                    <Badge className="bg-amber-500/80 text-[9px] uppercase">
                      ★ Featured
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 p-4">
                <p className="line-clamp-1 text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.vendor?.storeName || "Independent"}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-blue-400">
                      {p.priceFormatted || displayProductPrice(p)}
                    </span>
                    {p.discountPrice && (
                      <span className="text-[10px] text-muted-foreground line-through">
                        Rs {p.regularPrice || p.price}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => setEditProduct(p)}
                      title="Edit product"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteProduct(p)}
                      title="Delete product"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <ProductDialog
        open={createOpen || !!editProduct}
        product={editProduct}
        onClose={() => {
          setCreateOpen(false);
          setEditProduct(null);
        }}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-products"] });
          setCreateOpen(false);
          setEditProduct(null);
        }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteProduct} onOpenChange={(v) => !v && setDeleteProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteProduct?.title}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="size-4" />
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Product Create/Edit Dialog ──────────────────────────────────────────
function ProductDialog({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState("DIGITAL_DOWNLOAD");
  const [price, setPrice] = React.useState("");
  const [discountPrice, setDiscountPrice] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categorySlug, setCategorySlug] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [stock, setStock] = React.useState("0");
  const [tags, setTags] = React.useState("");
  const [version, setVersion] = React.useState("1.0.0");
  const [licenseType, setLicenseType] = React.useState("");
  const [featured, setFeatured] = React.useState(false);
  const [coverUrl, setCoverUrl] = React.useState("");
  const [imageUrls, setImageUrls] = React.useState("");
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Categories for the dropdown
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories(),
    staleTime: 5 * 60_000,
  });
  const categories = catData?.items || [];

  // Populate form when editing
  React.useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setType(product.type || "DIGITAL_DOWNLOAD");
      setPrice(String(product.regularPrice || product.price || ""));
      setDiscountPrice(product.discountPrice ? String(product.discountPrice) : "");
      setShortDescription(product.shortDescription || "");
      setDescription(product.description || "");
      setCategorySlug(product.category?.slug || "");
      setSku(product.sku || "");
      setStock(String(product.stock || 0));
      setTags(Array.isArray(product.tags) ? product.tags.join(", ") : "");
      setVersion(product.version || "1.0.0");
      setLicenseType(product.licenseType || "");
      setFeatured(product.featured || false);
      setCoverUrl(typeof product.cover === "string" && product.cover.startsWith("{") ? "" : (product.cover || ""));
      setImageUrls(Array.isArray(product.images) ? product.images.join("\n") : "");
      setSeoTitle(product.seoTitle || "");
      setSeoDescription(product.seoDescription || "");
    } else if (open) {
      // Reset for new product
      setTitle("");
      setType("DIGITAL_DOWNLOAD");
      setPrice("");
      setDiscountPrice("");
      setShortDescription("");
      setDescription("");
      setCategorySlug("");
      setSku("");
      setStock("0");
      setTags("");
      setVersion("1.0.0");
      setLicenseType("");
      setFeatured(false);
      setCoverUrl("");
      setImageUrls("");
      setSeoTitle("");
      setSeoDescription("");
    }
  }, [product, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to base64 for storage (in production, upload to S3/Cloudinary)
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCoverUrl(base64);
      toast.success("Image uploaded");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!price || Number(price) < 0) {
      toast.error("A valid price is required");
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
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        version: version.trim(),
        licenseType: licenseType.trim(),
        featured,
        cover: coverUrl || undefined,
        images: imageUrls.split("\n").map((u) => u.trim()).filter(Boolean),
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
      };
      if (discountPrice) payload.discountPrice = Number(discountPrice);

      if (isEdit) {
        payload.id = product.id;
        await api.adminProductUpdate(payload);
        toast.success(`"${title}" updated`);
      } else {
        await api.adminProductCreate(payload);
        toast.success(`"${title}" created`);
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Create New Product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update product details, price, and images."
              : "Fill in the details below to create a new product."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Product Title <span className="text-red-400">*</span></Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Netflix Premium 1 Month Subscription"
            />
          </div>

          {/* Type + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Product Type <span className="text-red-400">*</span></Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categorySlug} onValueChange={setCategorySlug}>
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price + Discount Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                <DollarSign className="mr-1 inline size-3" />
                Price (PKR) <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="299"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                <Tag className="mr-1 inline size-3" />
                Discount Price (optional)
              </Label>
              <Input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="199"
              />
              <p className="text-[10px] text-muted-foreground">
                Sale price — shows a strikethrough on the original price
              </p>
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-1.5">
            <Label>Short Description</Label>
            <Input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One-line summary shown on product cards"
              maxLength={150}
            />
          </div>

          {/* Full Description */}
          <div className="space-y-1.5">
            <Label>Full Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed product description..."
              rows={4}
            />
          </div>

          {/* Picture upload */}
          <div className="space-y-1.5">
            <Label>
              <ImageIcon className="mr-1 inline size-3" />
              Product Picture / Cover Image
            </Label>
            <div className="flex items-center gap-3">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={coverUrl.startsWith("data:") ? "" : coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Image URL (https://...) or upload below"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium ring-1 ring-white/10 transition-colors hover:bg-white/10">
                  <Upload className="size-3.5" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Upload a product image (PNG/JPG) or paste an image URL. If no image is set, a gradient cover is auto-generated.
            </p>
          </div>

          {/* Additional images (variants/gallery) */}
          <div className="space-y-1.5">
            <Label>Additional Images (one URL per line)</Label>
            <Textarea
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              rows={3}
            />
            <p className="text-[10px] text-muted-foreground">
              Gallery images shown on the product detail page. One URL per line.
            </p>
          </div>

          {/* SKU + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Auto-generated if blank"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Tags + Version */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="netflix, streaming, premium"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Version</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </div>
          </div>

          {/* License Type */}
          <div className="space-y-1.5">
            <Label>License Type</Label>
            <Input
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
              placeholder="e.g. Single User, Lifetime, 1 Month"
            />
          </div>

          {/* Featured toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
            <div>
              <Label className="cursor-pointer">Featured Product</Label>
              <p className="text-[10px] text-muted-foreground">
                Featured products appear in the hero section and "Browse by category"
              </p>
            </div>
            <Switch checked={featured} onCheckedChange={setFeatured} />
          </div>

          {/* SEO */}
          <div className="space-y-1.5">
            <Label>SEO Title (optional)</Label>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Custom title for search engines"
            />
          </div>
          <div className="space-y-1.5">
            <Label>SEO Description (optional)</Label>
            <Textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Meta description for search engines"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
