"use client";

import * as React from "react";
import { use } from "react";
import {
  Tv,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CredentialData {
  name: string;
  plan: string;
  expiresAt: string;
  username: string | null;
  password: string | null;
  portalUrl: string | null;
  m3uUrl: string | null;
  notes: string | null;
}

export default function IptvCredentialViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = React.useState<CredentialData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/iptv/credentials/${token}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.success || !json?.data) {
          setNotFound(true);
        } else {
          setData(json.data as CredentialData);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8 sm:py-12">
        {/* Brand header */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
            <Tv className="size-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Play<span className="text-orange-400">Beat</span>
          </span>
        </div>

        {loading ? (
          <LoadingCard />
        ) : notFound ? (
          <NotFoundCard />
        ) : (
          data && (
            <CredentialsCard
              data={data}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((v) => !v)}
            />
          )
        )}

        <footer className="mt-8 text-center text-[11px] text-muted-foreground">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="size-3" />
            Keep these credentials private. PlayBeat will never ask for them.
          </p>
          <p className="mt-1">© {new Date().getFullYear()} PlayBeat Inc.</p>
        </footer>
      </main>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-3 pt-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-red-500/10">
        <AlertCircle className="size-7 text-red-400" />
      </div>
      <h1 className="text-lg font-semibold">Credentials not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This share link is invalid or has been revoked. Please contact your provider
        for a new link.
      </p>
    </div>
  );
}

function CredentialsCard({
  data,
  showPassword,
  onTogglePassword,
}: {
  data: CredentialData;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  const expired = (() => {
    if (!data.expiresAt) return false;
    const d = new Date(data.expiresAt);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  })();

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
            <Tv className="size-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold leading-tight">
              {data.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-medium text-orange-300">
                <Sparkles className="size-3" />
                {data.plan}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  expired
                    ? "bg-red-500/15 text-red-300"
                    : "bg-emerald-500/15 text-emerald-300",
                )}
              >
                <Calendar className="size-3" />
                {expired ? "Expired" : "Expires"} {data.expiresAt || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your IPTV login
        </p>

        <CopyField
          icon={<KeyRound className="size-4 text-amber-400" />}
          label="Username"
          value={data.username}
        />

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-amber-400" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Password
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                onClick={onTogglePassword}
                disabled={!data.password}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="size-3.5" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5" /> Show
                  </>
                )}
              </Button>
              <CopyButton value={data.password || ""} label="Password" disabled={!data.password} />
            </div>
          </div>
          <p
            className={cn(
              "mt-1.5 font-mono text-sm break-all",
              !data.password && "text-muted-foreground",
            )}
          >
            {data.password
              ? showPassword
                ? data.password
                : "•".repeat(Math.min(12, Math.max(8, data.password.length)))
              : "—"}
          </p>
        </div>

        <CopyField
          icon={<ExternalLink className="size-4 text-blue-400" />}
          label="Portal URL"
          value={data.portalUrl}
          link={data.portalUrl || undefined}
        />

        {data.m3uUrl && (
          <CopyField
            icon={<ExternalLink className="size-4 text-emerald-400" />}
            label="M3U URL"
            value={data.m3uUrl}
            link={data.m3uUrl}
          />
        )}

        {data.notes && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-300">
              Notes from your provider
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyField({
  icon,
  label,
  value,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  link?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        <CopyButton value={value || ""} label={label} disabled={!value} />
      </div>
      {link && value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 block truncate text-sm text-blue-400 hover:underline"
          title={value}
        >
          {value}
        </a>
      ) : (
        <p
          className={cn(
            "mt-1.5 truncate text-sm",
            !value && "text-muted-foreground",
          )}
          title={value || undefined}
        >
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function CopyButton({
  value,
  label,
  disabled,
}: {
  value: string;
  label: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1 px-2 text-xs"
      disabled={disabled}
      onClick={copy}
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-400" /> Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" /> Copy
        </>
      )}
    </Button>
  );
}
