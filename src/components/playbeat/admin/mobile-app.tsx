"use client";

import * as React from "react";
import {
  Smartphone,
  Apple,
  Bot,
  Image as ImageIcon,
  Link2,
  Send,
  Upload,
  Save,
  Eye,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatPill,
  StatusBadge,
  notifyMock,
  notifyComingSoon,
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
import { cn } from "@/lib/utils";

const APPS = [
  {
    id: "android",
    name: "Android App",
    icon: Bot,
    version: "v2.4.1",
    build: "1024",
    status: "published",
    installs: "12,480",
    rating: "4.7",
    accent: "from-emerald-600 to-emerald-500",
  },
  {
    id: "ios",
    name: "iOS App",
    icon: Apple,
    version: "v2.4.0",
    build: "1020",
    status: "in_review",
    installs: "8,420",
    rating: "4.8",
    accent: "from-blue-600 to-blue-500",
  },
];

export function MobileAppModule() {
  const [pushTitle, setPushTitle] = React.useState("");
  const [pushBody, setPushBody] = React.useState("");
  const [pushAudience, setPushAudience] = React.useState("all");

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Mobile App"
        description="Manage your iOS and Android applications"
        icon={Smartphone}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Build new version")}>
            <Upload className="size-4" /> New Build
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Total Installs" value="20,900" accent="blue" />
        <StatPill label="Active (30d)" value="14,210" accent="green" />
        <StatPill label="Avg Rating" value="4.7 ★" accent="purple" />
        <StatPill label="Crash Rate" value="0.12%" accent="pink" />
      </div>

      {/* App cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {APPS.map((app) => (
          <AdminCard key={app.id} className="hover:border-blue-500/30 transition-colors">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("grid size-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", app.accent)}>
                    <app.icon className="size-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{app.name}</div>
                    <div className="text-xs text-white/50 mt-0.5">Version {app.version} · Build {app.build}</div>
                  </div>
                </div>
                <StatusBadge status={app.status} label={app.status.replace("_", " ")} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-white/10 bg-white/5 py-2">
                  <div className="text-[10px] text-white/50 uppercase">Installs</div>
                  <div className="text-sm font-bold text-white">{app.installs}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 py-2">
                  <div className="text-[10px] text-white/50 uppercase">Rating</div>
                  <div className="text-sm font-bold text-amber-300">{app.rating} ★</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 py-2">
                  <div className="text-[10px] text-white/50 uppercase">Size</div>
                  <div className="text-sm font-bold text-white">{app.id === "android" ? "28 MB" : "32 MB"}</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock(`Viewing ${app.name} release notes`)}>
                  Release Notes
                </Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock(`Uploading new ${app.name} build`)}>
                  <Upload className="size-3.5" /> Upload Build
                </Button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Push notification composer */}
        <AdminCard className="lg:col-span-2">
          <AdminCardHeader
            title="Push Notification"
            icon={Send}
            description="Send a push to all installed devices"
          />
          <div className="p-4 space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Title</Label>
              <Input
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="🎉 Limited time offer!"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Body</Label>
              <Textarea
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                placeholder="Get 50% off all streaming subscriptions. Tap to shop now."
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Audience</Label>
                <Select value={pushAudience} onValueChange={setPushAudience}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users (14,210)</SelectItem>
                    <SelectItem value="android">Android only (8,920)</SelectItem>
                    <SelectItem value="ios">iOS only (5,290)</SelectItem>
                    <SelectItem value="vip">VIP customers (148)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Schedule</Label>
                <Select defaultValue="now">
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send now</SelectItem>
                    <SelectItem value="1h">In 1 hour</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow 9 AM</SelectItem>
                    <SelectItem value="custom">Custom date/time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock(`Push notification sent to ${pushAudience}`)}>
                <Send className="size-3.5" /> Send Push
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Test push sent to your device")}>
                <Eye className="size-3.5" /> Send Test
              </Button>
            </div>
          </div>
        </AdminCard>

        {/* Splash screen */}
        <AdminCard>
          <AdminCardHeader
            title="Splash Screen"
            icon={ImageIcon}
            description="App launch screen"
          />
          <div className="p-4 space-y-3">
            <div className="grid place-items-center aspect-[9/16] rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-black to-slate-900 p-4">
              <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-extrabold text-2xl shadow-lg">
                PB
              </div>
              <div className="mt-4 text-xs text-white/60">PlayBeat Digital</div>
            </div>
            <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Upload splash screen")}>
              <Upload className="size-3.5" /> Replace Splash
            </Button>
          </div>
        </AdminCard>
      </div>

      {/* Deep links */}
      <AdminCard>
        <AdminCardHeader
          title="Deep Link Configuration"
          icon={Link2}
          description="Universal links / app links"
        />
        <div className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">iOS Universal Link</Label>
              <Input
                defaultValue="applinks.com.playbeat.digital"
                readOnly
                className="bg-white/5 border-white/10 text-blue-300 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Android App Link</Label>
              <Input
                defaultValue="https://playbeat.digital/.well-known/assetlinks.json"
                readOnly
                className="bg-white/5 border-white/10 text-blue-300 font-mono text-xs"
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60 mb-2">Registered deep link paths</div>
            <div className="space-y-1.5">
              {[
                { path: "/product/:slug", screen: "ProductDetail" },
                { path: "/category/:slug", screen: "CategoryList" },
                { path: "/order/:id", screen: "OrderDetail" },
                { path: "/admin", screen: "AdminPanel" },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <code className="text-blue-300 font-mono">{d.path}</code>
                  <span className="text-white/60">→ {d.screen}</span>
                </div>
              ))}
            </div>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("Deep link config saved")}>
            <Save className="size-3.5" /> Save Configuration
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}
