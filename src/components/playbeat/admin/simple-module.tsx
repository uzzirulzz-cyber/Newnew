"use client";

import { motion } from "framer-motion";
import { type LucideIcon, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SimpleModuleProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  accent?: string;
}

/** Reusable template for admin modules that don't have dedicated API data. */
export function SimpleModule({
  title,
  description,
  icon: Icon,
  features,
  accent = "from-blue-600 to-purple-600",
}: SimpleModuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`grid size-12 place-items-center rounded-xl bg-gradient-to-br ${accent} shadow-lg`}
        >
          <Icon className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <Card
            key={feature}
            className="group border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-blue-500/30 hover:bg-white/[0.07]"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Sparkles className="size-4" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => toast.message(`${feature} — coming soon`)}
              >
                Open
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming soon banner */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="grid size-12 place-items-center rounded-full bg-purple-500/15">
            <Icon className="size-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Full module coming soon</p>
            <p className="text-sm text-muted-foreground">
              This module is part of the PlayBeat Digital enterprise admin
              suite. The framework is ready — connect your data sources to
              activate it.
            </p>
          </div>
          <Badge className="bg-blue-500/15 text-blue-400">Enterprise</Badge>
        </CardContent>
      </Card>
    </motion.div>
  );
}
