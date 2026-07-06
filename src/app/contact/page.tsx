"use client";

import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/website-builder/public-layout";

// Hardcoded contact settings — no settings API for the website-builder yet.
const settings = {
  email: "hello@sitebuilder.example",
  phone: "+1 (415) 555-0123",
  address: "123 Market Street\nSan Francisco, CA 94103\nUnited States",
  formEnabled: true,
  mapEmbed: undefined as string | undefined,
};

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.contactSubmit({ firstName, lastName, email, message });
      if (res.success) {
        toast.success("Message sent!", {
          description: "Thanks for reaching out — we'll get back to you within one business day.",
        });
        setFirstName("");
        setLastName("");
        setEmail("");
        setMessage("");
      }
    } catch (err) {
      toast.error("Could not send message", {
        description: err instanceof Error ? err.message : "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-16 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Contact</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Get in touch</h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Have a question or want to work together? We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="space-y-6"
          >
            <h2 className="font-bold text-xl tracking-tight">Contact information</h2>

            {/* Settings always loaded from the hardcoded const above, so no skeleton here. */}
            <div className="space-y-4">
              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Email</p>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{settings.email}</p>
                  </div>
                </a>
              )}

              {settings.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Phone</p>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{settings.phone}</p>
                  </div>
                </a>
              )}

              {settings.address && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Address</p>
                    <p className="text-sm font-semibold whitespace-pre-line">{settings.address}</p>
                  </div>
                </div>
              )}

              {!settings.email && !settings.phone && !settings.address && (
                <p className="text-muted-foreground text-sm">Contact information coming soon.</p>
              )}
            </div>
          </motion.div>

          {/* Contact form / message */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            {settings.formEnabled ? (
              <div className="bg-card border border-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-bold text-lg">Send a message</h2>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">First name</label>
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Last name</label>
                      <input
                        type="text"
                        placeholder="Smith"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Message</label>
                    <textarea
                      rows={5}
                      placeholder="How can we help you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      minLength={10}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-primary-foreground font-semibold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-primary/8 to-violet-500/8 border border-primary/15 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[280px]">
                <MessageSquare className="w-10 h-10 text-primary/40 mb-4" />
                <h3 className="font-bold text-lg mb-2">Drop us a line</h3>
                <p className="text-sm text-muted-foreground">
                  Use the contact information on the left to reach us directly.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Map embed */}
        {settings.mapEmbed && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="mt-16 rounded-2xl overflow-hidden border border-border h-72"
            dangerouslySetInnerHTML={{ __html: settings.mapEmbed }}
          />
        )}
      </div>
    </PublicLayout>
  );
}
