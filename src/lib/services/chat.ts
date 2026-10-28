import { z } from "zod";
import { ENV } from "@/lib/env";
import { ServiceError } from "@/lib/api";
import { retrieveHybrid } from "@/lib/retrieval/hybrid";
import { findGraphFactsForQuery } from "@/lib/services/graph";
import { llmComplete, extractJson, llmModelName } from "@/lib/llm/provider";
import { CHAT_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import { embeddingProvider } from "@/lib/retrieval/embeddings";
import type { ChatRequestDTO, ChatResponseDTO, EvidenceRef, GraphFactDTO } from "@/lib/types";

/**
 * خط لولهٔ پاسخ‌گویی:
 *  ۱) بازیابی ترکیبی (BM25 + برداری + RRF) با فیلتر سند
 *  ۲) اختیاری: حقایق گراف دانش (جدا از شواهد، برچسب‌دار)
 *  ۳) پاسخ LLM فقط از مدارک + استناد [n]
 *  بدون مدرک → پاسخ صادقانهٔ الگو (بدون فراخوانی LLM)
 */

const AnswerSchema = z.object({
  answer: z.string().min(1),
  followUps: z.array(z.string().max(200)).max(3).optional(),
});

function buildEvidenceBlock(evidence: EvidenceRef[]): string {
  return evidence
    .map((e) => {
      const page = e.page !== null ? ` — صفحهٔ ${e.page}` : "";
      const heading = e.heading ? ` — بخش: ${e.heading}` : "";
      return `[${e.index}] سند: «${e.documentTitle}»${page}${heading}\n${e.snippet}`;
    })
    .join("\n\n");
}

const NO_EVIDENCE_ANSWER = `### مدارک کافی برای پاسخ وجود ندارد

هیچ قطعه‌ای از اسناد نمایه‌شده با این پرسش مطابقت نداشت. طبق سیستم، پاسخ بدون مدرک ساخته نمی‌شود.

**پیشنهاد:**
- سند مرتبط (PDF/TXT/MD/CSV) را در تب «اسناد» بارگذاری کنید.
- عبارت‌های کلیدی ساده‌تری امتحان کنید (مثلاً نام ماده یا خاصیت).
- اگر سند اسکن‌شده است، به OCR نیاز دارد و در این نسخه پشتیبانی نمی‌شود.`;

export async function answerQuestion(req: ChatRequestDTO): Promise<ChatResponseDTO> {
  const question = req.question.trim();
  if (question.length < 2) {
    throw new ServiceError("EMPTY_QUESTION", "پرسش خالی است.", 422);
  }

  const t0 = performance.now();
  const retrieval = await retrieveHybrid({
    query: question,
    topK: req.topK ?? ENV.retrievalTopK,
    useKeyword: req.useKeyword ?? true,
    useVector: req.useVector ?? true,
    documentId: req.documentId ?? null,
  });

  const graphEnabled = req.useGraph ?? true;
  const graphFacts: GraphFactDTO[] = graphEnabled
    ? await findGraphFactsForQuery(question)
    : [];

  const evidence = retrieval.evidence;

  if (evidence.length === 0) {
    return {
      answer: NO_EVIDENCE_ANSWER,
      evidence: [],
      graphFacts: [],
      followUps: [],
      meta: {
        model: llmModelName(),
        embedding: embeddingProvider.name,
        keywordEnabled: req.useKeyword ?? true,
        vectorEnabled: req.useVector ?? true,
        graphEnabled,
        retrievedChunks: 0,
        keywordMs: retrieval.keywordMs,
        vectorMs: retrieval.vectorMs,
        totalMs: Math.round(performance.now() - t0),
      },
    };
  }

  const graphBlock =
    graphFacts.length > 0
      ? `\n\n— دادهٔ گراف دانش (ادعاهای استخراج‌شده — نیازمند راستی‌آزمایی، جزو شواهد اصلی نیست) —\n${graphFacts
          .map((g) => `• ${g.text} (منشأ: ${g.source})`)
          .join("\n")}`
      : "";

  const historyBlock =
    req.history && req.history.length > 0
      ? `\n\n— گفت‌وگوی پیشین (فقط برای زمینه) —\n${req.history
          .slice(-6)
          .map((m) => `${m.role === "user" ? "کاربر" : "دستیار"}: ${m.content.slice(0, 400)}`)
          .join("\n")}`
      : "";

  const raw = await llmComplete([
    { role: "assistant", content: CHAT_SYSTEM_PROMPT },
    {
      role: "user",
      content: `پرسش کاربر: ${question}\n\n— مدارک بازیابی‌شده (تنها منبع مجاز پاسخ) —\n${buildEvidenceBlock(evidence)}${graphBlock}${historyBlock}`,
    },
  ]);

  const parsed = extractJson<unknown>(raw);
  const validated = parsed ? AnswerSchema.safeParse(parsed) : null;

  const answer = validated?.success ? validated.data.answer : raw.trim();
  const followUps = validated?.success ? (validated.data.followUps ?? []) : [];

  return {
    answer,
    evidence,
    graphFacts,
    followUps,
    meta: {
      model: llmModelName(),
      embedding: embeddingProvider.name,
      keywordEnabled: req.useKeyword ?? true,
      vectorEnabled: req.useVector ?? true,
      graphEnabled,
      retrievedChunks: evidence.length,
      keywordMs: retrieval.keywordMs,
      vectorMs: retrieval.vectorMs,
      totalMs: Math.round(performance.now() - t0),
    },
  };
}
