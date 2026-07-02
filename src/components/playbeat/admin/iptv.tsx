"use client";

import * as React from "react";
import {
  Tv,
  Upload,
  Server,
  Radio,
  Film,
  Music,
  Newspaper,
  Baby,
  Trophy,
  PlayCircle,
  Activity,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  StatusBadge,
  notifyComingSoon,
  notifyMock,
  StatPill,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "All Channels", icon: Radio, count: 4128, active: true },
  { name: "Sports", icon: Trophy, count: 842, active: false },
  { name: "Movies", icon: Film, count: 1208, active: false },
  { name: "Series", icon: PlayCircle, count: 956, active: false },
  { name: "Kids", icon: Baby, count: 312, active: false },
  { name: "News", icon: Newspaper, count: 287, active: false },
  { name: "Music", icon: Music, count: 412, active: false },
  { name: "Radio", icon: Radio, count: 111, active: false },
];

const SERVERS = [
  { name: "EU-West-1 (Frankfurt)", region: "Europe", status: "operational", load: 42, channels: 1240, uptime: "99.98%" },
  { name: "US-East-1 (Virginia)", region: "North America", status: "operational", load: 38, channels: 1180, uptime: "99.95%" },
  { name: "Asia-1 (Singapore)", region: "Asia", status: "operational", load: 61, channels: 1024, uptime: "99.91%" },
  { name: "ME-1 (Dubai)", region: "Middle East", status: "pending", load: 24, channels: 684, uptime: "98.42%" },
];

const CHANNELS = [
  { name: "ESPN HD", category: "Sports", viewers: 12480, quality: "1080p", status: "live" },
  { name: "Sky Sports Premier", category: "Sports", viewers: 9240, quality: "4K", status: "live" },
  { name: "HBO Premium", category: "Movies", viewers: 18420, quality: "4K HDR", status: "live" },
  { name: "Disney Channel", category: "Kids", viewers: 7120, quality: "1080p", status: "live" },
  { name: "CNN International", category: "News", viewers: 5340, quality: "1080p", status: "live" },
  { name: "MTV Live", category: "Music", viewers: 2840, quality: "1080p", status: "live" },
  { name: "Nat Geo Wild", category: "Series", viewers: 4120, quality: "4K", status: "live" },
  { name: "BBC One HD", category: "Series", viewers: 8720, quality: "1080p", status: "live" },
];

export function IptvModule() {
  const [activeCat, setActiveCat] = React.useState("All Channels");

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="IPTV Management"
        description="Manage live channels, streaming servers, and playlists"
        icon={Tv}
        actions={
          <>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("Upload M3U playlist")}>
              <Upload className="size-4" /> Upload M3U
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Add Xtream Codes")}>
              <Plus className="size-4" /> Add Xtream
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Total Channels" value="4,128" accent="blue" />
        <StatPill label="Active Servers" value="4" accent="green" />
        <StatPill label="Live Viewers" value="68,420" accent="purple" />
        <StatPill label="Avg Bitrate" value="6.4 Mbps" accent="cyan" />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Categories sidebar */}
        <AdminCard className="lg:col-span-1">
          <AdminCardHeader title="Categories" icon={Radio} />
          <div className="p-3 space-y-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => setActiveCat(c.name)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  activeCat === c.name
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-blue-500/40"
                    : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <c.icon className="size-4" />
                  {c.name}
                </span>
                <span className="text-xs text-white/50">{c.count}</span>
              </button>
            ))}
          </div>
        </AdminCard>

        {/* Channels grid */}
        <div className="lg:col-span-3 space-y-4">
          <AdminCard>
            <AdminCardHeader
              title={activeCat}
              icon={Tv}
              description="Live channel grid"
              action={
                <Button variant="ghost" size="sm" className="text-blue-300 hover:text-blue-200" onClick={() => notifyMock("Channels refreshed")}>
                  <RefreshCw className="size-3.5" /> Refresh
                </Button>
              }
            />
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.name}
                  className="group rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer"
                  onClick={() => notifyMock(`Previewing ${ch.name}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold">
                      {ch.name.slice(0, 2).toUpperCase()}
                    </div>
                    <Badge variant="outline" className="text-[9px] border-rose-500/30 bg-rose-500/15 text-rose-300">
                      ● LIVE
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-white">{ch.name}</div>
                    <div className="text-[10px] text-white/50">{ch.category} · {ch.quality}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-white/40">
                    <Activity className="size-3" />
                    {ch.viewers.toLocaleString()} viewers
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Server health */}
          <AdminCard>
            <AdminCardHeader
              title="Streaming Servers"
              icon={Server}
              description="Real-time edge node health"
            />
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {SERVERS.map((s) => (
                <div key={s.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{s.name}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">{s.region}</div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-white/50">Channels</div>
                      <div className="text-sm font-semibold text-white">{s.channels}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50">Load</div>
                      <div className={cn(
                        "text-sm font-semibold",
                        s.load > 70 ? "text-rose-300" : s.load > 50 ? "text-amber-300" : "text-emerald-300",
                      )}>{s.load}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50">Uptime</div>
                      <div className="text-sm font-semibold text-white">{s.uptime}</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        s.load > 70 ? "bg-rose-500" : s.load > 50 ? "bg-amber-500" : "bg-emerald-500",
                      )}
                      style={{ width: `${s.load}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Playlist stats */}
      <AdminCard>
        <AdminCardHeader title="Playlist Sources" icon={Upload} description="Connected M3U / Xtream sources" />
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "Main Provider", type: "M3U URL", channels: 2480, status: "active" },
            { name: "Backup EU", type: "Xtream Codes", channels: 1240, status: "active" },
            { name: "Local CDN", type: "M3U File", channels: 408, status: "inactive" },
          ].map((p) => (
            <div key={p.name} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">{p.name}</div>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-[10px] text-white/50 mt-1">{p.type}</div>
              <div className="text-xs text-blue-300 mt-2">{p.channels.toLocaleString()} channels</div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
