"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Landmark,
  Zap,
  CreditCard,
  Globe,
  CheckCircle2,
  XCircle,
  Settings,
  Loader2,
  Save,
  Plus,
  X,
  Bitcoin,
} from "lucide-react";
import { api, formatInCurrency } from "@/lib/api-client";
import { toast } from "sonner";

const gatewayIcons: Record<string, React.ReactNode> = {
  stripe: <CreditCard size={20} className="text-indigo-500" />,
  paypal: <Globe size={20} className="text-blue-500" />,
  jazzcash: <Zap size={20} className="text-orange-500" />,
  easypaisa: <Zap size={20} className="text-green-500" />,
  "bank-alfalah": <Landmark size={20} className="text-red-500" />,
  crypto: <Bitcoin size={20} className="text-amber-500" />,
};

/** Keys whose values should be masked in the settings dialog (shown as dots). */
const SENSITIVE_KEYS = ["password", "secret", "apiKey", "api_key", "consumerSecret", "privateKey", "appPassword", "hashKey", "salt"];

function isSensitive(key: string): boolean {
  return SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()));
}

export function AdminPayments() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-gateways"],
    queryFn: () => api.adminPaymentGateways(),
    staleTime: 30_000,
  });
  const gateways = data?.items || [];

  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [editingGateway, setEditingGateway] = React.useState<any | null>(null);

  const handleToggle = async (g: any) => {
    const id = g._id ?? g.id;
    setTogglingId(id);
    try {
      await api.adminGatewayToggle({ id, enabled: !g.enabled });
      toast.success(`${g.name} ${g.enabled ? "disabled" : "enabled"}`);
      qc.invalidateQueries({ queryKey: ["admin-payment-gateways"] });
    } catch {
      toast.error("Failed to toggle gateway");
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleTest = async (g: any) => {
    const id = g._id ?? g.id;
    setTogglingId(id);
    try {
      await api.adminGatewayTestMode({ id, testMode: !g.testMode });
      toast.success(`${g.name} switched to ${g.testMode ? "Live" : "Test"} mode`);
      qc.invalidateQueries({ queryKey: ["admin-payment-gateways"] });
    } catch {
      toast.error("Failed to toggle test mode");
    } finally {
      setTogglingId(null);
    }
  };

  const enabledCount = gateways.filter((g: any) => g.enabled).length;
  const liveCount = gateways.filter((g: any) => g.enabled && !g.testMode).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payment Gateways</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure payment methods for your platform
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {enabledCount}/{gateways.length} enabled
          </Badge>
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            {liveCount} live
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : gateways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Landmark size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No gateways configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run the seeder or add gateways via the API.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((g: any) => {
            const id = g._id ?? g.id;
            const currency = g.supportedCurrencies?.[0] || "PKR";
            const volume = Number(g.totalVolume ?? 0);
            return (
              <Card key={id} className={g.enabled ? "border-emerald-500/30" : ""}>
                <CardContent className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {gatewayIcons[g.slug] ?? <CreditCard size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold">{g.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{g.slug}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {g.enabled ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                          <XCircle size={14} /> Inactive
                        </span>
                      )}
                      {g.enabled && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            g.testMode
                              ? "border-amber-400 text-amber-600"
                              : "border-emerald-400 text-emerald-600"
                          }`}
                        >
                          {g.testMode ? "Test Mode" : "Live"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="bg-muted rounded p-2">
                      <p className="text-muted-foreground">Transactions</p>
                      <p className="font-semibold">
                        {Number(g.transactionCount ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <p className="text-muted-foreground">Volume</p>
                      <p className="font-semibold">
                        {currency === "PKR" || currency === "USD"
                          ? formatInCurrency(volume, currency as "PKR" | "USD")
                          : `${volume.toLocaleString()} ${currency}`}
                      </p>
                    </div>
                  </div>

                  {/* Supported currencies */}
                  {g.supportedCurrencies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {g.supportedCurrencies.map((c: string) => (
                        <Badge key={c} variant="outline" className="text-[9px]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={g.enabled ? "secondary" : "default"}
                      className="flex-1 text-xs h-8"
                      disabled={togglingId === id}
                      onClick={() => handleToggle(g)}
                    >
                      {togglingId === id ? (
                        <Loader2 size={12} className="animate-spin mr-1" />
                      ) : null}
                      {g.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-8"
                      disabled={togglingId === id || !g.enabled}
                      onClick={() => handleToggleTest(g)}
                      title={g.testMode ? "Switch to Live mode" : "Switch to Test mode"}
                    >
                      {g.testMode ? "Go Live" : "Use Test"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingGateway(g)}
                      title="Configure gateway"
                    >
                      <Settings size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Settings dialog */}
      <GatewaySettingsDialog
        gateway={editingGateway}
        onClose={() => setEditingGateway(null)}
        onSaved={() => {
          setEditingGateway(null);
          qc.invalidateQueries({ queryKey: ["admin-payment-gateways"] });
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// GatewaySettingsDialog — edit config (key/value pairs) + currencies + name
// ---------------------------------------------------------------------------

function GatewaySettingsDialog({
  gateway,
  onClose,
  onSaved,
}: {
  gateway: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [configEntries, setConfigEntries] = React.useState<Array<{ key: string; value: string; secret: boolean }>>([]);
  const [currencies, setCurrencies] = React.useState<string[]>([]);
  const [newCurrency, setNewCurrency] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Hydrate the form whenever a different gateway is opened.
  React.useEffect(() => {
    if (!gateway) return;
    setName(gateway.name || "");
    const config = gateway.config || {};
    const entries = Object.entries(config).map(([key, value]) => ({
      key,
      value: String(value ?? ""),
      secret: isSensitive(key),
    }));
    // Always show at least one empty row so the admin can add a new field.
    if (entries.length === 0) entries.push({ key: "", value: "", secret: false });
    setConfigEntries(entries);
    setCurrencies(Array.isArray(gateway.supportedCurrencies) ? gateway.supportedCurrencies : []);
    setNewCurrency("");
  }, [gateway]);

  if (!gateway) return null;

  const updateEntry = (idx: number, patch: Partial<{ key: string; value: string }>) => {
    setConfigEntries((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addEntry = () => setConfigEntries((r) => [...r, { key: "", value: "", secret: false }]);
  const removeEntry = (idx: number) => setConfigEntries((r) => r.filter((_, i) => i !== idx));

  const addCurrency = () => {
    const c = newCurrency.trim().toUpperCase();
    if (!c) return;
    if (currencies.includes(c)) {
      toast.error(`${c} already added`);
      return;
    }
    setCurrencies((cur) => [...cur, c]);
    setNewCurrency("");
  };
  const removeCurrency = (c: string) => setCurrencies((cur) => cur.filter((x) => x !== c));

  const handleSave = async () => {
    // Build the config object from the entries — skip rows with empty keys.
    const config: Record<string, string> = {};
    for (const entry of configEntries) {
      const key = entry.key.trim();
      if (!key) continue;
      // Skip sensitive fields that were left as the masked placeholder —
      // the admin didn't change them, so preserve the existing value.
      if (entry.secret && entry.value === "••••••••") continue;
      config[key] = entry.value;
    }

    setSaving(true);
    try {
      const res = await api.adminGatewayUpdate({
        id: gateway._id ?? gateway.id,
        name: name.trim() || undefined,
        config,
        supportedCurrencies: currencies,
      });
      toast.success(res.message || `${gateway.name} settings saved`);
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save gateway settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!gateway} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={16} />
            Configure {gateway.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Gateway Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
          </div>

          {/* Config key/value editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Configuration</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={addEntry}>
                <Plus size={12} /> Add field
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Credentials, account numbers, API keys, etc. Sensitive fields are masked.
            </p>
            <div className="space-y-2">
              {configEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <Input
                    value={entry.key}
                    onChange={(e) => updateEntry(idx, { key: e.target.value })}
                    placeholder="Field name (e.g. merchantId)"
                    className="text-xs flex-1"
                  />
                  <Input
                    type={entry.secret ? "password" : "text"}
                    value={entry.value}
                    onChange={(e) => updateEntry(idx, { value: e.target.value })}
                    placeholder={entry.secret ? "••••••••" : "Value"}
                    className="text-xs flex-1 font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => removeEntry(idx)}
                    title="Remove field"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Supported currencies */}
          <div className="space-y-2">
            <Label className="text-xs">Supported Currencies</Label>
            <div className="flex gap-2">
              <Input
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCurrency())}
                placeholder="e.g. PKR, USD"
                className="text-xs flex-1 uppercase"
                maxLength={6}
              />
              <Button variant="outline" size="sm" className="h-8 gap-1" onClick={addCurrency}>
                <Plus size={12} /> Add
              </Button>
            </div>
            {currencies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {currencies.map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px] gap-1">
                    {c}
                    <button onClick={() => removeCurrency(c)} className="hover:text-destructive">
                      <X size={10} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
