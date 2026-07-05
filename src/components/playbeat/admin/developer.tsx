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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Code2,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Webhook,
  Copy,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function DeveloperModule() {
  const qc = useQueryClient();
  const [showKeyCreate, setShowKeyCreate] = React.useState(false);
  const [showWebhookCreate, setShowWebhookCreate] = React.useState(false);
  const [keyForm, setKeyForm] = React.useState({
    name: "",
    permissions: ["read"],
  });
  const [webhookForm, setWebhookForm] = React.useState({
    name: "",
    url: "",
    events: ["order.created"],
  });
  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set());

  const { data: keysData, isLoading: keysLoading } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: () => api.adminApiKeys(),
    staleTime: 30_000,
  });
  const { data: webhooksData, isLoading: webhooksLoading } = useQuery({
    queryKey: ["admin-webhooks"],
    queryFn: () => api.adminWebhooks(),
    staleTime: 30_000,
  });
  const apiKeys = keysData?.items || [];
  const webhooks = webhooksData?.items || [];

  const handleCreateKey = async () => {
    if (!keyForm.name) {
      toast.error("Name required");
      return;
    }
    try {
      await api.adminApiKeyCreate({
        name: keyForm.name,
        permissions: keyForm.permissions,
      });
      toast.success("API key created");
      setShowKeyCreate(false);
      setKeyForm({ name: "", permissions: ["read"] });
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
    } catch {
      toast.error("Failed to create key");
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await api.adminApiKeyRevoke(id);
      toast.success("Key revoked");
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.name || !webhookForm.url) {
      toast.error("Name and URL required");
      return;
    }
    try {
      await api.adminWebhookCreate(webhookForm);
      toast.success("Webhook created");
      setShowWebhookCreate(false);
      qc.invalidateQueries({ queryKey: ["admin-webhooks"] });
    } catch {
      toast.error("Failed to create webhook");
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await api.adminWebhookDelete(id);
      toast.success("Webhook deleted");
      qc.invalidateQueries({ queryKey: ["admin-webhooks"] });
    } catch {
      toast.error("Failed to delete webhook");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <Code2 size={22} className="text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Developer</h1>
          <p className="text-muted-foreground text-sm">
            API keys, webhooks, and developer tools
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">API Keys</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowKeyCreate(true)}
            className="gap-1 h-8"
          >
            <Plus size={13} />
            New Key
          </Button>
        </CardHeader>
        <CardContent>
          {keysLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No API keys yet
            </p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((k: any) => (
                <div
                  key={k._id ?? k.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{k.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-background px-2 py-0.5 rounded border font-mono">
                        {visibleKeys.has(k._id ?? k.id)
                          ? k.key
                          : `${k.prefix}${"*".repeat(20)}`}
                      </code>
                      <button
                        onClick={() => {
                          const s = new Set(visibleKeys);
                          const id = k._id ?? k.id;
                          if (s.has(id)) s.delete(id);
                          else s.add(id);
                          setVisibleKeys(s);
                        }}
                      >
                        {visibleKeys.has(k._id ?? k.id) ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(k.key ?? "");
                          toast.success("Copied!");
                        }}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {k.status}
                  </span>
                  {k.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => handleRevokeKey(k._id ?? k.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Webhooks</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowWebhookCreate(true)}
            className="gap-1 h-8"
          >
            <Plus size={13} />
            Add Webhook
          </Button>
        </CardHeader>
        <CardContent>
          {webhooksLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No webhooks configured
            </p>
          ) : (
            <div className="space-y-3">
              {webhooks.map((w: any) => (
                <div
                  key={w._id ?? w.id}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                >
                  <Webhook
                    size={16}
                    className="text-muted-foreground shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{w.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {w.url}
                    </p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {(w.events ?? []).map((e: string) => (
                        <span
                          key={e}
                          className="text-xs bg-background border px-1.5 py-0.5 rounded"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {w.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteWebhook(w._id ?? w.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showKeyCreate} onOpenChange={setShowKeyCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={keyForm.name}
                onChange={(e) =>
                  setKeyForm({ ...keyForm, name: e.target.value })
                }
                placeholder="My App Key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowKeyCreate(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateKey}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showWebhookCreate}
        onOpenChange={setShowWebhookCreate}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={webhookForm.name}
                onChange={(e) =>
                  setWebhookForm({ ...webhookForm, name: e.target.value })
                }
                placeholder="Order Events"
              />
            </div>
            <div>
              <Label>URL *</Label>
              <Input
                value={webhookForm.url}
                onChange={(e) =>
                  setWebhookForm({ ...webhookForm, url: e.target.value })
                }
                placeholder="https://yoursite.com/webhooks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowWebhookCreate(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateWebhook}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
