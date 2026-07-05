"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { HeadphonesIcon, Search, Plus, MessageSquare } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

export function SupportModule() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [priority, setPriority] = React.useState("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [viewTicket, setViewTicket] = React.useState<any | null>(null);
  const [reply, setReply] = React.useState("");
  const [form, setForm] = React.useState({
    customerName: "",
    customerEmail: "",
    subject: "",
    description: "",
    priority: "medium" as string,
    category: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support", status, priority, search],
    queryFn: () =>
      api.adminSupportList({
        search: search || undefined,
        status: status === "all" ? undefined : status,
        priority: priority === "all" ? undefined : priority,
      }),
    staleTime: 30_000,
  });
  const tickets = data?.items || [];

  const handleCreate = async () => {
    if (!form.customerName || !form.subject || !form.description) {
      toast.error("Fill required fields");
      return;
    }
    try {
      await api.adminSupportCreate({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        category: form.category,
      });
      toast.success("Ticket created");
      setShowCreate(false);
      setForm({
        customerName: "",
        customerEmail: "",
        subject: "",
        description: "",
        priority: "medium",
        category: "",
      });
      qc.invalidateQueries({ queryKey: ["admin-support"] });
    } catch {
      toast.error("Failed to create ticket");
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !viewTicket) return;
    try {
      await api.adminSupportReply({
        id: viewTicket._id ?? viewTicket.id,
        authorName: "Support Staff",
        message: reply,
        isStaff: true,
      });
      setReply("");
      toast.success("Reply sent");
      qc.invalidateQueries({ queryKey: ["admin-support"] });
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.adminSupportUpdate({ id, status: newStatus });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-support"] });
    } catch {
      toast.error("Failed to update ticket");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage customer support requests
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} />
          New Ticket
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search tickets..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HeadphonesIcon
              size={40}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <p className="text-muted-foreground">No tickets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Ticket
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Customer
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Priority
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
              {tickets.map((t: any) => (
                <tr
                  key={t._id ?? t.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-muted-foreground">
                      {t.ticketNumber ?? t.id}
                    </p>
                    <p className="font-medium text-sm">{t.subject}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm">{t.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.customerEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityColors[t.priority] ?? ""}`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[t.status] ?? ""}`}
                    >
                      {t.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewTicket(t)}
                      >
                        <MessageSquare size={13} />
                      </Button>
                      <Select
                        onValueChange={async (v) => {
                          await handleUpdateStatus(t._id ?? t.id, v);
                        }}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue placeholder="Update" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
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
        open={!!viewTicket}
        onOpenChange={(o) => !o && setViewTicket(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewTicket?.ticketNumber ?? viewTicket?.id}:{" "}
              {viewTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          {viewTicket && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Original Message</p>
                <p className="text-muted-foreground">
                  {viewTicket.description}
                </p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(viewTicket.replies ?? []).map((r: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-sm ${r.isStaff ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}
                  >
                    <p className="font-medium text-xs mb-1">
                      {r.authorName} ·{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                    <p>{r.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleReply} className="self-end">
                  Send
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
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
              <Label>Email</Label>
              <Input
                value={form.customerEmail}
                onChange={(e) =>
                  setForm({ ...form, customerEmail: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Issue with..."
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
