"use client";

import * as React from "react";
import {
  Shield,
  ShieldCheck,
  Key,
  Ban,
  Globe,
  History,
  Lock,
  Download,
  Upload,
  Plus,
  Copy,
  Smartphone,
  RefreshCw,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AUDIT_LOGS = [
  { id: "a1", actor: "founder@playbeat.live", action: "Approved product", target: "NovaScript AI Writer", ip: "203.135.42.18", when: "12 minutes ago", severity: "info" },
  { id: "a2", actor: "System", action: "Auto-flagged review", target: "SheetFlow Automation", ip: "—", when: "2 hours ago", severity: "warning" },
  { id: "a3", actor: "ceo@playbeat.live", action: "Issued refund", target: "Order #PB-1024", ip: "203.135.42.18", when: "5 hours ago", severity: "info" },
  { id: "a4", actor: "System", action: "Blocked suspicious login", target: "user@example.com", ip: "188.42.18.91", when: "8 hours ago", severity: "critical" },
  { id: "a5", actor: "director@playbeat.live", action: "Updated SMTP config", target: "Email settings", ip: "182.18.42.10", when: "1 day ago", severity: "info" },
  { id: "a6", actor: "System", action: "API key rotated", target: "Mobile App (iOS)", ip: "—", when: "1 day ago", severity: "warning" },
  { id: "a7", actor: "founder@playbeat.live", action: "Suspended user", target: "spam_user_42", ip: "203.135.42.18", when: "2 days ago", severity: "warning" },
];

const LOGIN_HISTORY = [
  { user: "founder@playbeat.live", ip: "203.135.42.18", location: "Karachi, PK", device: "Chrome on macOS", when: "12 minutes ago", status: "success" },
  { user: "ceo@playbeat.live", ip: "182.18.42.10", location: "Lahore, PK", device: "Safari on iPhone", when: "1 hour ago", status: "success" },
  { user: "unknown@example.com", ip: "188.42.18.91", location: "Unknown (VPN)", device: "Headless Chrome", when: "8 hours ago", status: "blocked" },
  { user: "director@playbeat.live", ip: "203.135.42.18", location: "Karachi, PK", device: "Firefox on Windows", when: "1 day ago", status: "success" },
];

const FIREWALL_RULES = [
  { id: "f1", pattern: "Rate > 100 req/min", action: "Throttle", hits: 4280, status: "active" },
  { id: "f2", pattern: "Geo: blocked countries", action: "Block", hits: 184, status: "active" },
  { id: "f3", pattern: "SQL injection pattern", action: "Block + log", hits: 42, status: "active" },
  { id: "f4", pattern: "User-agent contains curl", action: "Challenge", hits: 28, status: "active" },
];

const SEVERITY_COLOR: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  critical: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function SecurityModule() {
  const [twoFA, setTwoFA] = React.useState(true);
  const [ipWhitelist, setIpWhitelist] = React.useState("203.135.42.18\n182.18.42.10");

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Security"
        description="Audit logs, access control, and threat protection"
        icon={Shield}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("Security report generated")}>
            <Download className="size-4" /> Export Report
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Security Score" value="94/100" accent="green" />
        <StatPill label="Threats Blocked (30d)" value="482" accent="pink" />
        <StatPill label="Active Sessions" value="12" accent="blue" />
        <StatPill label="Failed Logins" value="38" accent="amber" />
      </div>

      {/* Two-Factor + Access control */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard>
          <AdminCardHeader title="Two-Factor Auth" icon={Smartphone} />
          <div className="p-4 space-y-3">
            <ToggleRow
              label="Require 2FA for admins"
              description="TOTP app required for all admin accounts"
              checked={twoFA}
              onChange={(c) => { setTwoFA(c); notifyMock(`2FA ${c ? "enforced" : "disabled"}`); }}
            />
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <ShieldCheck className="size-4" />
                <span className="font-semibold">3 / 3 admin accounts enrolled</span>
              </div>
              <div className="mt-1.5 text-[11px] text-emerald-300/70">
                All admins use authenticator apps. Backup codes generated.
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("2FA setup wizard")}>
              <Lock className="size-3.5" /> Reset Backup Codes
            </Button>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="IP Whitelist" icon={Globe} />
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Allowed IPs (one per line)</Label>
              <textarea
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-white resize-none focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("IP whitelist saved")}>
              Save Whitelist
            </Button>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/60">
              When enabled, admin access is restricted to these IPs only.
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="Backup & Restore" icon={RefreshCw} />
          <div className="p-4 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-white/60">Last backup</span>
                <span className="text-white">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Storage</span>
                <span className="text-white">S3 — encrypted</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Schedule</span>
                <span className="text-white">Every 6 hours</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Manual backup started")}>
              <Download className="size-3.5" /> Backup Now
            </Button>
            <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("Restore wizard")}>
              <Upload className="size-3.5" /> Restore from Backup
            </Button>
          </div>
        </AdminCard>
      </div>

      {/* Audit log */}
      <AdminCard>
        <AdminCardHeader
          title="Audit Log"
          icon={History}
          description="Every important platform action is recorded"
        />
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Actor</TableHead>
                <TableHead className="text-white/60">Action</TableHead>
                <TableHead className="text-white/60">Target</TableHead>
                <TableHead className="text-white/60">IP Address</TableHead>
                <TableHead className="text-white/60">When</TableHead>
                <TableHead className="text-white/60">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_LOGS.map((a) => (
                <TableRow key={a.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-sm font-medium text-white">{a.actor}</TableCell>
                  <TableCell className="text-sm text-white/80">{a.action}</TableCell>
                  <TableCell className="text-sm text-white/60">{a.target}</TableCell>
                  <TableCell className="font-mono text-xs text-white/50">{a.ip}</TableCell>
                  <TableCell className="text-xs text-white/50">{a.when}</TableCell>
                  <TableCell>
                    <span className={cn("text-[10px] uppercase font-semibold px-2 py-0.5 rounded border", SEVERITY_COLOR[a.severity])}>
                      {a.severity}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      {/* Login history */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader title="Login History" icon={History} description="Recent auth attempts" />
          <div className="p-0">
            <div className="divide-y divide-white/5">
              {LOGIN_HISTORY.map((l, i) => (
                <div key={i} className="p-3.5 hover:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{l.user}</div>
                      <div className="text-[10px] text-white/50">{l.device} · {l.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/50">{l.when}</div>
                      <StatusBadge status={l.status === "success" ? "active" : "blocked"} label={l.status} />
                    </div>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-white/40">{l.ip}</div>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>

        {/* Firewall rules */}
        <AdminCard>
          <AdminCardHeader
            title="Firewall Rules"
            icon={Ban}
            description="Active threat prevention rules"
            action={
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("Firewall rule builder")}>
                <Plus className="size-3.5" /> Add Rule
              </Button>
            }
          />
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Pattern</TableHead>
                  <TableHead className="text-white/60">Action</TableHead>
                  <TableHead className="text-white/60 text-right">Hits</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FIREWALL_RULES.map((f) => (
                  <TableRow key={f.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-xs font-mono text-white">{f.pattern}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5 text-white/70">
                        {f.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-white/80">{f.hits.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={f.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminCard>
      </div>

      {/* API keys (security section) */}
      <AdminCard>
        <AdminCardHeader
          title="Security Keys"
          icon={Key}
          description="Manage encryption & signing keys"
        />
        <div className="p-4 grid gap-3 md:grid-cols-2">
          {[
            { name: "JWT Signing", value: "jwt_sk_…7f3a", created: "Jan 12, 2026" },
            { name: "Webhook Secret", value: "whsec_…2b8c", created: "Feb 04, 2026" },
            { name: "Encryption Key", value: "enc_…9d1e", created: "Jan 12, 2026" },
            { name: "Payment HMAC", value: "hmac_…4c2a", created: "Mar 18, 2026" },
          ].map((k) => (
            <div key={k.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <div className="text-sm font-medium text-white">{k.name}</div>
                <div className="text-xs text-white/50 mt-0.5">
                  <code className="text-blue-300">{k.value}</code> · {k.created}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-7 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => notifyMock("Key copied")}>
                  <Copy className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7 text-rose-300 hover:bg-rose-500/10" onClick={() => notifyMock("Key rotated")}>
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
