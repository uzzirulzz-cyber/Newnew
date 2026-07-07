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
  Search,
  ShoppingCart,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  DollarSign,
  Loader2,
} from "lucide-react";
import { api, formatPrice } from "@/lib/api-client";
import { toast } from "sonner";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "COMPLETED",
  "REFUNDED",
  "CANCELLED",
] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400",
  PAID: "bg-blue-500/15 text-blue-400",
  COMPLETED: "bg-green-500/15 text-green-400",
  REFUNDED: "bg-red-500/15 text-red-400",
  CANCELLED: "bg-gray-500/15 text-gray-400",
};

const paymentColors: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400",
  COMPLETED: "bg-green-500/15 text-green-400",
  FAILED: "bg-red-500/15 text-red-400",
  REFUNDED: "bg-gray-500/15 text-gray-400",
};

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof ShoppingCart;
  label: string;
  value: string;
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

export function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | OrderStatus>("all");
  const [viewOrder, setViewOrder] = React.useState<any | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState({
    customerName: "",
    customerEmail: "",
    total: "",
    status: "PENDING" as OrderStatus,
    paymentStatus: "PENDING" as string,
    paymentMethod: "",
    shippingAddress: "",
  });

  // Filtered list (table data)
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders-list", status, search],
    queryFn: () =>
      api.adminOrders({
        search: search || undefined,
        status: status === "all" ? undefined : status,
        limit: 1000,
      }),
    staleTime: 30_000,
  });
  const orders = data?.items || [];

  // Compute stats from the (filtered) list. When no filter is applied, this
  // gives platform-wide totals.
  const stats = React.useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o: any) => o.status === "PENDING").length;
    const completed = orders.filter((o: any) => o.status === "COMPLETED").length;
    const revenue = orders
      .filter((o: any) => o.status === "COMPLETED")
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    return { total, pending, completed, revenue };
  }, [orders]);

  const handleCreate = async () => {
    if (!form.customerName || !form.customerEmail) {
      toast.error("Customer info required");
      return;
    }
    try {
      toast.success("Order created");
      setShowCreate(false);
      setForm({
        customerName: "",
        customerEmail: "",
        total: "",
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "",
        shippingAddress: "",
      });
      qc.invalidateQueries({ queryKey: ["admin-orders-list"] });
    } catch {
      toast.error("Failed to create order");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    setUpdatingId(id);
    try {
      await api.adminOrderUpdateStatus(id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      qc.invalidateQueries({ queryKey: ["admin-orders-list"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage customer orders
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} />
          New Order
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={String(stats.total)}
          accent="#3b82f6"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={String(stats.pending)}
          accent="#f59e0b"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={String(stats.completed)}
          accent="#10b981"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue (Completed)"
          value={formatPrice(stats.revenue)}
          accent="#8b5cf6"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search orders..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as "all" | OrderStatus)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart
              size={40}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <p className="text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Order
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Customer
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Total
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Payment
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Update Status
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => {
                const oid = o._id ?? o.id;
                return (
                  <tr
                    key={oid}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                      {o.orderNumber ?? oid}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.customerEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatPrice(Number(o.total ?? 0), "PKR")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] ?? "bg-gray-500/15 text-gray-400"}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {o.paymentStatus ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentColors[o.paymentStatus] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {o.paymentStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setViewOrder(o)}
                        >
                          <Eye size={13} />
                        </Button>
                        <Select
                          value={o.status}
                          disabled={updatingId === oid}
                          onValueChange={async (v) => {
                            await handleUpdateStatus(oid, v as OrderStatus);
                          }}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue placeholder="Update">
                              {updatingId === oid ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="size-3 animate-spin" />
                                  Updating…
                                </span>
                              ) : (
                                o.status
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
        open={!!viewOrder}
        onOpenChange={(o) => !o && setViewOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {viewOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{viewOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{viewOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold">
                    {formatPrice(Number(viewOrder.total ?? 0), "PKR")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentColors[viewOrder.paymentStatus] ?? ""}`}
                  >
                    {viewOrder.paymentStatus ?? "—"}
                  </span>
                </div>
              </div>
              {viewOrder.items && viewOrder.items.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Items</p>
                  <ul className="space-y-1">
                    {viewOrder.items.map((it: any, i: number) => (
                      <li
                        key={i}
                        className="flex justify-between rounded bg-muted/40 px-2 py-1 text-xs"
                      >
                        <span>{it.title}</span>
                        <span className="font-medium">
                          {formatPrice(Number(it.price ?? 0), "PKR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label>Customer Email *</Label>
              <Input
                value={form.customerEmail}
                onChange={(e) =>
                  setForm({ ...form, customerEmail: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Total (PKR)</Label>
              <Input
                type="number"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Input
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
                placeholder="Credit Card"
              />
            </div>
            <div>
              <Label>Shipping Address</Label>
              <Input
                value={form.shippingAddress}
                onChange={(e) =>
                  setForm({ ...form, shippingAddress: e.target.value })
                }
                placeholder="123 Main St..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
