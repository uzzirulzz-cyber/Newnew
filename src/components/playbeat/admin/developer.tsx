"use client";

import * as React from "react";
import {
  Code,
  Plus,
  Copy,
  Trash2,
  RotateCw,
  Webhook,
  Plug,
  FileText,
  Download,
  Terminal,
  Box,
  Zap,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatPill,
  StatusBadge,
  ToggleRow,
  notifyMock,
  notifyComingSoon,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_KEYS = [
  { id: "k1", name: "Production Server", key: "pb_live_sk_4f8a…9c21", created: "Jan 12, 2026", lastUsed: "2 minutes ago", requests: 184220, status: "active" },
  { id: "k2", name: "Mobile App (Android)", key: "pb_live_sk_8c2d…1a44", created: "Feb 04, 2026", lastUsed: "1 hour ago", requests: 84210, status: "active" },
  { id: "k3", name: "Mobile App (iOS)", key: "pb_live_sk_a18f…7b90", created: "Feb 04, 2026", lastUsed: "30 minutes ago", requests: 92180, status: "active" },
  { id: "k4", name: "Zapier Integration", key: "pb_live_sk_22e1…c4a8", created: "Mar 18, 2026", lastUsed: "1 week ago", requests: 820, status: "inactive" },
];

const WEBHOOKS = [
  { id: "w1", url: "https://hooks.zapier.com/v1/playbeat/orders", events: ["order.created", "order.paid"], status: "active", lastDelivery: "12 seconds ago" },
  { id: "w2", url: "https://api.slack.com/v1/playbeat/alerts", events: ["user.suspended", "refund.issued"], status: "active", lastDelivery: "2 hours ago" },
  { id: "w3", url: "https://crm.example.com/webhooks/playbeat", events: ["customer.created"], status: "active", lastDelivery: "1 day ago" },
  { id: "w4", url: "https://legacy.example.com/hook", events: ["order.refunded"], status: "inactive", lastDelivery: "Failed 3d ago" },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/products", desc: "List all products" },
  { method: "POST", path: "/api/v1/orders", desc: "Place a new order" },
  { method: "GET", path: "/api/v1/orders/:id", desc: "Get order details" },
  { method: "GET", path: "/api/v1/users/me", desc: "Get current user" },
  { method: "POST", path: "/api/v1/reviews", desc: "Submit a product review" },
  { method: "GET", path: "/api/v1/analytics/dashboard", desc: "Get analytics dashboard" },
  { method: "POST", path: "/api/v1/checkout/lemon-squeezy", desc: "Create LS checkout session" },
  { method: "POST", path: "/api/v1/coupons/validate", desc: "Validate a coupon code" },
];

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  PUT: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  DELETE: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function DeveloperModule() {
  const [sandbox, setSandbox] = React.useState(false);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Developer"
        description="API keys, webhooks, endpoints, and SDKs"
        icon={Code}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("API key generator")}>
            <Plus className="size-4" /> New API Key
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="API Keys" value="4" accent="blue" />
        <StatPill label="Requests (30d)" value="362,430" accent="purple" />
        <StatPill label="Webhooks" value="4" accent="cyan" />
        <StatPill label="Avg Latency" value="184ms" accent="green" />
      </div>

      {/* API keys */}
      <AdminCard>
        <AdminCardHeader
          title="API Keys"
          icon={Terminal}
          description="Manage authentication tokens for your applications"
        />
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Name</TableHead>
                <TableHead className="text-white/60">Key</TableHead>
                <TableHead className="text-white/60">Created</TableHead>
                <TableHead className="text-white/60">Last Used</TableHead>
                <TableHead className="text-white/60 text-right">Requests</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {API_KEYS.map((k) => (
                <TableRow key={k.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{k.name}</TableCell>
                  <TableCell>
                    <code className="text-xs text-blue-300 font-mono">{k.key}</code>
                  </TableCell>
                  <TableCell className="text-xs text-white/50">{k.created}</TableCell>
                  <TableCell className="text-xs text-white/50">{k.lastUsed}</TableCell>
                  <TableCell className="text-right tabular-nums text-white/80">{k.requests.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={k.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-7 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => notifyMock("API key copied")}>
                        <Copy className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => notifyMock("Rotating key…")}>
                        <RotateCw className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-rose-300 hover:bg-rose-500/10" onClick={() => notifyMock("Key revoked")}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      {/* Sandbox toggle + SDKs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard className="lg:col-span-1">
          <AdminCardHeader title="Environment" icon={Zap} />
          <div className="p-4 space-y-3">
            <ToggleRow
              label="Sandbox mode"
              description="Route API requests to test environment"
              checked={sandbox}
              onChange={(c) => { setSandbox(c); notifyMock(`Sandbox ${c ? "enabled" : "disabled"}`); }}
            />
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-white/60">Base URL</span>
                <code className="text-blue-300 font-mono">https://api.playbeat.digital</code>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Version</span>
                <span className="text-white">v1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Rate limit</span>
                <span className="text-white">1000 req/min</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Opening API docs")}>
              <FileText className="size-3.5" /> API Documentation
            </Button>
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <AdminCardHeader title="SDK Downloads" icon={Box} description="Official client libraries" />
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { lang: "JavaScript", ver: "v2.4.1", dl: "12.4k" },
              { lang: "Python", ver: "v2.3.0", dl: "8.2k" },
              { lang: "PHP", ver: "v2.1.4", dl: "4.8k" },
              { lang: "Go", ver: "v1.8.2", dl: "2.1k" },
              { lang: "Ruby", ver: "v1.6.0", dl: "980" },
              { lang: "Java", ver: "v2.0.0", dl: "1.4k" },
            ].map((s) => (
              <div key={s.lang} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-white">{s.lang}</div>
                  <Badge variant="outline" className="text-[9px] border-white/10 bg-white/5 text-white/60">{s.ver}</Badge>
                </div>
                <div className="text-[10px] text-white/50 mt-1">{s.dl} downloads</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => notifyMock(`Downloading ${s.lang} SDK`)}
                >
                  <Download className="size-3.5" /> Download
                </Button>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* Webhooks */}
      <AdminCard>
        <AdminCardHeader
          title="Webhooks"
          icon={Webhook}
          description="Receive real-time event notifications"
          action={
            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("Webhook creator")}>
              <Plus className="size-3.5" /> Add Webhook
            </Button>
          }
        />
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Endpoint URL</TableHead>
                <TableHead className="text-white/60">Events</TableHead>
                <TableHead className="text-white/60">Last Delivery</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {WEBHOOKS.map((w) => (
                <TableRow key={w.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-blue-300 max-w-xs truncate">{w.url}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {w.events.map((e) => (
                        <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">{e}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-white/50">{w.lastDelivery}</TableCell>
                  <TableCell><StatusBadge status={w.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-7 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => notifyMock("Test event sent")}>
                        <Zap className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-rose-300 hover:bg-rose-500/10" onClick={() => notifyMock("Webhook deleted")}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      {/* Endpoints */}
      <AdminCard>
        <AdminCardHeader
          title="REST API Endpoints"
          icon={Plug}
          description="Available endpoints (GraphQL coming soon)"
        />
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Method</TableHead>
                <TableHead className="text-white/60">Endpoint</TableHead>
                <TableHead className="text-white/60">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ENDPOINTS.map((e, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${METHOD_COLOR[e.method]}`}>
                      {e.method}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-blue-300 font-mono">{e.path}</code>
                  </TableCell>
                  <TableCell className="text-xs text-white/60">{e.desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>
    </div>
  );
}
