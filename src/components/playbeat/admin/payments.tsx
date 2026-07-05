"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Landmark,
  Zap,
  CreditCard,
  Globe,
  CheckCircle,
  XCircle,
  Settings,
  TestTube,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const gatewayIcons: Record<string, React.ReactNode> = {
  stripe: <CreditCard size={20} className="text-indigo-500" />,
  paypal: <Globe size={20} className="text-blue-500" />,
  jazzcash: <Zap size={20} className="text-orange-500" />,
  easypaisa: <Zap size={20} className="text-green-500" />,
  bank: <Landmark size={20} className="text-gray-500" />,
};

export function AdminPayments() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-gateways"],
    queryFn: () => api.adminPaymentGateways(),
    staleTime: 30_000,
  });
  const gateways = data?.items || [];

  const handleToggle = async (g: any) => {
    try {
      await api.adminGatewayToggle({
        id: g._id ?? g.id,
        enabled: !g.enabled,
      });
      toast.success(`${g.name} ${g.enabled ? "disabled" : "enabled"}`);
      qc.invalidateQueries({ queryKey: ["admin-payment-gateways"] });
    } catch {
      toast.error("Failed to toggle gateway");
    }
  };

  const handleToggleTest = async (g: any) => {
    try {
      await api.adminGatewayTestMode({
        id: g._id ?? g.id,
        testMode: !g.testMode,
      });
      toast.success(`Test mode ${g.testMode ? "off" : "on"}`);
      qc.invalidateQueries({ queryKey: ["admin-payment-gateways"] });
    } catch {
      toast.error("Failed to toggle test mode");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Gateways</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure payment methods for your platform
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : gateways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Landmark
              size={40}
              className="mx-auto mb-3 text-muted-foreground"
            />
            <p className="text-muted-foreground">No gateways configured</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((g: any) => (
            <Card key={g._id ?? g.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {gatewayIcons[g.slug] ?? <CreditCard size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold">{g.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {g.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {g.enabled ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-gray-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${g.enabled ? "text-green-600" : "text-gray-400"}`}
                    >
                      {g.enabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-muted rounded p-2">
                    <p className="text-muted-foreground">Transactions</p>
                    <p className="font-semibold">
                      {Number(g.transactionCount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <p className="text-muted-foreground">Volume</p>
                    <p className="font-semibold">
                      ${Number(g.totalVolume ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={g.enabled ? "secondary" : "default"}
                    className="flex-1 text-xs h-8"
                    onClick={() => handleToggle(g)}
                  >
                    {g.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1 text-xs h-8"
                    onClick={() => handleToggleTest(g)}
                  >
                    <TestTube size={12} />
                    {g.testMode ? "Live" : "Test"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => toast.info("Opening gateway settings...")}
                  >
                    <Settings size={13} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
