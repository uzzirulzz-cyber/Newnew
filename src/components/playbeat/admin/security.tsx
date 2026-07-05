"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Lock,
  Activity,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const securityItems = [
  {
    label: "Two-Factor Authentication",
    description: "Require 2FA for all admin accounts",
    enabled: true,
  },
  {
    label: "IP Allowlist",
    description: "Restrict access to specific IP addresses",
    enabled: false,
  },
  {
    label: "Session Timeout",
    description: "Auto-logout inactive sessions after 30 minutes",
    enabled: true,
  },
  {
    label: "Login Attempt Limit",
    description: "Lock account after 5 failed attempts",
    enabled: true,
  },
  {
    label: "SSL/HTTPS Enforcement",
    description: "Redirect all HTTP traffic to HTTPS",
    enabled: true,
  },
  {
    label: "Password Complexity",
    description: "Require strong passwords for all users",
    enabled: true,
  },
];

export function SecurityModule() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => api.adminAuditLogs(),
    staleTime: 30_000,
  });
  const auditLogs = data?.items || [];
  const [settings, setSettings] = React.useState(
    securityItems.map((s) => ({ ...s })),
  );

  const toggle = (idx: number) => {
    setSettings(
      settings.map((s, i) =>
        i === idx ? { ...s, enabled: !s.enabled } : s,
      ),
    );
    toast.success("Setting updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-green-100 dark:bg-green-950 rounded-xl">
          <ShieldCheck size={22} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Security</h1>
          <p className="text-muted-foreground text-sm">
            Manage security settings and audit logs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Security Score", value: "92/100", color: "text-green-600" },
          { label: "Active Sessions", value: "14" },
          { label: "Blocked IPs", value: "3" },
          { label: "Failed Logins (24h)", value: "7" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color ?? ""}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.map((s, idx) => (
            <div
              key={s.label}
              className="flex items-start justify-between p-3 bg-muted rounded-lg gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-1.5 rounded ${s.enabled ? "bg-green-100 dark:bg-green-950" : "bg-gray-100 dark:bg-gray-800"}`}
                >
                  {s.enabled ? (
                    <ShieldCheck size={14} className="text-green-600" />
                  ) : (
                    <Lock size={14} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggle(idx)}
                className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${s.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${s.enabled ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity size={16} />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No audit logs yet
            </p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log: any) => (
                <div
                  key={log._id ?? log.id}
                  className="flex items-center gap-3 text-xs py-2 border-b last:border-0"
                >
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Activity size={10} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {log.actorName}{" "}
                      <span className="font-normal text-muted-foreground">
                        {log.action}
                      </span>
                    </p>
                    {log.resource && (
                      <p className="text-muted-foreground truncate">
                        {log.resource}
                        {log.resourceId ? ` #${log.resourceId}` : ""}
                      </p>
                    )}
                  </div>
                  <p className="text-muted-foreground shrink-0">
                    {new Date(
                      log._creationTime ?? log.createdAt ?? Date.now(),
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
