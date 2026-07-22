import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";

/**
 * POST /api/v1/ai/generate
 *
 * AI content generator powered by the LLM skill (z-ai-web-dev-sdk).
 * Generates real AI content for 6 tool types:
 *   - product: product descriptions
 *   - blog: blog posts
 *   - seo: meta tags & keywords
 *   - email: marketing emails
 *   - banner: banner copy & layout
 *   - reply: customer support auto-reply
 *
 * Body: { tool: string, input: string }
 * Response: { content: string, tool: string }
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { tool, input } = body;

  if (!tool || !input) {
    return error("Tool type and input text are required", 422);
  }

  const SYSTEM_PROMPTS: Record<string, string> = {
    product:
      "You are an expert e-commerce copywriter. Write compelling product descriptions for a digital marketplace. Include features as bullet points, highlight benefits, and end with a call-to-action. Keep it concise but persuasive. Do NOT use any specific brand name — refer to the platform generically.",
    blog:
      "You are a professional blog writer. Write engaging, well-structured blog posts with a catchy title, introduction, 3-4 main sections with headings, and a conclusion. Use Markdown formatting. Do NOT use any specific brand name — refer to the platform generically.",
    seo:
      "You are an SEO specialist. Generate optimized meta tags, keywords, and Open Graph data for the given page or product. Include: Meta Title (under 60 chars), Meta Description (under 160 chars), 6-8 target keywords, and Open Graph tags. Do NOT use any specific brand name.",
    email:
      "You are an email marketing expert. Write engaging marketing emails with a compelling subject line, personalized greeting, clear offer, bullet points, strong CTA, and professional sign-off. Use {{customer_name}} as the merge tag. Do NOT use any specific brand name or phone number.",
    banner:
      "You are a banner ad designer and copywriter. Generate banner copy and layout specifications including: headline, subheadline, CTA button text, background color, accent color, image suggestion, badge text, countdown timer, and dimensions for desktop and mobile. Do NOT use any specific brand name.",
    reply:
      "You are a professional customer support agent. Write helpful, empathetic auto-reply messages. Acknowledge the issue, provide 3-4 troubleshooting steps, ask for order number if needed, and offer further assistance. Do NOT use any specific brand name or phone number.",
  };

  const systemPrompt =
    SYSTEM_PROMPTS[tool] || "You are a helpful AI assistant for a digital marketplace platform.";

  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: String(input).slice(0, 2000) },
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content || content.trim().length === 0) {
      return error("AI generated an empty response. Please try again.", 500);
    }

    return ok({ content, tool, model: "glm-4" });
  } catch (e) {
    console.error("[ai/generate] error:", e);
    return error(
      e instanceof Error
        ? `AI generation failed: ${e.message}`
        : "AI service unavailable. Please try again.",
      500,
    );
  }
}
