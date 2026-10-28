import ZAI from "z-ai-web-dev-sdk";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { ServiceError } from "@/lib/api";
import { ENV } from "@/lib/env";

/**
 * آداپتور مدل زبانی — تنها نقطهٔ تماس برنامه با LLM.
 *
 * اولویت ارائه‌دهنده:
 *  ۱) متغیرهای محیطی LLM_API_KEY (+ LLM_BASE_URL و LLM_MODEL) → هر سرویس
 *     سازگار با OpenAI API (OpenAI، OpenRouter، Ollama و…) — مناسب استقرار
 *     خارجی مانند Vercel. کلید فقط سمت سرور خوانده می‌شود.
 *  ۲) z-ai-web-dev-sdk (پیش‌فرض محیط سندباکس).
 *
 * اگر هیچ‌کدام در دسترس نباشد، ServiceError با کد LLM_UNAVAILABLE پرتاب
 * می‌شود و لایهٔ سرویس با «پاسخ استخراجی از شواهد» افت‌کاری می‌کند.
 */

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

type ZaiInstance = Awaited<ReturnType<typeof ZAI.create>>;
let zaiInstance: ZaiInstance | null = null;
let zaiBroken = false;

function hasEnvProvider(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

async function getZai(): Promise<ZaiInstance> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

async function envProviderComplete(messages: LlmMessage[]): Promise<string> {
  const apiKey = process.env.LLM_API_KEY as string;
  const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) throw new Error("LLM empty response");
  return content;
}

async function zaiComplete(messages: LlmMessage[]): Promise<string> {
  const zai = await getZai();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  });
  const content = completion.choices[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    throw new ServiceError("LLM_EMPTY", "پاسخ خالی از مدل زبانی دریافت شد.", 502);
  }
  return content;
}

export async function llmComplete(messages: LlmMessage[]): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return hasEnvProvider() ? await envProviderComplete(messages) : await zaiComplete(messages);
    } catch (err) {
      lastError = err;
      if (err instanceof ServiceError) throw err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
    }
  }
  // SDK محیط سندباکس در دسترس نیست؛ تلاش مجدد بی‌فایده است
  if (!hasEnvProvider()) zaiBroken = true;
  console.error("[llm] completion failed:", lastError);
  throw new ServiceError("LLM_UNAVAILABLE", "سرویس مدل زبانی در دسترس نیست. بعداً تلاش کنید.", 503);
}

/** آیا ارائه‌دهندهٔ مدل زبانی پیکربندی شده است؟ (برچسب‌گذاری صادقانه در UI) */
export function llmConfigured(): boolean {
  if (hasEnvProvider()) return true;
  if (zaiBroken) return false;
  // بررسی ارزان وجود فایل پیکربندی z-ai (بدون فراخوانی شبکه)
  const candidates = ["./.z-ai-config", `${homedir()}/.z-ai-config`, "/etc/.z-ai-config"];
  return candidates.some((p) => {
    try {
      return existsSync(p);
    } catch {
      return false;
    }
  });
}

export function llmModelName(): string {
  if (hasEnvProvider()) return process.env.LLM_MODEL ?? "gpt-4o-mini";
  return ENV.llmModel;
}

export function llmProviderName(): string {
  if (hasEnvProvider()) {
    return `سازگار با OpenAI (${(process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/^https?:\/\//, "").split("/")[0]})`;
  }
  return ENV.llmProvider;
}

/** استخراج JSON از پاسخ مدل — با تحمل ``` و متن اضافه */
export function extractJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/```json/gi, "```")
    .split("```")
    .map((s) => s.trim())
    .filter(Boolean);
  const candidates = [raw, ...cleaned];
  for (const candidate of candidates) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as T;
      } catch {
        // ادامه
      }
    }
  }
  return null;
}
