import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";

/**
 * GET /api/v1/faq
 *
 * Returns the list of published FAQ items. Hardcoded sample data for now —
 * wire up to a real FAQ model once one exists.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 120);
  if (limited) return limited;

  const items = [
    {
      id: "faq-1",
      question: "What is SiteBuilder?",
      answer:
        "SiteBuilder is a platform for launching fast, modern marketing sites and blogs without touching infrastructure. You write content, we handle the rest.",
      category: "General",
      published: true,
      order: 1,
    },
    {
      id: "faq-2",
      question: "Do I need to know how to code?",
      answer:
        "No. The CMS is fully managed through an admin dashboard. Developers can still drop down to code for custom layouts when needed.",
      category: "General",
      published: true,
      order: 2,
    },
    {
      id: "faq-3",
      question: "Can I use my own domain?",
      answer:
        "Yes. Add a custom domain in Settings and we'll handle TLS certificate provisioning and automatic renewals.",
      category: "Domains",
      published: true,
      order: 3,
    },
    {
      id: "faq-4",
      question: "How do I get support?",
      answer:
        "Email us at support@example.com or use the contact form on this site. We typically respond within one business day.",
      category: "Support",
      published: true,
      order: 4,
    },
    {
      id: "faq-5",
      question: "Is there a free plan?",
      answer:
        "Yes — every account starts on the free plan with one site and unlimited blog posts. Upgrade any time for custom domains and team seats.",
      category: "Billing",
      published: true,
      order: 5,
    },
    {
      id: "faq-6",
      question: "Can I export my content?",
      answer:
        "Always. Export all of your posts and pages as Markdown at any time from Settings → Export.",
      category: "General",
      published: true,
      order: 6,
    },
  ];

  return ok({ items });
}
