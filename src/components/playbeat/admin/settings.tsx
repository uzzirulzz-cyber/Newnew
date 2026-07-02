"use client";

import * as React from "react";
import {
  Settings,
  Save,
  Building,
  Palette,
  Mail,
  MessageSquare,
  Database,
  Cloud,
  Languages,
  DollarSign,
  Receipt,
  Globe,
  Upload,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  ToggleRow,
  notifyMock,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function SettingsModule() {
  const [tab, setTab] = React.useState("general");

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Settings"
        description="Configure your marketplace — branding, payments, taxes, and more"
        icon={Settings}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("All settings saved")}>
            <Save className="size-4" /> Save All
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 rounded-xl border border-white/10 bg-white/5">
          {[
            { v: "general", label: "General", icon: Building },
            { v: "branding", label: "Branding", icon: Palette },
            { v: "smtp", label: "SMTP", icon: Mail },
            { v: "sms", label: "SMS", icon: MessageSquare },
            { v: "storage", label: "Storage", icon: Database },
            { v: "cdn", label: "CDN", icon: Cloud },
            { v: "languages", label: "Languages", icon: Languages },
            { v: "currency", label: "Currency", icon: DollarSign },
            { v: "taxes", label: "Taxes", icon: Receipt },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className={cn(
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/60 hover:text-white px-3 py-1.5 text-xs gap-1.5",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="Site Information" icon={Building} />
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              <Field label="Site Name" defaultValue="PlayBeat Digital" />
              <Field label="Tagline" defaultValue="Premium Digital Marketplace" />
              <Field label="Support Email" defaultValue="info@playbeat.digital" />
              <Field label="WhatsApp Number" defaultValue="+92 332 102 9333" />
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-white/70">Description</Label>
                <Textarea
                  defaultValue="Buy premium digital products — streaming, AI tools, games, gift cards, and more. Instant delivery, secure payments, 24/7 support."
                  rows={2}
                  className="bg-white/5 border-white/10 text-white resize-none"
                />
              </div>
              <Field label="Timezone" defaultValue="Asia/Karachi" />
              <Field label="Date Format" defaultValue="MMM D, YYYY" />
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Platform Modes" icon={Settings} />
            <div className="p-4 grid gap-3 md:grid-cols-2">
              <ToggleRow label="Maintenance mode" description="Temporarily disable checkout" checked={false} onChange={() => notifyMock("Maintenance toggled")} />
              <ToggleRow label="Storefront registration" description="Allow new customer signups" checked={true} onChange={() => notifyMock("Registration toggled")} />
              <ToggleRow label="Vendor applications" description="Accept new vendor applications" checked={false} onChange={() => notifyMock("Vendor apps toggled")} />
              <ToggleRow label="Beta features" description="Enable experimental features" checked={true} onChange={() => notifyMock("Beta features toggled")} />
            </div>
          </AdminCard>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="Brand Assets" icon={Palette} />
            <div className="p-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-white/70">Logo (Light)</Label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid size-12 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">PB</div>
                  <div className="flex-1 text-xs text-white/50">logo-light.png · 4.2 KB</div>
                  <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Upload logo")}>
                    <Upload className="size-3.5" /> Upload
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/70">Logo (Dark)</Label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid size-12 place-items-center rounded-lg bg-white text-slate-900 font-bold">PB</div>
                  <div className="flex-1 text-xs text-white/50">logo-dark.png · 4.0 KB</div>
                  <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Upload logo")}>
                    <Upload className="size-3.5" /> Upload
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/70">Favicon</Label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid size-8 place-items-center rounded-md bg-blue-600 text-white text-xs">P</div>
                  <div className="flex-1 text-xs text-white/50">favicon.ico · 8 KB</div>
                  <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Upload favicon")}>
                    <Upload className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/70">OG Image</Label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid size-12 place-items-center rounded-lg bg-gradient-to-br from-blue-600/40 to-purple-600/40 text-white text-[10px]">1200×630</div>
                  <div className="flex-1 text-xs text-white/50">og-image.png · 184 KB</div>
                  <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Upload OG image")}>
                    <Upload className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Theme Colors" icon={Palette} />
            <div className="p-4 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Primary", color: "#3b82f6", name: "Blue 500" },
                { label: "Accent", color: "#8b5cf6", name: "Purple 500" },
                { label: "Success", color: "#10b981", name: "Emerald 500" },
                { label: "Danger", color: "#f43f5e", name: "Rose 500" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-md border border-white/20" style={{ backgroundColor: c.color }} />
                    <div>
                      <div className="text-xs font-medium text-white">{c.label}</div>
                      <div className="text-[10px] text-white/50">{c.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="Email Server (SMTP)" icon={Mail} description="Configure transactional & marketing email" />
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              <Field label="SMTP Host" defaultValue="smtp.gmail.com" />
              <Field label="Port" defaultValue="587" />
              <Field label="Username" defaultValue="noreply@playbeat.digital" />
              <Field label="Password" defaultValue="••••••••••••" type="password" />
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Encryption</Label>
                <Select defaultValue="tls">
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="From Email" defaultValue="noreply@playbeat.digital" />
              <Field label="From Name" defaultValue="PlayBeat Digital" />
              <Field label="Reply-To" defaultValue="info@playbeat.digital" />
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("Test email sent")}>
                <Mail className="size-3.5" /> Send Test Email
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("SMTP settings saved")}>
                <Save className="size-3.5" /> Save
              </Button>
            </div>
          </AdminCard>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="SMS Gateway" icon={MessageSquare} description="Twilio configuration for SMS & WhatsApp" />
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              <Field label="Twilio Account SID" defaultValue="AC••••••••••••••••••" />
              <Field label="Twilio Auth Token" defaultValue="••••••••••••" type="password" />
              <Field label="From Number" defaultValue="+1 415 555 0123" />
              <Field label="WhatsApp Business ID" defaultValue="••••••••••••" />
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("Test SMS sent")}>
                <MessageSquare className="size-3.5" /> Send Test SMS
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("SMS settings saved")}>
                <Save className="size-3.5" /> Save
              </Button>
            </div>
          </AdminCard>
        </TabsContent>

        {/* Storage */}
        <TabsContent value="storage" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="Storage Provider" icon={Database} description="Where uploaded files live" />
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Provider</Label>
                <Select defaultValue="s3">
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local filesystem</SelectItem>
                    <SelectItem value="s3">AWS S3</SelectItem>
                    <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                    <SelectItem value="azure">Azure Blob</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Bucket" defaultValue="pb-assets" />
              <Field label="Region" defaultValue="ap-south-1" />
              <Field label="Access Key" defaultValue="AKIA••••••••••" />
              <Field label="Secret Key" defaultValue="••••••••••••" type="password" />
              <Field label="Public URL" defaultValue="https://cdn.playbeat.digital" />
            </div>
          </AdminCard>
        </TabsContent>

        {/* CDN */}
        <TabsContent value="cdn" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="CDN Configuration" icon={Cloud} />
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Provider</Label>
                <Select defaultValue="cloudflare">
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="fastly">Fastly</SelectItem>
                    <SelectItem value="cloudfront">AWS CloudFront</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Zone ID" defaultValue="abc123def456" />
              <Field label="API Token" defaultValue="••••••••••••" type="password" />
              <Field label="Edge URL" defaultValue="https://cdn.playbeat.digital" />
              <div className="sm:col-span-2 grid gap-3 md:grid-cols-2">
                <ToggleRow label="Auto-purge on deploy" description="Invalidate cache after each release" checked={true} onChange={() => notifyMock("Auto-purge toggled")} />
                <ToggleRow label="Bot fight mode" description="Block malicious bots at edge" checked={true} onChange={() => notifyMock("Bot fight toggled")} />
              </div>
            </div>
          </AdminCard>
        </TabsContent>

        {/* Languages */}
        <TabsContent value="languages" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="Languages" icon={Languages} description="Available storefront languages" />
            <div className="p-4 space-y-2">
              {[
                { code: "en", name: "English", native: "English", active: true, default: true },
                { code: "ur", name: "Urdu", native: "اردو", active: true, default: false },
                { code: "ar", name: "Arabic", native: "العربية", active: false, default: false },
                { code: "hi", name: "Hindi", native: "हिन्दी", active: false, default: false },
                { code: "es", name: "Spanish", native: "Español", active: false, default: false },
              ].map((l) => (
                <div key={l.code} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-md bg-white/10 text-xs font-bold uppercase text-white">{l.code}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{l.name} <span className="text-white/50">· {l.native}</span></div>
                      {l.default && <span className="text-[10px] text-blue-300">Default</span>}
                    </div>
                  </div>
                  <ToggleRow label="" checked={l.active} onChange={() => notifyMock(`${l.name} toggled`)} />
                </div>
              ))}
            </div>
          </AdminCard>
        </TabsContent>

        {/* Currency */}
        <TabsContent value="currency" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="Currency" icon={DollarSign} description="Display currency & conversion rates" />
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Display Currency</Label>
                <Select defaultValue="PKR">
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="PKR">PKR — Pakistani Rupee</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="USD → PKR rate" defaultValue="280" />
              <Field label="Currency Symbol" defaultValue="Rs" />
              <Field label="Decimal Places" defaultValue="0" />
              <div className="sm:col-span-2">
                <ToggleRow label="Auto-detect by IP" description="Switch currency based on visitor location" checked={true} onChange={() => notifyMock("Auto-detect toggled")} />
              </div>
            </div>
          </AdminCard>
        </TabsContent>

        {/* Taxes */}
        <TabsContent value="taxes" className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="Tax Configuration" icon={Receipt} description="VAT, GST, and sales tax rules" />
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              <ToggleRow label="Auto-collect tax" description="Calculate tax based on customer country" checked={true} onChange={() => notifyMock("Auto-collect toggled")} />
              <ToggleRow label="Show prices incl. tax" description="Display tax-inclusive prices on storefront" checked={true} onChange={() => notifyMock("Tax-inclusive toggled")} />
              <Field label="Default Tax Rate (%)" defaultValue="0" />
              <Field label="Tax ID / NTN" defaultValue="NTN-7842016-3" />
            </div>
          </AdminCard>
          <AdminCard>
            <AdminCardHeader title="Regional Tax Rules" icon={Globe} />
            <div className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left p-3 text-white/60 text-xs">Country</th>
                    <th className="text-left p-3 text-white/60 text-xs">Type</th>
                    <th className="text-right p-3 text-white/60 text-xs">Rate</th>
                    <th className="text-right p-3 text-white/60 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { country: "Pakistan", type: "GST", rate: "17%", status: "active" },
                    { country: "United Kingdom", type: "VAT", rate: "20%", status: "active" },
                    { country: "Germany", type: "VAT", rate: "19%", status: "active" },
                    { country: "United States", type: "Sales Tax", rate: "Varies", status: "inactive" },
                    { country: "UAE", type: "VAT", rate: "5%", status: "active" },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white">{r.country}</td>
                      <td className="p-3 text-white/70">{r.type}</td>
                      <td className="p-3 text-right text-white">{r.rate}</td>
                      <td className="p-3 text-right">
                        <span className={cn("text-[10px] uppercase font-semibold", r.status === "active" ? "text-emerald-300" : "text-white/40")}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue?: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-white/70">{label}</Label>
      <Input
        type={type}
        defaultValue={defaultValue}
        className="bg-white/5 border-white/10 text-white"
      />
    </div>
  );
}
