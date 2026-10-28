import { z } from "zod";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/api";
import { retrieveHybrid } from "@/lib/retrieval/hybrid";
import { llmComplete, extractJson } from "@/lib/llm/provider";
import { TROUBLESHOOTING_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import type {
  TroubleshootingAnalysis,
  TroubleshootingCaseDTO,
} from "@/lib/types";

/**
 * جریان محتاطانهٔ عیب‌یابی:
 *  ۱) ثبت پرونده با علائم/شرایط/اندازه‌گیری‌ها
 *  ۲) بازیابی مدارک مرتبط
 *  ۳) تحلیل LLM: عوامل احتمالی «مبتنی بر شواهد» + اطلاعات لازم + اقدامات بررسی
 *  هیچ علت قطعی یا دستور تغییر فرمول تولید صادر نمی‌شود.
 */

const AnalysisSchema = z.object({
  summary: z.string().max(2000).optional().nullable(),
  possibleFactors: z
    .array(
      z.object({
        factor: z.string().min(1).max(300),
        rationale: z.string().max(800),
        evidenceRefs: z.array(z.number().int().min(1).max(50)).max(10).optional(),
        confidence: z.enum(["کم", "متوسط", "زیاد"]),
      }),
    )
    .max(8),
  missingInfo: z.array(z.string().max(300)).max(10).optional(),
  suggestedInvestigations: z.array(z.string().max(400)).max(10).optional(),
  disclaimer: z.string().max(600).optional().nullable(),
});

const DEFAULT_DISCLAIMER =
  "این تحلیل فقط «عوامل احتمالیِ مبتنی بر مدارک بازیابی‌شده» است، نه علت قطعی. هیچ تصمیم تولیدی یا تغییر فرمول بر این مبنا انجام نشود؛ تأیید نهایی با شیمی‌دان، آزمایش و بازبینی ایمنی است.";

function toCaseDTO(row: {
  id: string;
  title: string;
  productCategory: string;
  symptoms: string;
  manufacturingConditions: string | null;
  measurements: string | null;
  status: string;
  analysis: string | null;
  createdAt: Date;
}): TroubleshootingCaseDTO {
  let analysis: TroubleshootingAnalysis | null = null;
  if (row.analysis) {
    try {
      analysis = JSON.parse(row.analysis) as TroubleshootingAnalysis;
    } catch {
      analysis = null;
    }
  }
  return {
    id: row.id,
    title: row.title,
    productCategory: row.productCategory,
    symptoms: row.symptoms,
    manufacturingConditions: row.manufacturingConditions,
    measurements: row.measurements,
    status: row.status,
    analysis,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listCases(): Promise<TroubleshootingCaseDTO[]> {
  const rows = await db.troubleshootingCase.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map(toCaseDTO);
}

export async function getCase(id: string): Promise<TroubleshootingCaseDTO> {
  const row = await db.troubleshootingCase.findUnique({ where: { id } });
  if (!row) throw new ServiceError("NOT_FOUND", "پرونده یافت نشد.", 404);
  return toCaseDTO(row);
}

export async function createAndAnalyzeCase(input: {
  title: string;
  productCategory: string;
  symptoms: string;
  manufacturingConditions: string | null;
  measurements: string | null;
}): Promise<{ case: TroubleshootingCaseDTO; analysisError: string | null }> {
  const created = await db.troubleshootingCase.create({
    data: {
      title: input.title,
      productCategory: input.productCategory,
      symptoms: input.symptoms,
      manufacturingConditions: input.manufacturingConditions,
      measurements: input.measurements,
      status: "open",
    },
  });

  // بازیابی مدارک مرتبط
  const query = [input.symptoms, input.productCategory, input.manufacturingConditions, input.measurements]
    .filter(Boolean)
    .join(" ");
  const retrieval = await retrieveHybrid({ query, topK: 8 });

  const analysisError: string | null = null;
  let analysisJson: string | null = null;

  if (retrieval.evidence.length === 0) {
    analysisJson = JSON.stringify({
      summary:
        "هیچ مدرک مرتبطی در مخزن دانش یافت نشد؛ بنابراین هیچ عامل احتمالی مستندی پیشنهاد نمی‌شود.",
      possibleFactors: [],
      missingInfo: ["سند فنی یا گزارش آزمایش مرتبط با این محصول بارگذاری شود"],
      suggestedInvestigations: [
        "بارگذاری اسناد فنی محصول در تب «اسناد» و سپس تحلیل مجدد",
        "ثبت اندازه‌گیری‌های پایه (pH، ویسکوزیته، دما) در فرمولاسیون مرتبط",
      ],
      evidence: [],
      disclaimer: DEFAULT_DISCLAIMER,
    } satisfies TroubleshootingAnalysis);
  } else {
    const evidenceBlock = retrieval.evidence
      .map(
        (e) =>
          `[${e.index}] سند: «${e.documentTitle}»${e.page !== null ? ` — صفحهٔ ${e.page}` : ""}\n${e.snippet}`,
      )
      .join("\n\n");

    try {
      const raw = await llmComplete([
        { role: "assistant", content: TROUBLESHOOTING_SYSTEM_PROMPT },
        {
          role: "user",
          content: `پروندهٔ عیب‌یابی:
عنوان: ${input.title}
دستهٔ محصول: ${input.productCategory}
علائم: ${input.symptoms}
شرایط تولید: ${input.manufacturingConditions ?? "ثبت نشده"}
اندازه‌گیری‌ها: ${input.measurements ?? "ثبت نشده"}

— مدارک بازیابی‌شده —
${evidenceBlock}`,
        },
      ]);
      const parsed = extractJson<unknown>(raw);
      const validated = parsed ? AnalysisSchema.safeParse(parsed) : null;
      if (validated?.success) {
        const maxRef = retrieval.evidence.length;
        const analysis: TroubleshootingAnalysis = {
          summary: validated.data.summary ?? "",
          possibleFactors: validated.data.possibleFactors.map((f) => ({
            factor: f.factor,
            rationale: f.rationale,
            evidenceRefs: (f.evidenceRefs ?? []).filter((n) => n <= maxRef),
            confidence: f.confidence,
          })),
          missingInfo: validated.data.missingInfo ?? [],
          suggestedInvestigations: validated.data.suggestedInvestigations ?? [],
          evidence: retrieval.evidence,
          disclaimer: validated.data.disclaimer ?? DEFAULT_DISCLAIMER,
        };
        analysisJson = JSON.stringify(analysis);
      } else {
        analysisJson = JSON.stringify({
          summary: "پاسخ مدل قابل ساختاردهی نبود؛ پاسخ خام ذخیره نشد تا به‌عنوان واقعیت گرفته نشود.",
          possibleFactors: [],
          missingInfo: ["اجرای مجدد تحلیل"],
          suggestedInvestigations: [],
          evidence: retrieval.evidence,
          disclaimer: DEFAULT_DISCLAIMER,
        } satisfies TroubleshootingAnalysis);
      }
    } catch {
      // LLM در دسترس نیست — پرونده بدون تحلیل ذخیره می‌شود
    }
  }

  const updated = await db.troubleshootingCase.update({
    where: { id: created.id },
    data: { analysis: analysisJson },
  });

  return { case: toCaseDTO(updated), analysisError };
}

export async function listCasesForSeed(): Promise<number> {
  return db.troubleshootingCase.count();
}
