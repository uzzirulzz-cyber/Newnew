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
import { AdminConsole } from "@/components/playbeat/admin";
import { api } from "@/lib/api-client";
import { usePlaybeatStore } from "@/lib/store";
import { toast } from "sonner";

const ADMIN_PASSWORD = "playbeat123";
const EXEC_ACCOUNT = {
  email: "founder@playbeat.live",
  name: "Founder",
  role: "ADMIN",
};

export default function WpAdminPage() {
  const user = usePlaybeatStore((s) => s.user);
  const setUser = usePlaybeatStore((s) => s.setUser);
  const isExecAdmin = user?.role === "ADMIN";

  if (isExecAdmin) {
    return <AdminConsole />;
  }

  return (
    <AdminLock
      onUnlock={(u) => {
        setUser(u);
      }}
    />
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
    try {
      const { user } = await api.login(EXEC_ACCOUNT.email, ADMIN_PASSWORD);
      if (user.role === "ADMIN") {
        onUnlock(user);
        setLoading(false);
      } else {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
      }
    } catch {
      // Fallback: unlock without DB login
      onUnlock({
        id: "exec-local",
        name: EXEC_ACCOUNT.name,
        email: EXEC_ACCOUNT.email,
        role: "ADMIN",
      });
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a14] p-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0a0a14] to-blue-900/20" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <LogoMark size={48} />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="pb-text-silver">play</span>
              <span className="text-accent">beat</span>
              <span className="pb-text-silver">.digital</span>
            </h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        {/* Lock card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 grid size-14 place-items-center rounded-full bg-purple-500/15">
              <Shield className="size-7 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">RESTRICTED ACCESS</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin Portal
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Enter the admin password to access the platform management console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter password"
                  className="pl-9 pr-10"
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
    </div>
  );
}
