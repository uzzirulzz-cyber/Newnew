"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";

const integrations = [
  {
    name: "Stripe",
    category: "Payments",
    description: "Accept card payments globally",
    connected: true,
    logo: "💳",
  },
  {
    name: "Slack",
    category: "Notifications",
    description: "Send alerts to Slack channels",
    connected: true,
    logo: "💬",
  },
  {
    name: "Mailchimp",
    category: "Email Marketing",
    description: "Email campaigns and automation",
    connected: false,
    logo: "📧",
  },
  {
    name: "Google Analytics",
    category: "Analytics",
    description: "Website traffic and user behavior",
    connected: true,
    logo: "📊",
  },
  {
    name: "Twilio",
    category: "SMS",
    description: "SMS notifications and 2FA",
    connected: false,
    logo: "📱",
  },
  {
    name: "AWS S3",
    category: "Storage",
    description: "Cloud file storage and CDN",
    connected: true,
    logo: "☁️",
  },
  {
    name: "HubSpot",
    category: "CRM",
    description: "Customer relationship management",
    connected: false,
    logo: "🏢",
  },
  {
    name: "Zapier",
    category: "Automation",
    description: "Connect with 5000+ apps",
    connected: false,
    logo: "⚡",
  },
];

const categories = [
  "All",
  "Payments",
  "Email Marketing",
  "Analytics",
  "Notifications",
  "SMS",
  "Storage",
  "CRM",
  "Automation",
];

export function IntegrationsModule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect third-party services to your platform
          </p>
        </div>
        <Button
          onClick={() => toast.info("Browse integration marketplace...")}
          className="gap-2"
        >
          <Plus size={16} />
          Browse All
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.slice(0, 6).map((cat) => (
          <button
            key={cat}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {integrations.map((integration) => (
          <Card
            key={integration.name}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{integration.logo}</span>
                {integration.connected ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <XCircle size={16} className="text-gray-300" />
                )}
              </div>
              <p className="font-semibold text-sm">{integration.name}</p>
              <p className="text-xs text-muted-foreground mb-1">
                {integration.category}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {integration.description}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={integration.connected ? "secondary" : "default"}
                  className="flex-1 text-xs h-7"
                  onClick={() =>
                    toast.info(
                      `${integration.connected ? "Managing" : "Connecting"} ${integration.name}...`,
                    )
                  }
                >
                  {integration.connected ? "Manage" : "Connect"}
                </Button>
                {integration.connected && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => toast.info("Opening settings...")}
                  >
                    <Settings size={12} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
