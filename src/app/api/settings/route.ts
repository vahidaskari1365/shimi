import { db } from "@/lib/db";
import { ok } from "@/lib/api";
import { ENV } from "@/lib/env";
import { isDbAvailable } from "@/lib/demo/mode";
import { demoCounts } from "@/lib/demo/demo-data";
import { embeddingProvider } from "@/lib/retrieval/embeddings";
import { llmModelName, llmProviderName } from "@/lib/llm/provider";
import type { SettingsDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const live = await isDbAvailable();
  let counts: SettingsDTO["counts"];
  if (live) {
    try {
      const [documents, chunks, ingredients, formulations, graphEntities, graphRelationships, cases] =
        await Promise.all([
          db.document.count(),
          db.chunk.count(),
          db.ingredient.count(),
          db.formulation.count(),
          db.graphEntity.count(),
          db.graphRelationship.count(),
          db.troubleshootingCase.count(),
        ]);
      counts = { documents, chunks, ingredients, formulations, graphEntities, graphRelationships, cases };
    } catch {
      counts = demoCounts();
    }
  } else {
    counts = demoCounts();
  }

  const body: SettingsDTO = {
    mode: live ? "live" : "demo",
    llmProvider: llmProviderName(),
    llmModel: llmModelName(),
    embeddingProvider: embeddingProvider.name,
    embeddingDim: embeddingProvider.dim,
    retrieval: {
      topK: ENV.retrievalTopK,
      rrfK: ENV.rrfK,
      chunkSize: ENV.chunkSize,
      chunkOverlap: ENV.chunkOverlap,
      keywordEnabled: true,
      vectorEnabled: true,
      graphEnabled: true,
    },
    limits: {
      maxUploadMB: ENV.maxUploadMB,
      allowedExtensions: [...ENV.allowedExtensions],
    },
    counts,
    security: {
      authEnabled: false,
      notes: [
        "این MVP احراز هویت ندارد و فقط در محیط محلی/داخلی اجرا شود؛ هرگز در دسترس عموم قرار نگیرد.",
        "فایل‌های بارگذاری‌شده خارج از پوشهٔ عمومی ذخیره می‌شوند و فقط از طریق API سرور خوانده می‌شوند.",
        "نام فایل‌ها پاک‌سازی می‌شوند و مسیر ذخیره با UUID ساخته می‌شود (محافظت از path traversal).",
        "دسترسی پایگاه‌داده فقط با کوئری‌های پارامتری Prisma انجام می‌شود (محافظت در برابر SQL Injection).",
        "متن کامل اسناد در لاگ‌ها نوشته نمی‌شود؛ فقط رویدادهای حسابرسی (نوع عملیات و شناسه) ثبت می‌گردد.",
        "مدل زبانی پیش‌فرض سمت سرور اجرا می‌شود؛ قبل از فعال‌کردن هر ارائه‌دهندهٔ خارجی، سیاست دادهٔ محرمانه را بررسی کنید.",
      ],
    },
    disclaimer:
      "این سیستم ابزار پژوهشی است: پاسخ‌ها استنادشده اما تضمین‌شده نیستند و جایگزین آزمایش، شیمی‌دان مجرب و بازبینی مقرراتی نمی‌شوند.",
  };

  return ok(body);
}
