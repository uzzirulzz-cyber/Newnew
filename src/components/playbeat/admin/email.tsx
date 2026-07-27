"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Save,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  Settings,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function AdminEmail() {
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    smtpHost: "",
    smtpPort: 465,
    smtpUser: "support@playbeat.digital",
    smtpPassword: "",
    fromName: "PlayBeat Digital",
    fromEmail: "support@playbeat.digital",
  });
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  // Email composer
  const [emailForm, setEmailForm] = React.useState({
    to: "",
    subject: "",
    html: "",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["email-settings"],
    queryFn: () => api.emailSettings(),
    staleTime: 30_000,
  });
  const configured = settings?.configured === true;

  React.useEffect(() => {
    if (settings?.configured) {
      setForm((f) => ({
        ...f,
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 465,
        smtpUser: settings.smtpUser || "support@playbeat.digital",
        fromName: settings.fromName || "PlayBeat Digital",
        fromEmail: settings.fromEmail || "support@playbeat.digital",
        smtpPassword: "", // never echo back
      }));
    }
  }, [settings]);

  const handleSave = async () => {
    if (!form.smtpHost) {
      toast.error("SMTP host is required");
      return;
    }
    if (!form.smtpUser) {
      toast.error("SMTP user (email) is required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        smtpHost: form.smtpHost,
        smtpPort: form.smtpPort,
        smtpUser: form.smtpUser,
        fromName: form.fromName,
        fromEmail: form.fromEmail,
      };
      if (form.smtpPassword) payload.smtpPassword = form.smtpPassword;
      const res = await api.emailSettingsSave(payload);
      toast.success(res.message || "Email settings saved");
      setForm((f) => ({ ...f, smtpPassword: "" }));
      qc.invalidateQueries({ queryKey: ["email-settings"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await api.emailTestConnection();
      if (res.ok) toast.success(res.message || "SMTP verified");
      else toast.error(res.message || "Connection failed");
    } catch (e: any) {
      toast.error(e?.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSendTest = async () => {
    setSending(true);
    try {
      const res = await api.emailTest(form.smtpUser || "support@playbeat.digital");
      if (res.ok) toast.success(`Test email sent to ${form.smtpUser}`);
      else toast.error(res.message || "Failed to send test");
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.html) {
      toast.error("To, subject, and content are required");
      return;
    }
    setSending(true);
    try {
      const res = await api.emailSend({
        to: emailForm.to,
        subject: emailForm.subject,
        html: emailForm.html,
      });
      if (res.ok) {
        toast.success(`Email sent to ${emailForm.to}`);
        setEmailForm({ to: "", subject: "", html: "" });
      } else {
        toast.error(res.message || "Failed to send");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Remove email settings?")) return;
    try {
      await api.emailSettingsClear();
      toast.success("Email settings cleared");
      qc.invalidateQueries({ queryKey: ["email-settings"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Email</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Send emails from support@playbeat.digital
          </p>
        </div>
        {configured ? (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={12} className="mr-1" /> Configured
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertCircle size={12} className="mr-1" /> Not configured
          </Badge>
        )}
      </div>

      {/* SMTP Settings */}
      <Card className={configured ? "border-emerald-500/30" : "border-amber-500/30"}>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings size={16} />
            SMTP Configuration
            {isLoading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {configured && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs">
              <p className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Email configured
              </p>
              <p className="text-muted-foreground mt-1">
                Sending from <strong>{settings?.fromEmail}</strong> via {settings?.smtpHost}:{settings?.smtpPort}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">SMTP Host *</Label>
              <Input
                value={form.smtpHost}
                onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                placeholder="mail.playbeat.digital"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">SMTP Port</Label>
              <Input
                type="number"
                value={form.smtpPort}
                onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })}
                placeholder="465 (SSL) or 587 (TLS)"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">SMTP User (Email) *</Label>
              <Input
                value={form.smtpUser}
                onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                placeholder="support@playbeat.digital"
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">SMTP Password {configured ? "(leave blank to keep)" : "*"}</Label>
              <Input
                type="password"
                value={form.smtpPassword}
                onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
                placeholder={configured ? "•••••••• (saved)" : "Email account password"}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From Name</Label>
              <Input
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                placeholder="PlayBeat Digital"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From Email</Label>
              <Input
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                placeholder="support@playbeat.digital"
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {configured ? "Update Settings" : "Save Settings"}
            </Button>
            {configured && (
              <>
                <Button variant="outline" onClick={handleTestConnection} disabled={testing} className="gap-1.5">
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Test Connection
                </Button>
                <Button variant="outline" onClick={handleSendTest} disabled={sending} className="gap-1.5">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send Test Email
                </Button>
                <Button variant="ghost" onClick={handleDisconnect} className="text-destructive gap-1.5">
                  <Trash2 size={14} /> Disconnect
                </Button>
              </>
            )}
          </div>

          <div className="rounded-md border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">cPanel Email Setup:</strong>{" "}
            Go to cPanel → Email Accounts → create{" "}
            <span className="font-mono">support@playbeat.digital</span>, then use the
            SMTP details shown there (usually <span className="font-mono">mail.playbeat.digital:465</span>).
          </div>
        </CardContent>
      </Card>

      {/* Email Composer */}
      {configured && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail size={16} />
              Send Email
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">To *</Label>
              <Input
                value={emailForm.to}
                onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                placeholder="customer@example.com"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject *</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="Your order is ready"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Content (HTML) *</Label>
              <Textarea
                value={emailForm.html}
                onChange={(e) => setEmailForm({ ...emailForm, html: e.target.value })}
                placeholder="<h2>Hi Customer,</h2><p>Your order PB-XXX has been confirmed...</p>"
                rows={8}
                className="text-sm font-mono"
              />
            </div>
            <Button onClick={handleSendEmail} disabled={sending} className="gap-1.5">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Email
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
