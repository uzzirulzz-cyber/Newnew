"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Package, Edit, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-500",
};

export function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    imageUrl: "",
    status: "active" as "active" | "draft" | "archived",
    sku: "",
  });

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

  const resetForm = () =>
    setForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      imageUrl: "",
      status: "active",
      sku: "",
    });

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    try {
      const payload = {
        title: form.name,
        type: "DIGITAL_DOWNLOAD",
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        categorySlug: form.category || undefined,
        sku: form.sku,
        status: form.status,
      };
      if (editId) {
        await api.adminProductUpdate({ id: editId, ...payload });
        toast.success("Product updated");
        setEditId(null);
      } else {
        await api.adminProductCreate(payload);
        toast.success("Product created");
      }
      resetForm();
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ["admin-products-list"] });
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.title ?? p.name ?? "",
      description: p.description ?? "",
      price: String(p.price ?? p.regularPrice ?? ""),
      stock: String(p.stock ?? 0),
      category: p.category?.slug ?? p.category ?? "",
      imageUrl:
        typeof p.cover === "string"
          ? p.cover
          : p.cover?.image ?? p.imageUrl ?? "",
      status: p.status === "DRAFT" ? "draft" : (p.status ?? "active").toLowerCase(),
      sku: p.sku ?? "",
    });
    setEditId(p._id ?? p.id);
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.adminProductDelete(id);
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products-list"] });
    } catch {
      toast.error("Failed to delete product");
    }
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
        <Button
          onClick={() => {
            resetForm();
            setEditId(null);
            setShowCreate(true);
          }}
          className="gap-2"
        >
          <Plus size={16} />
          Add Product
        </Button>
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
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
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
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
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
                return (
                  <tr
                    key={p._id ?? p.id}
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
                        <div>
                          <p className="font-medium">{title}</p>
                          {p.sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {p.sku}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${Number(p.price ?? p.effectivePrice ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {p.stock ?? "—"}
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
                        onClick={() => handleEdit(p)}
                      >
                        <Edit size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(p._id ?? p.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Product name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="Electronics"
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({ ...form, imageUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    status: v as "active" | "draft" | "archived",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editId ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
