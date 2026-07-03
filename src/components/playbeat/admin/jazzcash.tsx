"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Settings,
  ExternalLink,
  RefreshCw,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function AdminJazzCash() {
  const [testAmount, setTestAmount] = React.useState("100");
  const [testLoading, setTestLoading] = React.useState(false);
  const [merchantId, setMerchantId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [salt, setSalt] = React.useState("");
  const [sandbox, setSandbox] = React.useState(true);

  const handleTestPayment = async () => {
    setTestLoading(true);
    try {
      const result = await api.jazzcashCreate({
        amount: Number(testAmount),
        description: "Test payment from PlayBeat admin",
        billReference: `TEST-${Date.now()}`,
      });
      // Build a form and submit to the JazzCash gateway
      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.gatewayUrl;
      for (const [key, value] of Object.entries(result.params)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      toast.success(`Redirecting to JazzCash ${result.sandbox ? "sandbox" : "live"}...`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "JazzCash not configured");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-red-600 to-orange-600 shadow-lg">
          <Smartphone className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">JazzCash</h1>
          <p className="text-sm text-muted-foreground">
            Live Pakistani payment gateway — accept JazzCash wallet, card, and bank transfers
          </p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-red-500/15">
              <CreditCard className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gateway</p>
              <p className="font-bold">JazzCash</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-amber-500/15">
              <Settings className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mode</p>
              <p className="font-bold">{sandbox ? "Sandbox" : "Live"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-green-500/15">
              <Phone className="size-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="font-bold">PKR (Pakistani Rupee)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" /> Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Merchant ID</Label>
              <Input
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="MCxxxxx"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="xxxxxx"
                className="border-white/10 bg-white/5"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Integrity Salt (Hash Key)</Label>
            <Input
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="border-white/10 bg-white/5"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium">Sandbox Mode</p>
              <p className="text-xs text-muted-foreground">
                Test with JazzCash sandbox before going live
              </p>
            </div>
            <Switch checked={sandbox} onCheckedChange={setSandbox} />
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs font-medium text-amber-400">
              ⚙️ To activate, add these to your <code>.env</code> file:
            </p>
            <pre className="mt-2 overflow-x-auto text-[10px] text-muted-foreground">
{`JAZZCASH_MERCHANT_ID=${merchantId || "your_merchant_id"}
JAZZCASH_PASSWORD=${password ? "***" : "your_password"}
JAZZCASH_INTEGRITY_SALT=${salt ? "***" : "your_salt"}
JAZZCASH_SANDBOX=${sandbox ? "true" : "false"}
JAZZCASH_RETURN_URL=https://playbeat.live/api/v1/payments/jazzcash/return
JAZZCASH_POSTBACK_URL=https://playbeat.live/api/v1/payments/jazzcash/webhook`}
            </pre>
          </div>
          <Button
            className="w-full"
            onClick={() => toast.message("Save the .env vars and restart the server to activate")}
          >
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Test payment */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4" /> Test Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Initiate a test transaction to verify your JazzCash integration.
            You&apos;ll be redirected to the JazzCash payment page.
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rs
              </span>
              <Input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="border-white/10 bg-white/5 pl-9"
                placeholder="100"
              />
            </div>
            <Button
              onClick={handleTestPayment}
              disabled={testLoading || !testAmount}
              className="gap-2"
            >
              {testLoading ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Test Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration URLs */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base">Integration URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Return URL (Redirect)", url: "https://playbeat.live/api/v1/payments/jazzcash/return" },
            { label: "Postback URL (IPN Webhook)", url: "https://playbeat.live/api/v1/payments/jazzcash/webhook" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <code className="mt-1 block break-all text-xs text-blue-400">
                {item.url}
              </code>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          "JazzCash Wallet",
          "Debit/Credit Cards",
          "Bank Transfer",
          "Mobile Balance",
        ].map((f) => (
          <Card key={f} className="border-white/10 bg-white/5">
            <CardContent className="flex items-center gap-2 p-3">
              <CheckCircle2 className="size-4 text-green-400" />
              <span className="text-xs font-medium">{f}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
