"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ImageIcon,
  ExternalLink,
  Loader2,
  Receipt,
  TrendingUp,
  CheckCircle,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, formatInCurrency } from "@/lib/api-client";

const methodLabels: Record<string, string> = {
  "bank-alfalah": "Bank Alfalah",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  paypal: "PayPal",
  crypto: "Crypto",
};

const methodColors: Record<string, string> = {
  "bank-alfalah": "bg-red-100 text-red-700",
  easypaisa: "bg-green-100 text-green-700",
  jazzcash: "bg-orange-100 text-orange-700",
  paypal: "bg-blue-100 text-blue-700",
  crypto: "bg-amber-100 text-amber-700",
};

export function PaymentSubmissions() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState("pending");
  const [viewScreenshot, setViewScreenshot] = React.useState<any | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<any | null>(null);
  const [rejectNote, setRejectNote] = React.useState("");

  // Load all statuses so the stats row is always accurate regardless of filter.
  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ["payment-submissions", "all"],
    queryFn: () => api.adminPaymentSubmissions("all"),
    staleTime: 10_000,
  });
  const { data: filteredData, isLoading: filteredLoading } = useQuery({
    queryKey: ["payment-submissions", statusFilter],
    queryFn: () => api.adminPaymentSubmissions(statusFilter),
    staleTime: 10_000,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.adminPaymentSubmissionAction(id, "confirmed"),
    onSuccess: () => {
      toast.success("Payment confirmed — order marked COMPLETED");
      qc.invalidateQueries({ queryKey: ["payment-submissions"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to confirm payment"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api.adminPaymentSubmissionAction(id, "rejected", note || undefined),
    onSuccess: () => {
      toast.success("Payment rejected");
      setRejectTarget(null);
      setRejectNote("");
      qc.invalidateQueries({ queryKey: ["payment-submissions"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to reject payment"),
  });

  const allSubs = allData?.items || [];
  const submissions = statusFilter === "all" ? allSubs : filteredData?.items || [];
  const loading = statusFilter === "all" ? allLoading : filteredLoading;

  // Stats
  const pendingCount = allSubs.filter((s: any) => s.status === "pending").length;
  const confirmedCount = allSubs.filter((s: any) => s.status === "confirmed").length;
  const rejectedCount = allSubs.filter((s: any) => s.status === "rejected").length;
  const totalAmount = allSubs
    .filter((s: any) => s.status === "confirmed")
    .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

  const handleReject = async () => {
    if (!rejectTarget) return;
    rejectMutation.mutate({ id: rejectTarget.id, note: rejectNote.trim() || undefined });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payment Proof</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and verify customer payment submissions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold mt-1 text-amber-600">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                <Clock size={16} className="text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Confirmed</p>
                <p className="text-xl font-bold mt-1 text-green-600">{confirmedCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle size={16} className="text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-xl font-bold mt-1 text-red-600">{rejectedCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                <Ban size={16} className="text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Confirmed Volume</p>
                <p className="text-xl font-bold mt-1">
                  {formatInCurrency(totalAmount)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <TrendingUp size={16} className="text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {["pending", "confirmed", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s}
            {s !== "all" && (
              <span className="ml-1.5 opacity-70">
                ({s === "pending" ? pendingCount : s === "confirmed" ? confirmedCount : rejectedCount})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt size={36} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No {statusFilter !== "all" ? statusFilter : ""} payment submissions
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.orderNumber}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${methodColors[s.method] || ""}`}
                        >
                          {methodLabels[s.method] || s.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-xs">
                        {formatInCurrency(Number(s.amount) || 0, (s.currency as "PKR" | "USD") || "PKR")}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="font-medium">{s.customerName}</div>
                          <div className="text-muted-foreground">{s.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.transactionId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "—"}
                      </TableCell>
                      <TableCell>
                        {s.screenshotUrl ? (
                          <button
                            onClick={() => setViewScreenshot(s)}
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ImageIcon className="size-3.5" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "confirmed"
                              ? "default"
                              : s.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize gap-1"
                        >
                          {s.status === "pending" && <Clock className="size-3" />}
                          {s.status === "confirmed" && <CheckCircle2 className="size-3" />}
                          {s.status === "rejected" && <XCircle className="size-3" />}
                          {s.status}
                        </Badge>
                        {s.status === "rejected" && s.adminNote && (
                          <p className="text-[10px] text-muted-foreground mt-1 max-w-[160px] truncate" title={s.adminNote}>
                            “{s.adminNote}”
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 gap-1 text-xs bg-green-600 hover:bg-green-700"
                              disabled={confirmMutation.isPending}
                              onClick={() => confirmMutation.mutate(s.id)}
                            >
                              {confirmMutation.isPending && confirmMutation.variables === s.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-3" />
                              )}
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
                              disabled={rejectMutation.isPending}
                              onClick={() => {
                                setRejectTarget(s);
                                setRejectNote("");
                              }}
                            >
                              <XCircle className="size-3" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshot viewer dialog — shows proof image + transaction details */}
      <Dialog open={!!viewScreenshot} onOpenChange={(v) => !v && setViewScreenshot(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Proof — {viewScreenshot?.orderNumber}</DialogTitle>
          </DialogHeader>
          {viewScreenshot && (
            <div className="space-y-3">
              {/* Transaction details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted rounded p-2">
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{viewScreenshot.customerName}</p>
                  <p className="text-muted-foreground">{viewScreenshot.customerEmail}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">
                    {formatInCurrency(Number(viewScreenshot.amount) || 0, (viewScreenshot.currency as "PKR" | "USD") || "PKR")}
                  </p>
                  <p className="text-muted-foreground capitalize">{methodLabels[viewScreenshot.method] || viewScreenshot.method}</p>
                </div>
                <div className="bg-muted rounded p-2 col-span-2">
                  <p className="text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-xs">{viewScreenshot.transactionId}</p>
                </div>
              </div>

              {/* Screenshot */}
              {viewScreenshot.screenshotUrl ? (
                <>
                  <img
                    src={viewScreenshot.screenshotUrl}
                    alt="Payment proof"
                    className="w-full rounded-lg border"
                  />
                  <a
                    href={viewScreenshot.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="size-4" />
                    Open in new tab
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No screenshot uploaded
                </p>
              )}

              {/* Quick actions from the viewer */}
              {viewScreenshot.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700"
                    disabled={confirmMutation.isPending}
                    onClick={() => {
                      confirmMutation.mutate(viewScreenshot.id);
                      setViewScreenshot(null);
                    }}
                  >
                    <CheckCircle2 className="size-4" />
                    Confirm Payment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setRejectTarget(viewScreenshot);
                      setViewScreenshot(null);
                    }}
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog — collects an admin note */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && (setRejectTarget(null), setRejectNote(""))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle size={16} className="text-destructive" />
              Reject Payment
            </DialogTitle>
          </DialogHeader>
          {rejectTarget && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground bg-muted rounded p-2.5">
                <p>
                  <span className="font-medium text-foreground">{rejectTarget.customerName}</span> ·{" "}
                  <span className="font-mono">{rejectTarget.orderNumber}</span>
                </p>
                <p>
                  {formatInCurrency(Number(rejectTarget.amount) || 0, (rejectTarget.currency as "PKR" | "USD") || "PKR")} · TRN:{" "}
                  <span className="font-mono">{rejectTarget.transactionId}</span>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason for rejection (optional)</Label>
                <Textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. Screenshot unclear, transaction not found, wrong amount…"
                  rows={3}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  This note is stored on the submission and visible to other admins.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => (setRejectTarget(null), setRejectNote(""))}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={handleReject}
              className="gap-1.5"
            >
              {rejectMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
