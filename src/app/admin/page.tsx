"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Shield,
  Mail,
  KeyRound,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/playbeat/logo";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { AdminConsole } from "@/components/playbeat/admin-console";
import { api } from "@/lib/api-client";
import { usePlaybeatStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EXEC_EMAILS = [
  "founder@playbeat.live",
  "ceo@playbeat.live",
  "director@playbeat.live",
];

export default function AdminPage() {
  const user = usePlaybeatStore((s) => s.user);
  const setUser = usePlaybeatStore((s) => s.setUser);

  // Show admin console if already signed in as an exec admin
  const isExecAdmin =
    user?.role === "ADMIN" &&
    EXEC_EMAILS.includes(user.email.toLowerCase());

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {isExecAdmin ? (
          <div className="w-full">
            <AdminConsole />
          </div>
        ) : (
          <AdminLock
            onUnlock={(u) => {
              setUser(u);
              toast.success(`Welcome, ${u.name}`);
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function AdminLock({ onUnlock }: { onUnlock: (u: any) => void }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!EXEC_EMAILS.includes(normalizedEmail)) {
      setError("Access denied. This portal is restricted to executive accounts.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await api.login(normalizedEmail, password);
      if (user.role !== "ADMIN") {
        setError("This account does not have admin access.");
        setLoading(false);
        return;
      }
      onUnlock(user);
    } catch {
      setError("Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-card/80 pb-card-glow backdrop-blur-xl">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

        <div className="p-8">
          {/* Logo + lock icon */}
          <div className="flex flex-col items-center gap-3 text-center">
            <LogoMark size={56} />
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Restricted Access
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Admin Portal
            </h1>
            <p className="max-w-xs text-sm text-muted-foreground">
              This area is locked. Sign in with an executive account to manage
              the platform.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-medium">
                Executive Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@playbeat.live"
                  className="h-11 pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-pw" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full gap-2 text-sm font-semibold"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Shield className="size-4" />
                  Unlock Admin Access
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3 text-primary" /> Secure
        </span>
        <span className="flex items-center gap-1">
          <Lock className="size-3 text-accent" /> Encrypted
        </span>
        <span className="flex items-center gap-1">
          <Badge variant="outline" className="text-[9px] uppercase">
            Exec Only
          </Badge>
        </span>
      </div>
    </motion.div>
  );
}
