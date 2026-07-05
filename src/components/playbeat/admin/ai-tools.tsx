"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const models = [
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    description: "Most capable, best quality",
    cost: "High",
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective",
    cost: "Low",
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Excellent reasoning",
    cost: "Medium",
  },
];

const usageData = [
  { feature: "Content Generation", requests: 1240, tokens: 2480000 },
  { feature: "Support Bot", requests: 3820, tokens: 7640000 },
  { feature: "Product Descriptions", requests: 620, tokens: 1240000 },
  { feature: "Email Drafting", requests: 190, tokens: 380000 },
];

export function AiToolsModule() {
  const [selectedModel, setSelectedModel] = React.useState("gpt-5-mini");
  const [temperature, setTemperature] = React.useState("0.7");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-100 dark:bg-purple-950 rounded-xl">
          <Bot size={22} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Tools</h1>
          <p className="text-muted-foreground text-sm">
            Configure AI models and monitor usage
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: "5,870" },
          { label: "Tokens Used", value: "11.7M" },
          { label: "Avg Latency", value: "1.2s" },
          { label: "Success Rate", value: "99.4%" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Model Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {models.find((m) => m.id === selectedModel) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {models.find((m) => m.id === selectedModel)!.description}
                </p>
              )}
            </div>
            <div>
              <Label>Temperature: {temperature}</Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full mt-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Precise (0)</span>
                <span>Creative (1)</span>
              </div>
            </div>
            <Button
              onClick={() => toast.success("AI settings saved")}
              className="gap-2 w-full"
            >
              <CheckCircle size={14} />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Usage by Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usageData.map((u) => (
                <div key={u.feature}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{u.feature}</span>
                    <span className="text-muted-foreground">
                      {u.requests.toLocaleString()} requests
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(u.requests / 3820) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
