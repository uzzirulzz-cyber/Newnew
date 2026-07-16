"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, ImageIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export function PaymentSubmissions() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState("pending");
  const [viewScreenshot, setViewScreenshot] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
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
    onError: () => toast.error("Failed to confirm payment"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.adminPaymentSubmissionAction(id, "rejected"),
    onSuccess: () => {
      toast.success("Payment rejected");
      qc.invalidateQueries({ queryKey: ["payment-submissions"] });
    },
    onError: () => toast.error("Failed to reject payment"),
  });

  const submissions = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">Payment Submissions</h2>
        <div className="flex gap-1">
          {["pending", "confirmed", "rejected", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : submissions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          No {statusFilter} payment submissions
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Screenshot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.orderNumber}</TableCell>
                    <TableCell className="capitalize">{s.method}</TableCell>
                    <TableCell>Rs {s.amount}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>{s.customerName}</div>
                        <div className="text-muted-foreground">{s.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.transactionId}</TableCell>
                    <TableCell>
                      {s.screenshotUrl ? (
                        <button
                          onClick={() => setViewScreenshot(s.screenshotUrl)}
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
                        variant={s.status === "confirmed" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}
                        className="capitalize"
                      >
                        {s.status === "pending" && <Clock className="mr-1 size-3" />}
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 gap-1 text-xs"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate(s.id)}
                          >
                            <CheckCircle2 className="size-3" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 gap-1 text-xs"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate(s.id)}
                          >
                            <XCircle className="size-3" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Screenshot viewer dialog */}
      <Dialog open={!!viewScreenshot} onOpenChange={(v) => !v && setViewScreenshot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {viewScreenshot && (
            <div className="space-y-3">
              <img src={viewScreenshot} alt="Payment proof" className="w-full rounded-lg border" />
              <a href={viewScreenshot} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                <ExternalLink className="size-4" />
                Open in new tab
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
