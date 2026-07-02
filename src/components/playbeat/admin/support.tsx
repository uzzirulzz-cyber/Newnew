"use client";

import * as React from "react";
import {
  Headphones,
  MessageSquare,
  Plus,
  Send,
  Paperclip,
  Smile,
  HelpCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  ModuleHeader,
  SearchInput,
  StatPill,
  StatusBadge,
  notifyMock,
  notifyComingSoon,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRIORITY_COLOR: Record<string, string> = {
  high: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  medium: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  low: "border-blue-500/30 bg-blue-500/15 text-blue-300",
};

const TICKETS = [
  { id: "t1", subject: "Netflix subscription not activating", customer: "Ahmed Raza", email: "ahmed@example.com", priority: "high", status: "open", channel: "WhatsApp", updated: "12 min ago", messages: 4 },
  { id: "t2", subject: "Refund for duplicate charge — order #PB-1024", customer: "Sarah Khan", email: "sarah@example.com", priority: "high", status: "open", channel: "Email", updated: "1 hour ago", messages: 2 },
  { id: "t3", subject: "How do I download my ChatGPT Plus access?", customer: "Mike Johnson", email: "mike@example.com", priority: "low", status: "pending", channel: "Live Chat", updated: "2 hours ago", messages: 1 },
  { id: "t4", subject: "IPTV channels not loading on Smart TV", customer: "Bilal Hassan", email: "bilal@example.com", priority: "medium", status: "open", channel: "WhatsApp", updated: "4 hours ago", messages: 6 },
  { id: "t5", subject: "Coupon WELCOME10 not working", customer: "Aisha Malik", email: "aisha@example.com", priority: "medium", status: "resolved", channel: "Email", updated: "1 day ago", messages: 3 },
  { id: "t6", subject: "Bulk pricing for office team (20+ licenses)", customer: "David Lee", email: "david@example.com", priority: "low", status: "open", channel: "Email", updated: "1 day ago", messages: 1 },
];

const FAQS = [
  { id: "f1", q: "How long does delivery take?", a: "Most products are delivered instantly via email. Subscriptions activate within 5–10 minutes of payment.", views: 4820, helpful: 92 },
  { id: "f2", q: "What payment methods do you accept?", a: "We accept Lemon Squeezy (cards, Apple Pay, Google Pay), JazzCash, EasyPaisa, and crypto (BTC/USDT).", views: 3840, helpful: 88 },
  { id: "f3", q: "Can I get a refund?", a: "Yes — see our refund policy. Eligible cases include non-delivery, defective keys, or duplicate charges.", views: 2810, helpful: 76 },
  { id: "f4", q: "Do you support multiple devices?", a: "Subscription plans include concurrent stream limits (2–6 devices depending on tier).", views: 1820, helpful: 84 },
  { id: "f5", q: "How do I contact support?", a: "WhatsApp +92 332 102 9333, email info@playbeat.digital, or use the live chat (24/7).", views: 1240, helpful: 96 },
];

const LIVE_CHAT = [
  { from: "customer", name: "Ahmed Raza", text: "Hi, I purchased Netflix Premium 30 minutes ago but haven't received anything.", time: "10:42" },
  { from: "agent", name: "Support Agent", text: "Hi Ahmed! Let me check your order. Can you share the order number?", time: "10:43" },
  { from: "customer", name: "Ahmed Raza", text: "It's PB-1042", time: "10:43" },
  { from: "agent", name: "Support Agent", text: "Found it. The payment is confirmed but the auto-delivery webhook failed. I'm resending your license now.", time: "10:45" },
  { from: "customer", name: "Ahmed Raza", text: "Got it! Thank you so much 🙏", time: "10:46" },
];

export function SupportModule() {
  const [activeTicket, setActiveTicket] = React.useState("t1");
  const [reply, setReply] = React.useState("");
  const [search, setSearch] = React.useState("");

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Customer Support"
        description="Tickets, live chat, FAQs, and knowledge base"
        icon={Headphones}
        actions={
          <>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Opening knowledge base editor")}>
              <HelpCircle className="size-4" /> Knowledge Base
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => notifyComingSoon("Create ticket")}>
              <Plus className="size-4" /> New Ticket
            </Button>
          </>
        }
      />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatPill label="Open Tickets" value="14" accent="amber" />
        <StatPill label="Avg Response" value="8m" accent="green" />
        <StatPill label="Resolved (30d)" value="384" accent="blue" />
        <StatPill label="CSAT Score" value="94%" accent="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ticket list */}
        <AdminCard className="lg:col-span-1">
          <AdminCardHeader title="Tickets" icon={MessageSquare} />
          <div className="p-3 space-y-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search tickets…"
              className="mb-2"
            />
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pb-scrollbar">
              {TICKETS.filter((t) => !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase())).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTicket(t.id)}
                  className={cn(
                    "w-full text-left rounded-lg p-3 border transition-colors",
                    activeTicket === t.id
                      ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500/40 text-white"
                      : "border-transparent text-white/70 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium line-clamp-1">{t.subject}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">{t.customer}</div>
                    </div>
                    <span className={cn("text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded border shrink-0", PRIORITY_COLOR[t.priority])}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/40">
                    <span>{t.channel}</span>
                    <span>{t.updated} · {t.messages} msgs</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </AdminCard>

        {/* Conversation */}
        <AdminCard className="lg:col-span-2">
          <AdminCardHeader
            title={TICKETS.find((t) => t.id === activeTicket)?.subject || "Ticket"}
            icon={MessageSquare}
            description={`Customer: ${TICKETS.find((t) => t.id === activeTicket)?.customer || ""}`}
            action={<StatusBadge status={TICKETS.find((t) => t.id === activeTicket)?.status || "open"} />}
          />
          <div className="p-0">
            <div className="max-h-[400px] overflow-y-auto pb-scrollbar p-4 space-y-3">
              {LIVE_CHAT.map((m, i) => (
                <div key={i} className={cn("flex", m.from === "agent" && "justify-end")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2",
                    m.from === "agent"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-white/10 text-white",
                  )}>
                    <div className="text-[10px] opacity-70 mb-0.5">{m.name} · {m.time}</div>
                    <div className="text-xs">{m.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 p-3">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply…"
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none mb-2"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-7 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => notifyMock("Attaching file")}>
                    <Paperclip className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => notifyComingSoon("Emoji picker")}>
                    <Smile className="size-3.5" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyMock("Marking ticket resolved")}>
                    <CheckCircle2 className="size-3.5" /> Resolve
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => { notifyMock("Reply sent"); setReply(""); }}>
                    <Send className="size-3.5" /> Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Channels + FAQ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Support channels */}
        <AdminCard>
          <AdminCardHeader title="Support Channels" icon={Headphones} />
          <div className="p-4 space-y-2.5">
            {[
              { icon: MessageSquare, name: "Live Chat", value: "24/7 active", count: "8 online", color: "from-blue-600 to-blue-500" },
              { icon: Mail, name: "Email", value: "info@playbeat.digital", count: "Avg 4h reply", color: "from-purple-600 to-purple-500" },
              { icon: Phone, name: "WhatsApp", value: "+92 332 102 9333", count: "Avg 8m reply", color: "from-emerald-600 to-emerald-500" },
              { icon: Clock, name: "Status", value: "All channels operational", count: "Uptime 99.9%", color: "from-amber-600 to-amber-500" },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className={cn("grid size-9 place-items-center rounded-lg bg-gradient-to-br text-white shrink-0", c.color)}>
                  <c.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{c.name}</div>
                  <div className="text-xs text-white/50">{c.value}</div>
                </div>
                <span className="text-[10px] text-white/40">{c.count}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* FAQ manager */}
        <AdminCard className="lg:col-span-2">
          <AdminCardHeader
            title="FAQ Manager"
            icon={HelpCircle}
            description="Frequently asked questions"
            action={
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => notifyComingSoon("FAQ editor")}>
                <Plus className="size-3.5" /> Add FAQ
              </Button>
            }
          />
          <div className="p-0">
            <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto pb-scrollbar">
              {FAQS.map((f) => (
                <div key={f.id} className="p-4 hover:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white">{f.q}</div>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">{f.a}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-white/60">{f.views} views</div>
                      <div className="text-xs text-emerald-300">{f.helpful}% helpful</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
