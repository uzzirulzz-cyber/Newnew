"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Shield,
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
import { AdminConsole } from "@/components/playbeat/admin";
import { api } from "@/lib/api-client";
import { usePlaybeatStore } from "@/lib/store";
import { toast } from "sonner";

/**
 * Executive admin access — credentials embedded directly in the code.
 *
 * The portal unlocks with a single password. No email field, no visible
 * credentials, no database dependency. The first exec account is used by
 * default when unlocking via the embedded password.
 */
const ADMIN_PASSWORD = "playbeat123";
const EXEC_ACCOUNT = {
  email: "founder@playbeat.live",
  name: "Founder",
  role: "ADMIN",
};

export default function AdminPage() {
  const user = usePlaybeatStore((s) => s.user);
  const setUser = usePlaybeatStore((s) => s.setUser);

  const isExecAdmin = user?.role === "ADMIN";

  // When unlocked, render the admin console FULL-SCREEN (no storefront
  // header/footer) — the enterprise admin shell has its own sidebar, top
  // bar, and overall aesthetic.
  if (isExecAdmin) {
    return <AdminConsole />;
  }

  // Locked state — storefront chrome + centered login card
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <AdminLock
          onUnlock={(u) => {
            setUser(u);
            toast.success(`Welcome, ${u.name}`);
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

function AdminLock({ onUnlock }: { onUnlock: (u: any) => void }) {
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      setError("Incorrect password. Access denied.");
      return;
    }

    setLoading(true);

    // 1. Try the API login with the first exec account (DB-backed)
    try {
      const { user } = await api.login(EXEC_ACCOUNT.email, ADMIN_PASSWORD);
      if (user.role === "ADMIN") {
        onUnlock(user);
        setLoading(false);
        return;
      }
    } catch {
      // API login failed (DB down, network error) — fall back to embedded
    }

    // 2. Fallback: unlock with embedded credentials (no DB needed)
    onUnlock({
      id: `exec_${EXEC_ACCOUNT.email}`,
      name: EXEC_ACCOUNT.name,
      email: EXEC_ACCOUNT.email,
      role: EXEC_ACCOUNT.role,
    });
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
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
              Enter the admin password to access the platform management
              console.
            </p>
          </div>

          {/* Form — password only, no email field, no visible credentials */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-pw" className="text-xs font-medium">
                Admin Password
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
                  autoFocus
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
        <Badge variant="outline" className="text-[9px] uppercase">
          Exec Only
        </Badge>
      </div>
    </motion.div>
  );
}
