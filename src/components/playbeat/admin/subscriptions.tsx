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
import { CreditCard, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  past_due: "bg-orange-100 text-orange-700",
  trial: "bg-blue-100 text-blue-700",
};

export function SubscriptionsModule() {
  const qc = useQueryClient();
  const [status, setStatus] = React.useState("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState({
    customerName: "",
    customerEmail: "",
    plan: "Basic",
    price: "",
    billingCycle: "monthly" as "monthly" | "yearly",
    status: "active" as string,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", status],
    queryFn: () =>
      api.adminSubscriptionsList({
        status: status === "all" ? undefined : status,
      }),
    staleTime: 30_000,
  });
  const subscriptions = data?.items || [];

  const handleCreate = async () => {
    if (!form.customerName || !form.customerEmail) {
      toast.error("Customer info required");
      return;
    }
    const now = new Date();
    const next = new Date(now);
    if (form.billingCycle === "monthly") next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);
    try {
      await api.adminSubscriptionCreate({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        plan: form.plan,
        price: Number(form.price),
        billingCycle: form.billingCycle,
        status: form.status,
        startDate: now.toISOString(),
        nextBillingDate: next.toISOString(),
      });
      toast.success("Subscription created");
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    } catch {
      toast.error("Failed to create subscription");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.adminSubscriptionUpdate({ id, status: newStatus });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    } catch {
      toast.error("Failed to update subscription");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage recurring plans
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} />
          New Subscription
        </Button>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="trial">Trial</SelectItem>
          <SelectItem value="past_due">Past Due</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard
              size={40}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <p className="text-muted-foreground">No subscriptions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Plan
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Price
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Next Billing
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s: any) => (
                <tr
                  key={s._id ?? s.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.customerEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p>{s.plan}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {s.billingCycle}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ${Number(s.price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[s.status] ?? ""}`}
                    >
                      {s.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs hidden lg:table-cell">
                    {s.nextBillingDate
                      ? new Date(s.nextBillingDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Select
                      onValueChange={async (v) => {
                        await handleUpdateStatus(s._id ?? s.id, v);
                      }}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activate</SelectItem>
                        <SelectItem value="cancelled">Cancel</SelectItem>
                        <SelectItem value="past_due">Mark Past Due</SelectItem>
                        <SelectItem value="trial">Set Trial</SelectItem>
                      </SelectContent>
                    </Select>
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
            <DialogTitle>New Subscription</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan</Label>
                <Input
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  placeholder="Basic"
                />
              </div>
              <div>
                <Label>Price/cycle ($)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="9.99"
                />
              </div>
            </div>
            <div>
              <Label>Billing Cycle</Label>
              <Select
                value={form.billingCycle}
                onValueChange={(v) =>
                  setForm({ ...form, billingCycle: v as "monthly" | "yearly" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
