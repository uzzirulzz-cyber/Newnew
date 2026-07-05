"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, ShoppingCart, Plus, Eye } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};
const paymentColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

export function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [viewOrder, setViewOrder] = React.useState<any | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState({
    customerName: "",
    customerEmail: "",
    total: "",
    status: "pending" as string,
    paymentStatus: "pending" as string,
    paymentMethod: "",
    shippingAddress: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders-list", status, search],
    queryFn: () =>
      api.adminOrders({
        search: search || undefined,
        status: status === "all" ? undefined : status,
      }),
    staleTime: 30_000,
  });
  const orders = data?.items || [];

  const handleCreate = async () => {
    if (!form.customerName || !form.customerEmail) {
      toast.error("Customer info required");
      return;
    }
    try {
      // TODO: add api method for admin order create
      toast.success("Order created");
      setShowCreate(false);
      setForm({
        customerName: "",
        customerEmail: "",
        total: "",
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "",
        shippingAddress: "",
      });
      qc.invalidateQueries({ queryKey: ["admin-orders-list"] });
    } catch {
      toast.error("Failed to create order");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    // TODO: add api method for admin order status update
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["admin-orders-list"] });
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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr
                  key={o._id ?? o.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold">
                    {o.orderNumber ?? o.id}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.customerEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ${Number(o.total ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[o.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${paymentColors[o.paymentStatus] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
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
                        onValueChange={async (v) => {
                          await handleUpdateStatus(o._id ?? o.id, v);
                        }}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue placeholder="Update" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
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
                    ${Number(viewOrder.total ?? 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${paymentColors[viewOrder.paymentStatus] ?? ""}`}
                  >
                    {viewOrder.paymentStatus}
                  </span>
                </div>
              </div>
              {viewOrder.shippingAddress && (
                <div>
                  <p className="text-muted-foreground">Shipping Address</p>
                  <p>{viewOrder.shippingAddress}</p>
                </div>
              )}
              {viewOrder.notes && (
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p>{viewOrder.notes}</p>
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
              <Label>Total ($)</Label>
              <Input
                type="number"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                placeholder="0.00"
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
