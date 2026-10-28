import ZAI from "z-ai-web-dev-sdk";
import { ServiceError } from "@/lib/api";
import { ENV } from "@/lib/env";

/**
 * آداپتور مدل زبانی — تنها نقطهٔ تماس برنامه با LLM.
 * پیش‌فرض محیط: z-ai-web-dev-sdk (سمت سرور، بدون ارسال کلید به کلاینت).
 * برای تعویض ارائه‌دهنده (مثلاً Ollama محلی) کافی است پیاده‌سازی این تابع عوض شود.
 */
export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

type ZaiInstance = Awaited<ReturnType<typeof ZAI.create>>;
let zaiInstance: ZaiInstance | null = null;

async function getZai(): Promise<ZaiInstance> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function llmComplete(messages: LlmMessage[]): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
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
    } catch (err) {
      lastError = err;
      if (err instanceof ServiceError) throw err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
    }
  }
  console.error("[llm] completion failed:", lastError);
  throw new ServiceError("LLM_UNAVAILABLE", "سرویس مدل زبانی در دسترس نیست. بعداً تلاش کنید.", 503);
}

export function llmModelName(): string {
  return ENV.llmModel;
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
