"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus, Users, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api-client";

interface WcCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  source: "local" | "woocommerce";
  wcCustomerId?: number;
}

export function WooCommerceAccount() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["woocommerce-account"],
    queryFn: () => api.woocommerceAccountStatus(),
    staleTime: 30_000,
  });

  const customers = data?.customers || [];
  const available = data?.available ?? false;
  const storeUrl = data?.storeUrl || "";

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      api.woocommerceAccountLogin(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Logged in successfully");
    },
    onError: (e: Error) => toast.error(`Login failed: ${e.message}`),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => api.woocommerceAccountCreate(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Customer account created");
      qc.invalidateQueries({ queryKey: ["woocommerce-account"] });
    },
    onError: (e: Error) => toast.error(`Create failed: ${e.message}`),
  });

  return (
    <Card className="border-purple-500/30 bg-purple-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag size={16} className="text-purple-500" />
          WooCommerce Customer Accounts
          <Badge variant={available ? "default" : "secondary"} className="ml-1 text-[10px]">
            {available ? "WC Connected" : "Local Mode"}
          </Badge>
        </CardTitle>
        {available && storeUrl && (
          <p className="text-xs text-muted-foreground">
            Store: <span className="font-mono">{storeUrl}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              <LogIn className="size-3.5" /> Login
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-1">
              <UserPlus className="size-3.5" /> Create Account
            </TabsTrigger>
          </TabsList>

          {/* Login tab */}
          <TabsContent value="login" className="mt-4">
            <LoginForm
              saving={loginMutation.isPending}
              onSubmit={(email, password) => loginMutation.mutate({ email, password })}
            />
          </TabsContent>

          {/* Create account tab */}
          <TabsContent value="create" className="mt-4">
            <CreateForm
              saving={createMutation.isPending}
              onSubmit={(firstName, lastName, email, password) =>
                createMutation.mutate({ firstName, lastName, email, password })
              }
            />
          </TabsContent>
        </Tabs>

        {/* Customers list */}
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2">
            <Users size={14} className="text-muted-foreground" />
            <h4 className="text-sm font-semibold">Registered Customers</h4>
            <Badge variant="secondary" className="text-[10px]">
              {customers.length}
            </Badge>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : customers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No customers registered yet. Create one above to get started.
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {customers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") || c.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={c.source === "woocommerce" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {c.source === "woocommerce" ? "WC Synced" : "Local"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoginForm({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (email: string, password: string) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="wc-email" className="text-xs">Email</Label>
        <Input
          id="wc-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
        />
      </div>
      <div>
        <Label htmlFor="wc-password" className="text-xs">Password</Label>
        <Input
          id="wc-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button
        className="w-full"
        disabled={saving || !email.trim() || !password}
        onClick={() => onSubmit(email.trim(), password)}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Login
      </Button>
    </div>
  );
}

function CreateForm({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => void;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const passwordsMismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 6;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="wc-first" className="text-xs">First Name</Label>
          <Input
            id="wc-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
          />
        </div>
        <div>
          <Label htmlFor="wc-last" className="text-xs">Last Name</Label>
          <Input
            id="wc-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="wc-cemail" className="text-xs">Email</Label>
        <Input
          id="wc-cemail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
        />
      </div>
      <div>
        <Label htmlFor="wc-cpassword" className="text-xs">Password</Label>
        <Input
          id="wc-cpassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        {tooShort && (
          <p className="mt-1 text-[10px] text-red-400">Password must be at least 6 characters.</p>
        )}
      </div>
      <div>
        <Label htmlFor="wc-confirm" className="text-xs">Confirm Password</Label>
        <Input
          id="wc-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password"
        />
        {passwordsMismatch && (
          <p className="mt-1 text-[10px] text-red-400">Passwords do not match.</p>
        )}
      </div>
      <Button
        className="w-full"
        disabled={
          saving ||
          !email.trim() ||
          password.length < 6 ||
          passwordsMismatch ||
          password !== confirm
        }
        onClick={() =>
          onSubmit(
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            password,
          )
        }
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Create Account
      </Button>
    </div>
  );
}
