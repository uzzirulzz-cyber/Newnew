import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomHex(len: number): string {
  const bytes = randomBytes(Math.ceil(len / 2));
  return bytes.toString("hex").slice(0, len);
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "page";
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = `${base}-${randomHex(6)}`;
    const existing = await db.cmsPage.findUnique({ where: { slug } });
    if (!existing) return slug;
  }
  return `${base}-${randomHex(10)}`;
}

// ----- POST /api/v1/admin/cms/seed — seed default CMS content -----

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 10);
  if (limited) return limited;

  const defaultPages = [
    {
      title: "Homepage",
      path: "/",
      seoTitle: "Playbeat Digital — Premium Digital Products Marketplace",
      seoDescription:
        "Premium digital products marketplace — streaming, AI tools, games, and more.",
      sections: [
        { id: "hero", name: "Hero Banner", type: "hero", visible: true },
        {
          id: "featured",
          name: "Featured Products",
          type: "grid",
          visible: true,
        },
        {
          id: "categories",
          name: "Categories Strip",
          type: "strip",
          visible: true,
        },
        {
          id: "testimonials",
          name: "Testimonials",
          type: "carousel",
          visible: true,
        },
        { id: "brands", name: "Brand Strip", type: "logos", visible: true },
        { id: "cta", name: "Footer CTA", type: "cta", visible: true },
      ],
    },
    {
      title: "Marketplace",
      path: "/marketplace",
      seoTitle: "Marketplace — Playbeat Digital",
      seoDescription: "Browse all digital products available on Playbeat.",
      sections: [
        { id: "hero", name: "Hero Banner", type: "hero", visible: true },
        { id: "filters", name: "Filters Sidebar", type: "filter", visible: true },
        { id: "grid", name: "Product Grid", type: "grid", visible: true },
      ],
    },
    {
      title: "Privacy Policy",
      path: "/privacy",
      seoTitle: "Privacy Policy — Playbeat Digital",
      seoDescription:
        "How Playbeat Digital collects, uses, and protects your data.",
      sections: [
        { id: "content", name: "Privacy Content", type: "prose", visible: true },
      ],
    },
    {
      title: "Terms of Service",
      path: "/terms",
      seoTitle: "Terms of Service — Playbeat Digital",
      seoDescription: "The terms and conditions for using Playbeat Digital.",
      sections: [
        { id: "content", name: "Terms Content", type: "prose", visible: true },
      ],
    },
    {
      title: "FAQ",
      path: "/faq",
      seoTitle: "Frequently Asked Questions — Playbeat Digital",
      seoDescription: "Answers to common questions about Playbeat Digital.",
      sections: [
        { id: "hero", name: "Hero Banner", type: "hero", visible: true },
        { id: "faqs", name: "FAQ List", type: "accordion", visible: true },
      ],
    },
    {
      title: "Contact",
      path: "/contact",
      seoTitle: "Contact Us — Playbeat Digital",
      seoDescription: "Get in touch with the Playbeat Digital team.",
      sections: [
        { id: "hero", name: "Hero Banner", type: "hero", visible: true },
        { id: "form", name: "Contact Form", type: "form", visible: true },
      ],
    },
    {
      title: "Refund Policy",
      path: "/refund-policy",
      seoTitle: "Refund Policy — Playbeat Digital",
      seoDescription: "Our refund and return policy for digital products.",
      sections: [
        { id: "content", name: "Refund Content", type: "prose", visible: true },
      ],
    },
  ];

  const defaultFaqs = [
    {
      question: "What is Playbeat Digital?",
      answer:
        "Playbeat Digital is a premium digital products marketplace offering streaming subscriptions, AI tools, games, software licenses, and more.",
      category: "general",
      sortOrder: 0,
    },
    {
      question: "How do I receive my digital product after purchase?",
      answer:
        "After successful payment, your product is instantly available in your account dashboard. You'll also receive a download link via email.",
      category: "orders",
      sortOrder: 1,
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept JazzCash, credit/debit cards, and other local payment methods. All transactions are encrypted and secure.",
      category: "payments",
      sortOrder: 2,
    },
    {
      question: "Can I get a refund on a digital product?",
      answer:
        "Due to the nature of digital products, refunds are only issued in specific cases (e.g., product not delivered, defective file). See our Refund Policy page for full details.",
      category: "refunds",
      sortOrder: 3,
    },
    {
      question: "Do you offer support for IPTV subscriptions?",
      answer:
        "Yes! All IPTV subscriptions come with 24/7 support. You can reach us through the Contact page or via your account dashboard.",
      category: "support",
      sortOrder: 4,
    },
  ];

  try {
    // Only seed pages if none exist
    const existingPagesCount = await db.cmsPage.count();
    let pagesCreated = 0;
    if (existingPagesCount === 0) {
      for (const p of defaultPages) {
        const slug = await generateUniqueSlug(p.title);
        await db.cmsPage.create({
          data: {
            title: p.title,
            slug,
            path: p.path,
            status: "published",
            sections: JSON.stringify(p.sections),
            seoTitle: p.seoTitle,
            seoDescription: p.seoDescription,
            views: 0,
          },
        });
        pagesCreated++;
      }
    }

    // Only seed FAQs if none exist
    const existingFaqsCount = await db.faq.count();
    let faqsCreated = 0;
    if (existingFaqsCount === 0) {
      for (const f of defaultFaqs) {
        await db.faq.create({
          data: {
            question: f.question,
            answer: f.answer,
            category: f.category,
            sortOrder: f.sortOrder,
            published: true,
          },
        });
        faqsCreated++;
      }
    }

    return ok({
      success: true,
      pagesCreated,
      faqsCreated,
      pagesSkipped: existingPagesCount,
      faqsSkipped: existingFaqsCount,
      message: `Seeded ${pagesCreated} pages and ${faqsCreated} FAQs.`,
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to seed CMS data",
      500,
    );
  }
}
