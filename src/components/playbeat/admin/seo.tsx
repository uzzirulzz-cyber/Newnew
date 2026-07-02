"use client";

import * as React from "react";
import {
  Search,
  Globe,
  Save,
  Plus,
  Trash2,
  Edit3,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle2,
  FileText,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REDIRECTS = [
  { from: "/old/netflix", to: "/netflix-premium", type: "301", hits: 142, status: "active" },
  { from: "/blog/old-post", to: "/blog/new-post", type: "301", hits: 38, status: "active" },
  { from: "/promo-2024", to: "/", type: "302", hits: 0, status: "inactive" },
  { from: "/vendor-signup", to: "/admin", type: "301", hits: 88, status: "active" },
];

const BROKEN_LINKS = [
  { url: "/blog/removed-article", code: "404", found: "2 days ago", status: "broken" },
  { url: "/products/old-sku-123", code: "404", found: "5 hours ago", status: "broken" },
  { url: "/external/dead-link", code: "503", found: "1 week ago", status: "broken" },
];

export function SeoModule() {
  const [robots, setRobots] = React.useState(
    `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /checkout

Sitemap: https://playbeat.digital/sitemap.xml`,
  );
  const [autoSitemap, setAutoSitemap] = React.useState(true);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="SEO"
        description="Meta tags, sitemaps, redirects, and broken link monitoring"
        icon={Search}
        actions={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("SEO settings saved")}>
            <Save className="size-4" /> Save All
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Indexed Pages" value="248" accent="green" />
        <StatPill label="Sitemap URLs" value="312" accent="blue" />
        <StatPill label="Redirects" value="42" accent="purple" />
        <StatPill label="Broken Links" value="3" accent="pink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Meta fields */}
        <AdminCard className="lg:col-span-2">
          <AdminCardHeader
            title="Default Meta Tags"
            icon={Globe}
            description="Applied to all pages unless overridden"
          />
          <div className="p-4 space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Site Title</Label>
              <Input
                defaultValue="PlayBeat Digital — Premium Digital Marketplace"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Meta Description</Label>
              <Textarea
                defaultValue="Buy premium digital products — Netflix, ChatGPT Plus, Claude Pro, Disney+, HBO Max, and more. Instant delivery, secure payments, 24/7 support."
                rows={2}
                className="bg-white/5 border-white/10 text-white resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">OG Image URL</Label>
                <Input
                  defaultValue="/og-image.png"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Twitter Handle</Label>
                <Input
                  defaultValue="@playbeatdigital"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Keywords (comma-separated)</Label>
              <Input
                defaultValue="netflix subscription, chatgpt plus, ai tools, iptv, premium accounts, digital products"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Canonical URL</Label>
                <Input
                  defaultValue="https://playbeat.digital"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Robots Tag</Label>
                <Select defaultValue="index,follow">
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index,follow">index, follow</SelectItem>
                    <SelectItem value="noindex,follow">noindex, follow</SelectItem>
                    <SelectItem value="index,nofollow">index, nofollow</SelectItem>
                    <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Sitemap status */}
        <div className="space-y-4">
          <AdminCard>
            <AdminCardHeader title="Sitemap Status" icon={FileText} />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <CheckCircle2 className="size-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium text-white">sitemap.xml — OK</div>
                  <div className="text-xs text-white/50">312 URLs · last generated 2h ago</div>
                </div>
              </div>
              <ToggleRow
                label="Auto-regenerate"
                description="Rebuild sitemap daily"
                checked={autoSitemap}
                onChange={(c) => { setAutoSitemap(c); notifyMock("Sitemap auto-regen toggled"); }}
              />
              <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Sitemap regenerated")}>
                Regenerate Now
              </Button>
              <Button size="sm" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Submitting to Google Search Console")}>
                Submit to Google
              </Button>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="robots.txt" icon={FileText} />
            <div className="p-4 space-y-2">
              <Textarea
                value={robots}
                onChange={(e) => setRobots(e.target.value)}
                rows={8}
                className="bg-white/5 border-white/10 text-white font-mono text-xs resize-none"
              />
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyMock("robots.txt saved")}>
                Save robots.txt
              </Button>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Redirect manager */}
      <AdminCard>
        <AdminCardHeader
          title="Redirect Manager"
          icon={LinkIcon}
          description="URL redirects to preserve SEO"
          action={
            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("Add redirect")}>
              <Plus className="size-3.5" /> Add Redirect
            </Button>
          }
        />
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">From</TableHead>
                <TableHead className="text-white/60">To</TableHead>
                <TableHead className="text-white/60">Type</TableHead>
                <TableHead className="text-white/60 text-right">Hits</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REDIRECTS.map((r, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-blue-300">{r.from}</TableCell>
                  <TableCell className="font-mono text-xs text-white">{r.to}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">{r.type}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-white/80">{r.hits}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-7 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => notifyMock("Editing redirect")}>
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-rose-300 hover:bg-rose-500/10" onClick={() => notifyMock("Redirect deleted")}>
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

      {/* Broken links */}
      <AdminCard>
        <AdminCardHeader
          title="Broken Link Checker"
          icon={AlertTriangle}
          description="Links returning 4xx/5xx errors"
        />
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">URL</TableHead>
                <TableHead className="text-white/60">Status Code</TableHead>
                <TableHead className="text-white/60">Found</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BROKEN_LINKS.map((b, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-mono text-xs text-rose-300">{b.url}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">{b.code}</span>
                  </TableCell>
                  <TableCell className="text-xs text-white/50">{b.found}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Adding redirect…")}>
                      Add Redirect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>
    </div>
  );
}
