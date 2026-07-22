import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import ZAI from "z-ai-web-dev-sdk";

export const dynamic = "force-dynamic";

const AI_OUTPUT_DIR = path.join(process.cwd(), "public", "ai-output");
const VALID_TOOLS = new Set([
  "text-generator",
  "image-generator",
  "text-to-speech",
  "speech-to-text",
  "image-analysis",
  "content-writer",
]);

// Get a lazily-initialised ZAI singleton. Re-initialising on every request
// would re-read the .z-ai-config file each call, which is wasteful.
let _zaiPromise: Promise<ZAI> | null = null;
async function getZai(): Promise<ZAI> {
  if (!_zaiPromise) {
    _zaiPromise = ZAI.create();
  }
  return _zaiPromise;
}

async function ensureOutputDir() {
  await fs.mkdir(AI_OUTPUT_DIR, { recursive: true });
}

function randomName(prefix: string, ext: string): string {
  return `${prefix}-${randomBytes(4).toString("hex")}${ext}`;
}

// Extract text from a chat completion response (OpenAI-style choices array).
function extractChatText(res: any): string {
  if (!res) return "";
  const choices = res.choices || [];
  for (const c of choices) {
    const content =
      c?.message?.content ??
      c?.delta?.content ??
      c?.text ??
      null;
    if (typeof content === "string" && content.trim()) return content;
  }
  if (typeof res.text === "string") return res.text;
  if (typeof res.content === "string") return res.content;
  return JSON.stringify(res);
}

// ----- POST /api/v1/admin/ai-tools/[tool] -----

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> },
) {
  const limited = applyRateLimit(request, 20);
  if (limited) return limited;

  const { tool } = await params;
  if (!VALID_TOOLS.has(tool)) {
    return error(
      `Unknown AI tool: ${tool}. Valid tools: ${[...VALID_TOOLS].join(", ")}`,
      404,
    );
  }

  const body = await request.json().catch(() => ({} as any));
  if (!body || typeof body !== "object") {
    return error("Invalid request body", 422);
  }

  try {
    switch (tool) {
      case "text-generator":
        return await runTextGenerator(body);
      case "content-writer":
        return await runContentWriter(body);
      case "image-generator":
        return await runImageGenerator(body);
      case "text-to-speech":
        return await runTextToSpeech(body);
      case "speech-to-text":
        return await runSpeechToText(body);
      case "image-analysis":
        return await runImageAnalysis(body);
      default:
        return error(`Tool not implemented: ${tool}`, 501);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI tool failed";
    return error(msg, 500);
  }
}

// ---------------- text-generator ----------------
async function runTextGenerator(body: any) {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return error("prompt is required", 422);
  if (prompt.length > 8000) return error("prompt is too long (max 8000 chars)", 422);

  const zai = await getZai();
  const res = await zai.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful, concise assistant." },
      { role: "user", content: prompt },
    ],
    thinking: { type: "disabled" },
  });
  const text = extractChatText(res);
  return ok({ text });
}

// ---------------- content-writer ----------------
async function runContentWriter(body: any) {
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) return error("topic is required", 422);
  if (topic.length > 500) return error("topic is too long (max 500 chars)", 422);

  const type =
    typeof body.type === "string" && body.type ? body.type : "blog-post";
  const supportedTypes = ["blog-post", "listicle", "how-to", "essay"];
  if (!supportedTypes.includes(type)) {
    return error(`type must be one of: ${supportedTypes.join(", ")}`, 422);
  }

  const typeGuidance: Record<string, string> = {
    "blog-post":
      "Write a structured blog post with an engaging intro, 3-5 body sections with H2 headings, and a conclusion. Use markdown.",
    listicle:
      "Write a listicle with a short intro, 5-10 numbered items each with a one-line description, and a brief closing. Use markdown headings.",
    "how-to":
      "Write a step-by-step how-to guide with numbered steps, each step has a heading and a short explanation. Include a brief intro and tips. Use markdown.",
    essay:
      "Write a short essay with an introduction, 2-3 body paragraphs, and a conclusion. Use markdown.",
  };

  const zai = await getZai();
  const res = await zai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a professional content writer. ${typeGuidance[type]} Output only the article content (no preamble).`,
      },
      { role: "user", content: `Topic: ${topic}` },
    ],
    thinking: { type: "disabled" },
  });
  const content = extractChatText(res);
  return ok({ content });
}

// ---------------- image-generator ----------------
async function runImageGenerator(body: any) {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return error("prompt is required", 422);
  if (prompt.length > 1500) return error("prompt is too long (max 1500 chars)", 422);

  const zai = await getZai();
  const res = await zai.images.generations.create({
    prompt,
    size: "1024x1024",
  });

  const b64 = res?.data?.[0]?.base64;
  if (!b64) {
    return error("Image generator returned no image data", 502);
  }

  await ensureOutputDir();
  const fileName = randomName("ai-image", ".png");
  const absPath = path.join(AI_OUTPUT_DIR, fileName);
  await fs.writeFile(absPath, Buffer.from(b64, "base64"));

  return ok({ imageUrl: `/ai-output/${fileName}` });
}

// ---------------- text-to-speech ----------------
async function runTextToSpeech(body: any) {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return error("text is required", 422);
  if (text.length > 3000) return error("text is too long (max 3000 chars)", 422);

  const zai = await getZai();
  const response = (await zai.audio.tts.create({
    input: text,
    voice: "tongtong",
    response_format: "wav",
    stream: false,
  })) as any;

  // TTS returns a Response-like object — read the binary audio body.
  let buffer: Buffer | null = null;
  if (response?.arrayBuffer) {
    const ab = await response.arrayBuffer();
    buffer = Buffer.from(new Uint8Array(ab));
  } else if (Buffer.isBuffer(response)) {
    buffer = response;
  } else if (typeof response === "string") {
    buffer = Buffer.from(response, "base64");
  }

  if (!buffer || buffer.length === 0) {
    return error("TTS returned no audio data", 502);
  }

  await ensureOutputDir();
  const fileName = randomName("ai-tts", ".wav");
  const absPath = path.join(AI_OUTPUT_DIR, fileName);
  await fs.writeFile(absPath, buffer);

  return ok({ audioUrl: `/ai-output/${fileName}` });
}

// ---------------- speech-to-text ----------------
async function runSpeechToText(body: any) {
  const audio =
    typeof body.audio === "string" ? body.audio.trim() : "";
  if (!audio) return error("audio (base64) is required", 422);

  // Accept either a raw base64 string or a data URI ("data:audio/wav;base64,…")
  const commaIdx = audio.indexOf(",");
  const base64 = commaIdx >= 0 && audio.startsWith("data:") ? audio.slice(commaIdx + 1) : audio;
  if (!base64) {
    return error("audio payload is empty", 422);
  }

  const zai = await getZai();
  const res = (await zai.audio.asr.create({
    file_base64: base64,
  })) as any;

  const text =
    (res && (res.text || res.transcript)) ||
    (res?.choices?.[0]?.message?.content as string | undefined) ||
    extractChatText(res);

  return ok({ text });
}

// ---------------- image-analysis ----------------
async function runImageAnalysis(body: any) {
  const image = typeof body.image === "string" ? body.image.trim() : "";
  if (!image) return error("image (URL or base64 data URI) is required", 422);
  const question =
    typeof body.question === "string" && body.question.trim()
      ? body.question.trim()
      : "Describe this image in detail.";
  if (question.length > 1000) return error("question is too long (max 1000 chars)", 422);

  const zai = await getZai();
  const res = await zai.chat.completions.createVision({
    model: "glm-4v",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: question },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ],
    thinking: { type: "disabled" },
  });

  const description = extractChatText(res);
  return ok({ description });
}
