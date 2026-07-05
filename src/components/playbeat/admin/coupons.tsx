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
import { Tag, Plus, Copy } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  expired: "bg-red-100 text-red-600",
};

export function CouponsModule() {
  const qc = useQueryClient();
  const [status, setStatus] = React.useState("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    minOrderAmount: "",
    maxUses: "",
    expiresAt: "",
    appliesTo: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.couponsList(),
    staleTime: 30_000,
  });
  const coupons = (data?.items || []).filter(
    (c: any) => status === "all" || c.status === status,
  );

  const handleCreate = async () => {
    if (!form.code || !form.value) {
      toast.error("Code and value required");
      return;
    }
    try {
      await api.couponCreate({
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount
          ? Number(form.minOrderAmount)
          : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
        appliesTo: form.appliesTo || undefined,
      });
      toast.success("Coupon created");
      setShowCreate(false);
      setForm({
        code: "",
        type: "percentage",
        value: "",
        minOrderAmount: "",
        maxUses: "",
        expiresAt: "",
        appliesTo: "",
      });
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch {
      toast.error("Failed to create coupon");
    }
  };

  const handleToggle = async (c: any) => {
    try {
      await api.couponUpdate({
        id: c._id ?? c.id,
        status: c.status === "active" ? "inactive" : "active",
      });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage discount codes
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} />
          Create Coupon
        </Button>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No coupons found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Code
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Discount
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Used
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
              {coupons.map((c: any) => (
                <tr
                  key={c._id ?? c.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        {c.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          toast.success("Copied!");
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.type === "percentage"
                      ? `${c.value}%`
                      : `$${c.value}`}{" "}
                    off
                    {c.minOrderAmount ? ` (min $${c.minOrderAmount})` : ""}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {c.usedCount ?? 0}
                    {c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[c.status] ?? ""}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleToggle(c)}
                    >
                      {c.status === "active" ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="SAVE20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as "percentage" | "fixed" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value *</Label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) =>
                    setForm({ ...form, value: e.target.value })
                  }
                  placeholder="20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Order ($)</Label>
                <Input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) =>
                    setForm({ ...form, minOrderAmount: e.target.value })
                  }
                  placeholder="50"
                />
              </div>
              <div>
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) =>
                    setForm({ ...form, maxUses: e.target.value })
                  }
                  placeholder="100"
                />
              </div>
            </div>
            <div>
              <Label>Expires At</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
