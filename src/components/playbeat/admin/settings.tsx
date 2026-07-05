"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Save, Globe, Mail } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const settingGroups = [
  {
    group: "general",
    label: "General",
    icon: <Globe size={16} />,
    settings: [
      {
        key: "site_name",
        label: "Site Name",
        defaultValue: "Enterprise CMS",
      },
      {
        key: "site_url",
        label: "Site URL",
        defaultValue: "https://example.com",
      },
      {
        key: "support_email",
        label: "Support Email",
        defaultValue: "support@example.com",
      },
      { key: "timezone", label: "Timezone", defaultValue: "UTC" },
    ],
  },
  {
    group: "email",
    label: "Email",
    icon: <Mail size={16} />,
    settings: [
      {
        key: "smtp_host",
        label: "SMTP Host",
        defaultValue: "smtp.gmail.com",
      },
      { key: "smtp_port", label: "SMTP Port", defaultValue: "587" },
      { key: "smtp_user", label: "SMTP Username", defaultValue: "" },
      {
        key: "from_name",
        label: "From Name",
        defaultValue: "Enterprise CMS",
      },
    ],
  },
];

export function AdminSettings() {
  const qc = useQueryClient();
  const [activeGroup, setActiveGroup] = React.useState("general");
  const [values, setValues] = React.useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.adminSettingsGet(),
    staleTime: 30_000,
  });
  const settings = data?.settings || {};

  const currentGroup = settingGroups.find((g) => g.group === activeGroup)!;

  const getValue = (key: string, defaultValue: string) => {
    if (key in values) return values[key];
    const stored = settings[key];
    return stored !== undefined && stored !== null
      ? String(stored)
      : defaultValue;
  };

  const handleSave = async () => {
    try {
      const payload: Record<string, string> = {};
      for (const s of currentGroup.settings) {
        payload[s.key] = getValue(s.key, s.defaultValue);
      }
      await api.adminSettingsPut(payload);
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <Settings size={22} className="text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure your platform settings
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save size={15} />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-2">
            {settingGroups.map((g) => (
              <button
                key={g.group}
                onClick={() => setActiveGroup(g.group)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${activeGroup === g.group ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {g.icon}
                <span>{g.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base capitalize">
              {activeGroup} Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentGroup.settings.map((s) => (
                  <div key={s.key}>
                    <Label>{s.label}</Label>
                    <Input
                      value={getValue(s.key, s.defaultValue)}
                      onChange={(e) =>
                        setValues({ ...values, [s.key]: e.target.value })
                      }
                      placeholder={s.defaultValue}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
