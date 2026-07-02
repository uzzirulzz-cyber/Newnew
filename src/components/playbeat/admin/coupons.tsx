"use client";

import * as React from "react";
import {
  Ticket,
  Plus,
  Copy,
  Trash2,
  Pencil,
  Percent,
  DollarSign,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  SearchInput,
  StatusBadge,
  EmptyState,
  notifyMock,
  notifyComingSoon,
  StatPill,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/api-client";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minPurchase: number;
  usage: number;
  maxUsage: number;
  expiry: string;
  active: boolean;
}

const INITIAL_COUPONS: Coupon[] = [
  { id: "c1", code: "PLAYBEAT20", type: "PERCENT", value: 20, minPurchase: 50, usage: 142, maxUsage: 500, expiry: "2026-12-31", active: true },
  { id: "c2", code: "WELCOME10", type: "PERCENT", value: 10, minPurchase: 0, usage: 842, maxUsage: 1000, expiry: "2026-09-30", active: true },
  { id: "c3", code: "FLAT15", type: "FLAT", value: 15, minPurchase: 80, usage: 56, maxUsage: 200, expiry: "2026-08-15", active: true },
  { id: "c4", code: "BLACKFRIDAY", type: "PERCENT", value: 50, minPurchase: 0, usage: 0, maxUsage: 1000, expiry: "2026-11-30", active: false },
  { id: "c5", code: "VIP50", type: "FLAT", value: 50, minPurchase: 200, usage: 28, maxUsage: 100, expiry: "2026-12-31", active: true },
  { id: "c6", code: "SUMMER24", type: "PERCENT", value: 24, minPurchase: 30, usage: 318, maxUsage: 500, expiry: "2026-09-01", active: true },
  { id: "c7", code: "EXPIRED24", type: "PERCENT", value: 15, minPurchase: 0, usage: 412, maxUsage: 500, expiry: "2024-12-31", active: false },
];

export function CouponsModule() {
  const [coupons, setCoupons] = React.useState(INITIAL_COUPONS);
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const filtered = coupons.filter((c) =>
    !search ? true : c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const copy = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => undefined);
    }
    toast.success(`Coupon ${code} copied`);
  };

  const toggleActive = (id: string) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
    notifyMock("Coupon status updated");
  };

  const remove = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    notifyMock("Coupon deleted");
  };

  const createCoupon = (c: Omit<Coupon, "id" | "usage">) => {
    setCoupons((prev) => [{ ...c, id: `c${Date.now()}`, usage: 0 }, ...prev]);
    setOpen(false);
    toast.success(`Coupon ${c.code} created`);
  };

  const activeCount = coupons.filter((c) => c.active).length;
  const totalRedemptions = coupons.reduce((s, c) => s + c.usage, 0);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Coupons"
        description="Create discount codes for your customers"
        icon={Ticket}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Create Coupon
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Total Coupons" value={coupons.length} accent="blue" />
        <StatPill label="Active" value={activeCount} accent="green" />
        <StatPill label="Redemptions" value={totalRedemptions.toLocaleString()} accent="purple" />
        <StatPill label="Avg Discount" value="22%" accent="pink" />
      </div>

      <AdminCard>
        <div className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by coupon code…"
            className="max-w-md"
          />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader title="All Coupons" icon={Ticket} description={`${filtered.length} coupons`} />
        <div className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No coupons found"
              description="Create your first coupon to start offering discounts."
              action={
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => setOpen(true)}>
                  <Plus className="size-4" /> Create Coupon
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Code</TableHead>
                  <TableHead className="text-white/60">Type</TableHead>
                  <TableHead className="text-white/60">Value</TableHead>
                  <TableHead className="text-white/60">Min Purchase</TableHead>
                  <TableHead className="text-white/60">Usage</TableHead>
                  <TableHead className="text-white/60">Expiry</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const expired = new Date(c.expiry) < new Date();
                  return (
                    <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <button
                          onClick={() => copy(c.code)}
                          className="group flex items-center gap-2 font-mono text-sm font-semibold text-blue-300 hover:text-blue-200"
                        >
                          {c.code}
                          <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] border ${c.type === "PERCENT" ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"}`}>
                          {c.type === "PERCENT" ? (
                            <><Percent className="size-3" /> Percent</>
                          ) : (
                            <><DollarSign className="size-3" /> Flat</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        {c.type === "PERCENT" ? `${c.value}%` : `$${c.value}`}
                      </TableCell>
                      <TableCell className="text-white/70">${c.minPurchase}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="text-white">{c.usage}</span>
                          <span className="text-white/40"> / {c.maxUsage}</span>
                        </div>
                        <div className="mt-1 h-1 w-20 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${Math.min(100, (c.usage / c.maxUsage) * 100)}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-white/50">{formatDate(c.expiry)}</TableCell>
                      <TableCell>
                        {expired ? (
                          <StatusBadge status="expired" />
                        ) : c.active ? (
                          <StatusBadge status="active" />
                        ) : (
                          <StatusBadge status="inactive" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-white/60 hover:bg-white/10 hover:text-white"
                            onClick={() => toggleActive(c.id)}
                          >
                            {c.active ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-white/60 hover:bg-white/10 hover:text-white"
                            onClick={() => notifyComingSoon("Coupon editor")}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                            onClick={() => remove(c.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </AdminCard>

      <CreateCouponDialog open={open} onOpenChange={setOpen} onCreate={createCoupon} />
    </div>
  );
}

function CreateCouponDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (c: Omit<Coupon, "id" | "usage">) => void;
}) {
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = React.useState("10");
  const [minPurchase, setMinPurchase] = React.useState("0");
  const [maxUsage, setMaxUsage] = React.useState("100");
  const [expiry, setExpiry] = React.useState("");

  const reset = () => {
    setCode("");
    setType("PERCENT");
    setValue("10");
    setMinPurchase("0");
    setMaxUsage("100");
    setExpiry("");
  };

  const submit = () => {
    if (!code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    onCreate({
      code: code.toUpperCase().trim(),
      type,
      value: Number(value) || 0,
      minPurchase: Number(minPurchase) || 0,
      maxUsage: Number(maxUsage) || 0,
      expiry: expiry || "2026-12-31",
      active: true,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create Coupon</DialogTitle>
          <DialogDescription className="text-white/60">
            Generate a discount code for your customers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-white/80">Coupon Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER25"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "PERCENT" | "FLAT")}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Percentage</SelectItem>
                  <SelectItem value="FLAT">Flat amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">
                Value {type === "PERCENT" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Min Purchase ($)</Label>
              <Input
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/80">Max Usage</Label>
              <Input
                type="number"
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-white/80">Expiry Date</Label>
            <Input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button onClick={submit} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
            Create Coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
