"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Search, Sparkles, DollarSign, TrendingUp, KeyRound, Send, Loader2, Trash2, Zap, ExternalLink, Copy } from "lucide-react";
import { api, formatPrice } from "@/lib/api-client";
import { toast } from "sonner";

export function AiToolsModule() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");

  // Fetch real AI tool products from the database
  const { data, isLoading } = useQuery({
    queryKey: ["ai-tools-products", search],
    queryFn: () => api.products({ search, category: "ai-tools", limit: 48 }),
    staleTime: 30_000,
  });

  const products = (data?.items || []).filter((p: any) =>
    p.type === "AI_TOOL" || p.category?.slug === "ai-tools"
  );

  const totalRevenue = products.reduce((s: number, p: any) => s + (p.salesCount || 0) * (p.effectivePrice || p.price), 0);
  const totalSales = products.reduce((s: number, p: any) => s + (p.salesCount || 0), 0);

  const stats = [
    { label: "AI Tools", value: String(products.length), icon: <Bot size={18} className="text-purple-500" />, bg: "bg-purple-50 dark:bg-purple-950" },
    { label: "Total Sales", value: String(totalSales), icon: <TrendingUp size={18} className="text-green-500" />, bg: "bg-green-50 dark:bg-green-950" },
    { label: "Revenue", value: formatPrice(totalRevenue), icon: <DollarSign size={18} className="text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-950" },
    { label: "Featured", value: String(products.filter((p: any) => p.featured).length), icon: <Sparkles size={18} className="text-amber-500" />, bg: "bg-amber-50 dark:bg-amber-950" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your AI tool products — ChatGPT, Midjourney, Claude, and more. Plus an AI Playground powered by the Vercel AI Gateway.
        </p>
      </div>

      {/* AI Playground — powered by the Vercel AI Gateway */}
      <AiGatewayPlayground />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search AI tools..."
          className="pl-9"
        />
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bot className="mx-auto mb-3 size-12 text-muted-foreground" />
            <p className="font-medium">No AI tools found</p>
            <p className="text-sm text-muted-foreground">
              Add AI tool products from the Products section
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("admin-navigate", { detail: "products" }));
              }}
            >
              Go to Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p: any) => (
            <Card key={p.id} className="overflow-hidden">
              {/* Cover image */}
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                {p.cover && (p.cover.startsWith("http") || p.cover.startsWith("data:")) ? (
                  <img src={p.cover} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bot className="size-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold line-clamp-1">{p.title}</h3>
                  {p.featured && (
                    <Badge className="bg-amber-400/20 text-amber-600 text-[9px] shrink-0">
                      ★ Featured
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {p.shortDescription || p.description || "AI tool product"}
                </p>
                {/* Variants */}
                {(() => {
                  let variants: string[] = [];
                  try {
                    const raw = (p as any).variants;
                    if (raw) variants = typeof raw === "string" ? JSON.parse(raw) : raw;
                  } catch {}
                  if (variants.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-1">
                      {variants.slice(0, 4).map((v) => (
                        <Badge key={v} variant="outline" className="text-[9px]">
                          {v}
                        </Badge>
                      ))}
                      {variants.length > 4 && (
                        <Badge variant="outline" className="text-[9px]">
                          +{variants.length - 4} more
                        </Badge>
                      )}
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {formatPrice(p.effectivePrice || p.price)}
                    </span>
                    {p.discountPrice && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        Rs {p.regularPrice || p.price}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[9px]">
                    {p.salesCount || 0} sold
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ["ai-tools-products"] });
            toast.success("Refreshed AI tools");
          }}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AiGatewayPlayground — Vercel AI Gateway (https://ai-gateway.vercel.sh/v1)
//
// OpenAI-compatible gateway that routes to many providers (OpenAI, Anthropic,
// Google, xAI, ...). Admin sets the API key once (stored in the DB), then can
// pick any gateway model and chat with it — responses stream token-by-token.
// ---------------------------------------------------------------------------

interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

function AiGatewayPlayground() {
  const qc = useQueryClient();
  const [keyInput, setKeyInput] = React.useState("");
  const [savingKey, setSavingKey] = React.useState(false);

  // Key status: is a gateway key configured?
  const { data: keyStatus, isLoading: keyLoading } = useQuery({
    queryKey: ["ai-gateway-key"],
    queryFn: () => api.aiKeyStatus(),
    staleTime: 30_000,
  });
  const configured = keyStatus?.configured === true;

  // Models list (only fetched once a key is set)
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ["ai-gateway-models"],
    queryFn: () => api.aiModels(),
    enabled: configured,
    staleTime: 60_000,
  });

  const [selectedModel, setSelectedModel] = React.useState("");
  const [systemPrompt, setSystemPrompt] = React.useState("You are a helpful assistant for the PlayBeat Digital store.");
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState("");
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-select the first model once the list loads.
  React.useEffect(() => {
    if (!selectedModel && modelsData?.models?.length) {
      setSelectedModel(String(modelsData.models[0].id));
    }
  }, [modelsData, selectedModel]);

  // Auto-scroll to the bottom as the stream progresses.
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText, streaming]);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) {
      toast.error("Paste your AI Gateway API key first");
      return;
    }
    setSavingKey(true);
    try {
      const res = await api.aiKeySet(keyInput.trim());
      toast.success(res.message || "AI Gateway API key saved");
      setKeyInput("");
      qc.invalidateQueries({ queryKey: ["ai-gateway-key"] });
      qc.invalidateQueries({ queryKey: ["ai-gateway-models"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save API key");
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearKey = async () => {
    if (!confirm("Remove the AI Gateway API key?")) return;
    try {
      const res = await api.aiKeyClear();
      toast.success(res.message || "API key cleared");
      setSelectedModel("");
      setMessages([]);
      qc.invalidateQueries({ queryKey: ["ai-gateway-key"] });
      qc.invalidateQueries({ queryKey: ["ai-gateway-models"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear API key");
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (!configured) {
      toast.error("Set your AI Gateway API key first");
      return;
    }
    if (!selectedModel) {
      toast.error("Pick a model first");
      return;
    }

    const userMsg: ChatMsg = { role: "user", content: text };
    const history: ChatMsg[] = [
      ...(systemPrompt.trim() ? [{ role: "system" as const, content: systemPrompt.trim() }] : []),
      ...messages,
      userMsg,
    ];
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamingText("");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: history,
          temperature: 0.7,
        }),
        signal: ac.signal,
      });

      if (!res.ok) {
        let msg = `Request failed (HTTP ${res.status})`;
        try {
          const j = await res.json();
          if (j?.error?.message) msg = j.error.message;
        } catch {}
        toast.error(msg);
        setStreaming(false);
        setStreamingText("");
        return;
      }

      // Parse the SSE stream. The gateway emits OpenAI-compatible chunks:
      //   data: {"choices":[{"delta":{"content":"Hello"}}]}
      //   data: [DONE]
      const reader = res.body?.getReader();
      if (!reader) {
        toast.error("No response stream");
        setStreaming(false);
        return;
      }
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE events are separated by double newlines.
        const parts = buffer.split("\n");
        buffer = parts.pop() || "";
        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) {
              acc += delta;
              setStreamingText(acc);
            }
          } catch {
            // Partial JSON across chunks — ignore, will complete on next read.
          }
        }
      }

      // Finalize: move the accumulated text into the messages list.
      const finalText = acc || "(empty response)";
      setMessages((m) => [...m, { role: "assistant", content: finalText }]);
      setStreamingText("");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // User cancelled — keep whatever we have so far as the assistant turn.
        if (streamingText) {
          setMessages((m) => [...m, { role: "assistant", content: streamingText + " (stopped)" }]);
        }
        toast.info("Generation stopped");
      } else {
        toast.error(e?.message || "Chat request failed");
      }
    } finally {
      setStreaming(false);
      setStreamingText("");
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleClearChat = () => {
    if (streaming) return;
    setMessages([]);
    setStreamingText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="border-purple-500/30">
      <CardHeader className="border-b bg-purple-50/50 dark:bg-purple-950/20">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap size={16} className="text-purple-500" />
            AI Playground
            <Badge variant="outline" className="text-[10px] font-normal">
              Vercel AI Gateway
            </Badge>
            {configured && (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                <span className="size-1.5 rounded-full bg-emerald-500 mr-1" /> Connected
              </Badge>
            )}
          </CardTitle>
          <a
            href="https://vercel.com/docs/ai-gateway"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ExternalLink size={11} /> Docs
          </a>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Key setup / status */}
        {keyLoading ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : !configured ? (
          <div className="space-y-2.5 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3.5">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <KeyRound size={14} /> Connect your Vercel AI Gateway
            </div>
            <p className="text-xs text-muted-foreground">
              Paste your AI Gateway API key from{" "}
              <a
                href="https://vercel.com/dashboard/~/ai-gateway"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5"
              >
                your Vercel dashboard <ExternalLink size={10} />
              </a>
              . It&apos;s stored in the database and used for all model requests.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-... or vck_..."
                className="font-mono text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
              />
              <Button onClick={handleSaveKey} disabled={savingKey} className="gap-1.5 shrink-0">
                {savingKey ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Save Key
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-2.5">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <KeyRound size={12} /> API key saved — models are ready.
            </p>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={handleClearKey}>
              Remove key
            </Button>
          </div>
        )}

        {/* Model picker + system prompt (only when configured) */}
        {configured && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={modelsLoading ? "Loading models…" : "Pick a model"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {modelsData?.models?.map((m: any) => (
                    <SelectItem key={String(m.id)} value={String(m.id)} className="text-xs">
                      <span className="font-mono">{String(m.id)}</span>
                      {m.provider && (
                        <span className="ml-2 text-[10px] text-muted-foreground">{String(m.provider)}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {modelsData?.error && (
                <p className="text-[11px] text-destructive">{modelsData.error}</p>
              )}
              {modelsData?.models?.length === 0 && !modelsData?.error && (
                <p className="text-[11px] text-muted-foreground">No models returned.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
                className="text-xs resize-none"
                placeholder="Set the assistant's behaviour…"
              />
            </div>
          </div>
        )}

        {/* Chat transcript */}
        {configured && (
          <div
            ref={scrollRef}
            className="max-h-96 overflow-y-auto rounded-lg border bg-background p-3 space-y-3"
          >
            {messages.length === 0 && !streaming ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Bot className="mx-auto mb-2 size-8 opacity-40" />
                Ask anything — responses stream in real time from {selectedModel || "the selected model"}.
              </div>
            ) : (
              messages.map((m, i) => <ChatBubble key={i} msg={m} />)
            )}
            {/* In-flight streaming bubble */}
            {streaming && (
              <ChatBubble
                msg={{ role: "assistant", content: streamingText || "…" }}
                streaming
              />
            )}
          </div>
        )}

        {/* Composer */}
        {configured && (
          <div className="space-y-2">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder={`Message ${selectedModel || "model"}…  (Enter to send, Shift+Enter for newline)`}
                className="text-sm resize-none"
                disabled={streaming}
              />
              <div className="flex flex-col gap-1.5 shrink-0">
                {streaming ? (
                  <Button variant="outline" onClick={handleStop} className="gap-1.5">
                    <Loader2 size={14} className="animate-spin" /> Stop
                  </Button>
                ) : (
                  <Button onClick={handleSend} disabled={!input.trim()} className="gap-1.5">
                    <Send size={14} /> Send
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleClearChat}
                  disabled={streaming || messages.length === 0}
                >
                  <Trash2 size={12} className="mr-1" /> Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChatBubble({ msg, streaming }: { msg: ChatMsg; streaming?: boolean }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  if (isSystem) {
    return (
      <div className="text-[11px] text-muted-foreground bg-muted/40 border rounded-md p-2 italic">
        <span className="font-medium not-italic">System:</span> {msg.content}
      </div>
    );
  }
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? "bg-purple-600 text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide opacity-70">Assistant</span>
            {!streaming && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(msg.content);
                  toast.success("Copied");
                }}
                className="opacity-50 hover:opacity-100"
                title="Copy"
              >
                <Copy size={11} />
              </button>
            )}
          </div>
        )}
        {msg.content}
        {streaming && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current animate-pulse align-middle" />}
      </div>
    </div>
  );
}
