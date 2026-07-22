import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";

export const dynamic = "force-dynamic";

// Static catalogue of AI tools — no DB needed. The frontend renders this list
// as cards; clicking a card opens a runner dialog that POSTs to /ai-tools/<id>.
const TOOLS = [
  {
    id: "text-generator",
    name: "Text Generator",
    description: "Generate free-form text from a prompt using the LLM.",
    category: "Text",
    icon: "Sparkles",
    inputType: "prompt",
    outputType: "text",
    inputs: [
      { key: "prompt", label: "Prompt", type: "textarea", required: true },
    ],
  },
  {
    id: "image-generator",
    name: "Image Generator",
    description: "Create an image from a text prompt (1024×1024 PNG).",
    category: "Image",
    icon: "Image",
    inputType: "prompt",
    outputType: "image",
    inputs: [
      { key: "prompt", label: "Prompt", type: "textarea", required: true },
    ],
  },
  {
    id: "text-to-speech",
    name: "Text to Speech",
    description: "Convert text into natural-sounding speech audio.",
    category: "Audio",
    icon: "Volume2",
    inputType: "text",
    outputType: "audio",
    inputs: [
      { key: "text", label: "Text", type: "textarea", required: true },
    ],
  },
  {
    id: "speech-to-text",
    name: "Speech to Text",
    description: "Transcribe an audio file (base64) into text.",
    category: "Audio",
    icon: "Mic",
    inputType: "audio",
    outputType: "text",
    inputs: [
      {
        key: "audio",
        label: "Audio (base64)",
        type: "file-audio",
        required: true,
      },
    ],
  },
  {
    id: "image-analysis",
    name: "Image Analysis",
    description: "Describe an image — supply a URL or upload an image and ask a question.",
    category: "Vision",
    icon: "Eye",
    inputType: "image",
    outputType: "text",
    inputs: [
      {
        key: "image",
        label: "Image (URL or base64 data URI)",
        type: "image",
        required: true,
      },
      { key: "question", label: "Question", type: "text", required: true },
    ],
  },
  {
    id: "content-writer",
    name: "Content Writer",
    description: "Write a structured blog post on any topic.",
    category: "Content",
    icon: "PenTool",
    inputType: "topic",
    outputType: "text",
    inputs: [
      { key: "topic", label: "Topic", type: "text", required: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: ["blog-post", "listicle", "how-to", "essay"],
        required: false,
      },
    ],
  },
];

// ----- GET /api/v1/admin/ai-tools — list all available tools -----

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  return ok({ tools: TOOLS });
}
