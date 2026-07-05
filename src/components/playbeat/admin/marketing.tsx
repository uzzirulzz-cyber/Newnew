"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Mail, Users, BarChart3, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const campaigns = [
  {
    name: "Summer Sale 2026",
    type: "Email",
    status: "active",
    sent: 12400,
    openRate: "34%",
    clicks: 1820,
  },
  {
    name: "New Feature Launch",
    type: "Push",
    status: "scheduled",
    sent: 0,
    openRate: "—",
    clicks: 0,
  },
  {
    name: "Re-engagement Campaign",
    type: "Email",
    status: "completed",
    sent: 8900,
    openRate: "28%",
    clicks: 1100,
  },
  {
    name: "Welcome Series",
    type: "Email",
    status: "active",
    sent: 3200,
    openRate: "52%",
    clicks: 890,
  },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-600",
  paused: "bg-yellow-100 text-yellow-700",
};

export function AdminMarketing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Campaigns, emails, and audience management
          </p>
        </div>
        <Button
          onClick={() => toast.info("Campaign builder coming soon!")}
          className="gap-2"
        >
          <Plus size={16} />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Campaigns",
            value: "14",
            icon: <Megaphone size={18} className="text-blue-500" />,
            bg: "bg-blue-50 dark:bg-blue-950",
          },
          {
            label: "Emails Sent",
            value: "24,500",
            icon: <Mail size={18} className="text-green-500" />,
            bg: "bg-green-50 dark:bg-green-950",
          },
          {
            label: "Subscribers",
            value: "8,230",
            icon: <Users size={18} className="text-purple-500" />,
            bg: "bg-purple-50 dark:bg-purple-950",
          },
          {
            label: "Avg Open Rate",
            value: "38%",
            icon: <BarChart3 size={18} className="text-orange-500" />,
            bg: "bg-orange-50 dark:bg-orange-950",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${s.bg}`}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2 font-medium text-muted-foreground">
                    Campaign
                  </th>
                  <th className="text-left pb-2 font-medium text-muted-foreground hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-right pb-2 font-medium text-muted-foreground hidden md:table-cell">
                    Sent
                  </th>
                  <th className="text-right pb-2 font-medium text-muted-foreground hidden lg:table-cell">
                    Open Rate
                  </th>
                  <th className="text-center pb-2 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.name} className="border-b last:border-0">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 hidden sm:table-cell text-muted-foreground">
                      {c.type}
                    </td>
                    <td className="py-3 text-right hidden md:table-cell">
                      {c.sent.toLocaleString()}
                    </td>
                    <td className="py-3 text-right hidden lg:table-cell">
                      {c.openRate}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[c.status] ?? ""}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => toast.info("Opening campaign...")}
                      >
                        View <ArrowRight size={11} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
