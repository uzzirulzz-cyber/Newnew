"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Save,
  Globe,
  Palette,
  Mail,
  MessageSquare,
  HardDrive,
  Cloud,
  Languages,
  DollarSign,
  Receipt,
  Store,
  Server,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "general", label: "General", icon: Store },
  { value: "branding", label: "Branding", icon: Palette },
  { value: "smtp", label: "SMTP", icon: Mail },
  { value: "sms", label: "SMS", icon: MessageSquare },
  { value: "storage", label: "Storage", icon: HardDrive },
  { value: "cdn", label: "CDN", icon: Cloud },
  { value: "languages", label: "Languages", icon: Languages },
  { value: "currency", label: "Currency", icon: DollarSign },
  { value: "taxes", label: "Taxes", icon: Receipt },
];

export function AdminSettings() {
  const [saving, setSaving] = React.useState(false);

  // General settings
  const [general, setGeneral] = React.useState({
    siteName: "PlayBeat Digital",
    tagline: "Premium Digital Marketplace",
    email: "info@playbeat.digital",
    phone: "+92 332 102 9333",
    description:
      "Buy premium digital products — streaming, AI tools, games, gift cards, and more. Instant delivery, secure payments, 24/7 support.",
    timezone: "Asia/Karachi",
    dateFormat: "MMM D, YYYY",
    maintenance: false,
    registration: true,
    vendorApps: false,
    beta: false,
  });

  // Branding
  const [branding, setBranding] = React.useState({
    primaryColor: "#2563eb",
    accentColor: "#06b6d4",
    logoUrl: "/logo.png",
    faviconUrl: "/favicon.png",
    customCss: "",
  });

  // SMTP
  const [smtp, setSmtp] = React.useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    fromEmail: "noreply@playbeat.digital",
    fromName: "PlayBeat Digital",
    encryption: "tls",
  });

  // SMS
  const [sms, setSms] = React.useState({
    provider: "twilio",
    apiKey: "",
    apiSecret: "",
    fromNumber: "",
    senderId: "PLAYBEAT",
  });

  // Storage
  const [storage, setStorage] = React.useState({
    provider: "local",
    s3Bucket: "",
    s3Region: "us-east-1",
    s3AccessKey: "",
    s3SecretKey: "",
    maxFileSize: "100",
  });

  // CDN
  const [cdn, setCdn] = React.useState({
    provider: "cloudflare",
    apiKey: "",
    zoneId: "",
    cacheTtl: "3600",
    purgeOnDeploy: true,
  });

  // Languages
  const [languages, setLanguages] = React.useState({
    default: "en",
    enabled: ["en", "ur"],
    available: [
      { code: "en", name: "English" },
      { code: "ur", name: "Urdu" },
      { code: "ar", name: "Arabic" },
      { code: "hi", name: "Hindi" },
      { code: "fr", name: "French" },
      { code: "es", name: "Spanish" },
      { code: "de", name: "German" },
      { code: "tr", name: "Turkish" },
    ],
  });

  // Currency
  const [currency, setCurrency] = React.useState({
    default: "PKR",
    position: "before",
    symbol: "Rs",
    rate: "280",
    enabled: ["PKR", "USD"],
    available: [
      { code: "PKR", name: "Pakistani Rupee", symbol: "Rs" },
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "GBP", name: "British Pound", symbol: "£" },
      { code: "AED", name: "UAE Dirham", symbol: "AED" },
      { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
    ],
  });

  // Taxes
  const [taxes, setTaxes] = React.useState({
    enabled: false,
    defaultRate: "0",
    inclusive: true,
    regions: [
      { country: "Pakistan", rate: "0", type: "GST" },
      { country: "European Union", rate: "19", type: "VAT" },
      { country: "United Kingdom", rate: "20", type: "VAT" },
      { country: "United States", rate: "0", type: "Sales Tax" },
    ],
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all 9 setting groups to the DB
      await api.adminSettingsPut({
        general,
        branding,
        smtp,
        sms,
        storage,
        cdn,
        languages,
        currency,
        taxes,
      });
      // Also keep localStorage in sync (for the storefront hook)
      try {
        const now = new Date().toISOString();
        const all = { general, branding, smtp, sms, storage, cdn, languages, currency, taxes };
        localStorage.setItem("admin-settings", JSON.stringify(all));
        localStorage.setItem("admin-settings-saved-at", now);
        setLastSaved(now);
      } catch {}
      refreshSiteSettings();
      toast.success("All settings saved successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Load persisted settings from DB on mount (fall back to localStorage)
  React.useEffect(() => {
    (async () => {
      try {
        const result = await api.adminSettingsGet();
        const s = result.settings || {};
        if (s.general) setGeneral((g) => ({ ...g, ...s.general }));
        if (s.branding) setBranding((b) => ({ ...b, ...s.branding }));
        if (s.smtp) setSmtp((sm) => ({ ...sm, ...s.smtp }));
        if (s.sms) setSms((sm) => ({ ...sm, ...s.sms }));
        if (s.storage) setStorage((st) => ({ ...st, ...s.storage }));
        if (s.cdn) setCdn((c) => ({ ...c, ...s.cdn }));
        if (s.languages) setLanguages((l) => ({ ...l, ...s.languages }));
        if (s.currency) setCurrency((c) => ({ ...c, ...s.currency }));
        if (s.taxes) setTaxes((t) => ({ ...t, ...s.taxes }));
        return;
      } catch {
        // DB not available — fall back to localStorage
      }
      try {
        const raw = localStorage.getItem("admin-settings");
        const savedAt = localStorage.getItem("admin-settings-saved-at");
        if (savedAt) setLastSaved(savedAt);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.general) setGeneral((g) => ({ ...g, ...saved.general }));
          if (saved.branding) setBranding((b) => ({ ...b, ...saved.branding }));
          if (saved.smtp) setSmtp((s) => ({ ...s, ...saved.smtp }));
          if (saved.sms) setSms((s) => ({ ...s, ...saved.sms }));
          if (saved.storage) setStorage((s) => ({ ...s, ...saved.storage }));
          if (saved.cdn) setCdn((c) => ({ ...c, ...saved.cdn }));
          if (saved.languages) setLanguages((l) => ({ ...l, ...saved.languages }));
          if (saved.currency) setCurrency((c) => ({ ...c, ...saved.currency }));
          if (saved.taxes) setTaxes((t) => ({ ...t, ...saved.taxes }));
        }
      } catch {}
    })();
  }, []);

  const toggleLanguage = (code: string) => {
    setLanguages((prev) => ({
      ...prev,
      enabled: prev.enabled.includes(code)
        ? prev.enabled.filter((c) => c !== code)
        : [...prev.enabled, code],
    }));
  };

  const toggleCurrency = (code: string) => {
    setCurrency((prev) => ({
      ...prev,
      enabled: prev.enabled.includes(code)
        ? prev.enabled.filter((c) => c !== code)
        : [...prev.enabled, code],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg">
          <SettingsIcon className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your marketplace — branding, payments, taxes, and more
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 pb-neon">
          {saving ? "Saving..." : "Save All"}
          <Save className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 border-b border-white/10 bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
            >
              <t.icon className="size-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="size-4" /> Site Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Site Name" value={general.siteName} onChange={(v) => setGeneral({ ...general, siteName: v })} />
              <Field label="Tagline" value={general.tagline} onChange={(v) => setGeneral({ ...general, tagline: v })} />
              <Field label="Email" value={general.email} onChange={(v) => setGeneral({ ...general, email: v })} />
              <Field label="Phone" value={general.phone} onChange={(v) => setGeneral({ ...general, phone: v })} />
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={general.description}
                  onChange={(e) => setGeneral({ ...general, description: e.target.value })}
                  className="min-h-[80px] border-white/10 bg-white/5"
                />
              </div>
              <SelectField label="Timezone" value={general.timezone} onChange={(v) => setGeneral({ ...general, timezone: v })}
                options={["Asia/Karachi", "UTC", "America/New_York", "Europe/London", "Asia/Dubai", "Asia/Tokyo"]} />
              <SelectField label="Date Format" value={general.dateFormat} onChange={(v) => setGeneral({ ...general, dateFormat: v })}
                options={["MMM D, YYYY", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="size-4" /> Platform Modes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <ToggleRow title="Maintenance mode" desc="Temporarily disable checkout" checked={general.maintenance}
                onChange={(v) => { setGeneral({ ...general, maintenance: v }); toast.success(`Maintenance mode ${v ? "enabled" : "disabled"}`); }} />
              <ToggleRow title="Storefront registration" desc="Allow new customer signups" checked={general.registration}
                onChange={(v) => { setGeneral({ ...general, registration: v }); toast.success(`Registration ${v ? "enabled" : "disabled"}`); }} />
              <ToggleRow title="Vendor applications" desc="Accept new vendor applications" checked={general.vendorApps}
                onChange={(v) => { setGeneral({ ...general, vendorApps: v }); toast.success(`Vendor applications ${v ? "enabled" : "disabled"}`); }} />
              <ToggleRow title="Beta features" desc="Enable experimental features" checked={general.beta}
                onChange={(v) => { setGeneral({ ...general, beta: v }); toast.success(`Beta features ${v ? "enabled" : "disabled"}`); }} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="size-4" /> Brand Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    className="size-10 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
                  <Input value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    className="border-white/10 bg-white/5 font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={branding.accentColor} onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                    className="size-10 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
                  <Input value={branding.accentColor} onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                    className="border-white/10 bg-white/5 font-mono text-xs" />
                </div>
              </div>
              <Field label="Logo URL" value={branding.logoUrl} onChange={(v) => setBranding({ ...branding, logoUrl: v })} />
              <Field label="Favicon URL" value={branding.faviconUrl} onChange={(v) => setBranding({ ...branding, faviconUrl: v })} />
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Custom CSS</Label>
                <Textarea value={branding.customCss} onChange={(e) => setBranding({ ...branding, customCss: e.target.value })}
                  placeholder="/* Add custom styles */" className="min-h-[120px] border-white/10 bg-white/5 font-mono text-xs" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4" /> Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="SMTP Host" value={smtp.host} onChange={(v) => setSmtp({ ...smtp, host: v })} placeholder="smtp.gmail.com" />
              <Field label="Port" value={smtp.port} onChange={(v) => setSmtp({ ...smtp, port: v })} placeholder="587" />
              <Field label="Username" value={smtp.username} onChange={(v) => setSmtp({ ...smtp, username: v })} placeholder="user@gmail.com" />
              <Field label="Password" value={smtp.password} onChange={(v) => setSmtp({ ...smtp, password: v })} type="password" placeholder="••••••••" />
              <Field label="From Email" value={smtp.fromEmail} onChange={(v) => setSmtp({ ...smtp, fromEmail: v })} />
              <Field label="From Name" value={smtp.fromName} onChange={(v) => setSmtp({ ...smtp, fromName: v })} />
              <SelectField label="Encryption" value={smtp.encryption} onChange={(v) => setSmtp({ ...smtp, encryption: v })}
                options={["tls", "ssl", "none"]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="size-4" /> SMS Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Provider" value={sms.provider} onChange={(v) => setSms({ ...sms, provider: v })}
                options={["twilio", "nexmo", "vonage", "jazzcash", "easypaisa"]} />
              <Field label="Sender ID" value={sms.senderId} onChange={(v) => setSms({ ...sms, senderId: v })} />
              <Field label="API Key" value={sms.apiKey} onChange={(v) => setSms({ ...sms, apiKey: v })} type="password" />
              <Field label="API Secret" value={sms.apiSecret} onChange={(v) => setSms({ ...sms, apiSecret: v })} type="password" />
              <Field label="From Number" value={sms.fromNumber} onChange={(v) => setSms({ ...sms, fromNumber: v })} placeholder="+1234567890" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* STORAGE */}
        <TabsContent value="storage" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="size-4" /> File Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Provider" value={storage.provider} onChange={(v) => setStorage({ ...storage, provider: v })}
                options={["local", "aws-s3", "digitalocean", "cloudinary", "firebase"]} />
              {storage.provider !== "local" && (
                <>
                  <Field label="Bucket" value={storage.s3Bucket} onChange={(v) => setStorage({ ...storage, s3Bucket: v })} />
                  <Field label="Region" value={storage.s3Region} onChange={(v) => setStorage({ ...storage, s3Region: v })} />
                  <Field label="Access Key" value={storage.s3AccessKey} onChange={(v) => setStorage({ ...storage, s3AccessKey: v })} type="password" />
                  <Field label="Secret Key" value={storage.s3SecretKey} onChange={(v) => setStorage({ ...storage, s3SecretKey: v })} type="password" />
                </>
              )}
              <Field label="Max File Size (MB)" value={storage.maxFileSize} onChange={(v) => setStorage({ ...storage, maxFileSize: v })} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CDN */}
        <TabsContent value="cdn" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cloud className="size-4" /> CDN Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Provider" value={cdn.provider} onChange={(v) => setCdn({ ...cdn, provider: v })}
                options={["cloudflare", "aws-cloudfront", "bunny", "fastly", "none"]} />
              <Field label="API Key" value={cdn.apiKey} onChange={(v) => setCdn({ ...cdn, apiKey: v })} type="password" />
              <Field label="Zone ID" value={cdn.zoneId} onChange={(v) => setCdn({ ...cdn, zoneId: v })} />
              <Field label="Cache TTL (seconds)" value={cdn.cacheTtl} onChange={(v) => setCdn({ ...cdn, cacheTtl: v })} />
              <div className="col-span-2">
                <ToggleRow title="Purge on deploy" desc="Automatically purge CDN cache when deploying" checked={cdn.purgeOnDeploy}
                  onChange={(v) => setCdn({ ...cdn, purgeOnDeploy: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LANGUAGES */}
        <TabsContent value="languages" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Languages className="size-4" /> Language Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SelectField label="Default Language" value={languages.default} onChange={(v) => setLanguages({ ...languages, default: v })}
                options={languages.available.map((l) => l.code)} />
              <div>
                <Label className="mb-2 text-xs">Enabled Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {languages.available.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        languages.enabled.includes(lang.code)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                      )}
                    >
                      <span className="font-mono text-xs">{lang.code.toUpperCase()}</span>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CURRENCY */}
        <TabsContent value="currency" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="size-4" /> Currency Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SelectField label="Default Currency" value={currency.default} onChange={(v) => setCurrency({ ...currency, default: v })}
                  options={currency.available.map((c) => c.code)} />
                <SelectField label="Symbol Position" value={currency.position} onChange={(v) => setCurrency({ ...currency, position: v })}
                  options={["before", "after"]} />
                <Field label="USD → PKR Rate" value={currency.rate} onChange={(v) => setCurrency({ ...currency, rate: v })} />
              </div>
              <div>
                <Label className="mb-2 text-xs">Enabled Currencies</Label>
                <div className="flex flex-wrap gap-2">
                  {currency.available.map((cur) => (
                    <button
                      key={cur.code}
                      onClick={() => toggleCurrency(cur.code)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        currency.enabled.includes(cur.code)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                      )}
                    >
                      <span className="font-bold">{cur.symbol}</span>
                      {cur.code} — {cur.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAXES */}
        <TabsContent value="taxes" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="size-4" /> Tax Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow title="Enable tax collection" desc="Collect tax on checkout based on customer region"
                checked={taxes.enabled} onChange={(v) => setTaxes({ ...taxes, enabled: v })} />
              <ToggleRow title="Tax inclusive pricing" desc="Product prices already include tax"
                checked={taxes.inclusive} onChange={(v) => setTaxes({ ...taxes, inclusive: v })} />
              <Field label="Default Tax Rate (%)" value={taxes.defaultRate} onChange={(v) => setTaxes({ ...taxes, defaultRate: v })} />
              <div>
                <Label className="mb-2 text-xs">Regional Tax Rates</Label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
                        <th className="pb-2">Region</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Rate (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxes.regions.map((r, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-2.5">{r.country}</td>
                          <td className="py-2.5">
                            <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                          </td>
                          <td className="py-2.5">
                            <Input
                              value={r.rate}
                              onChange={(e) => {
                                const regions = [...taxes.regions];
                                regions[i] = { ...regions[i], rate: e.target.value };
                                setTaxes({ ...taxes, regions });
                              }}
                              className="h-8 w-20 border-white/10 bg-white/5 text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

/* ─── Reusable field components ─── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-white/10 bg-white/5"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-white/10 bg-white/5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-white/5">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
