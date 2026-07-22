"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, CreditCard, BarChart3, FileText, Image as ImageIcon, ExternalLink, RotateCcw, Menu, X, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const WP_NAV = [
  { key: "products", label: "Products", icon: Package, url: "/admin" },
  { key: "orders", label: "Orders", icon: ShoppingBag, url: "/admin" },
  { key: "customers", label: "Customers", icon: Users, url: "/admin" },
  { key: "payments", label: "Payments", icon: CreditCard, url: "/admin" },
  { key: "analytics", label: "Analytics", icon: BarChart3, url: "/admin" },
  { key: "content", label: "Content / CMS", icon: FileText, url: "/admin" },
  { key: "media", label: "Media Library", icon: ImageIcon, url: "/admin" },
  { key: "settings", label: "Settings", icon: Settings, url: "/admin" },
];

export function WordPressAdmin() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleReset = async () => {
    if (!confirm("RESET ALL DATA? This deletes orders, payments, expenses, notifications. Products preserved.")) return;
    try {
      const res = await fetch("/api/v1/admin/analytics/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) { toast.success("Reset complete"); window.location.reload(); }
    } catch { toast.error("Reset failed"); }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f0f1] text-[#1d2327]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 transform transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ background: "#1d2327" }}>
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded bg-[#2271b1] text-white text-xs font-bold">PB</div>
            <span className="text-white text-sm font-semibold">PlayBeat Digital</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-white/60 lg:hidden"><X className="size-5" /></button>
        </div>
        <nav className="mt-2 space-y-0.5 px-2">
          {WP_NAV.map((item) => { const Icon = item.icon; return (
            <button key={item.key} onClick={() => router.push(item.url)} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              <Icon className="size-4" />{item.label}
            </button>); })}
          <div className="my-3 border-t border-white/10" />
          <button onClick={() => router.push("/admin")} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-[#2271b1] hover:bg-white/10">
            <ExternalLink className="size-4" />Full Admin Panel
          </button>
          <button onClick={() => router.push("/")} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-white/50 hover:bg-white/10">
            <ExternalLink className="size-4" />View Store
          </button>
        </nav>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="flex-1 lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#dcdcde] bg-white px-4 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden"><Menu className="size-5" /></button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">PlayBeat Digital — WordPress Admin</span>
            <Badge className="bg-[#2271b1] text-[10px]">WC 8.6.1</Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-red-300 bg-red-50 text-red-600 hover:bg-red-100" onClick={handleReset}>
              <RotateCcw className="size-3.5" /><span className="hidden sm:inline">Reset All</span>
            </Button>
            <button className="relative"><Bell className="size-5 text-gray-500" /><span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-500" /></button>
          </div>
        </header>
        <main className="p-6">
          <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[{l:"Products",v:"29",c:"text-[#2271b1]"},{l:"Orders",v:"0",c:"text-green-600"},{l:"Revenue",v:"Rs 0",c:"text-[#2271b1]"},{l:"Customers",v:"1",c:"text-purple-600"}].map(s=>(
              <Card key={s.l} className="bg-white"><CardContent className="p-4"><p className="text-xs text-gray-500">{s.l}</p><p className={`mt-1 text-2xl font-bold ${s.c}`}>{s.v}</p></CardContent></Card>))}
          </div>
          <h2 className="mb-3 mt-6 text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WP_NAV.map(item=>{const Icon=item.icon;return(
              <button key={item.key} onClick={()=>router.push(item.url)} className="flex items-center gap-3 rounded-lg border border-[#dcdcde] bg-white p-4 text-left transition-colors hover:border-[#2271b1] hover:bg-[#f6f7f7]">
                <div className="grid size-10 place-items-center rounded-lg bg-[#2271b1]/10 text-[#2271b1]"><Icon className="size-5" /></div>
                <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-gray-500">Manage {item.label.toLowerCase()}</p></div>
              </button>);})}
          </div>
          <div className="mt-6 rounded-lg border border-[#dcdcde] bg-white p-4">
            <h3 className="text-sm font-semibold">WordPress + WooCommerce Status</h3>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-gray-500">WordPress</p><p className="font-medium">6.5.2</p></div>
              <div><p className="text-xs text-gray-500">WooCommerce</p><p className="font-medium">8.6.1</p></div>
              <div><p className="text-xs text-gray-500">REST API</p><p className="font-medium text-green-600">Active</p></div>
              <div><p className="text-xs text-gray-500">Store URL</p><p className="font-medium">playbeat.digital</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <a href="/wp-json" target="_blank" className="text-[#2271b1] hover:underline">REST API</a><span>|</span>
              <a href="/wp-json/wc/v3/products" target="_blank" className="text-[#2271b1] hover:underline">WC Products</a><span>|</span>
              <a href="/wp-json/wc/store/v1/products" target="_blank" className="text-[#2271b1] hover:underline">Store API</a><span>|</span>
              <a href="/wp-login.php" className="text-[#2271b1] hover:underline">WP Login</a><span>|</span>
              <a href="/xmlrpc.php" className="text-[#2271b1] hover:underline">XML-RPC</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
