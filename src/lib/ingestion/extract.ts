import Papa from "papaparse";
import { ServiceError } from "@/lib/api";

/**
 * استخراج متن از فایل‌ها با حفظ شماره صفحه (منشأ).
 * - PDF: با unpdf (پیج‌به‌پیج). اگر متن کافی نبود → needsOcr
 * - CSV: هر ~۲۵ ردیف یک «صفحهٔ» شبه‌جدول (حفظ جدول + ارجاع)
 * - TXT/MD: یک صفحه
 */

export interface ExtractedPage {
  page: number | null;
  text: string;
}

export interface ExtractResult {
  pages: ExtractedPage[];
  pageCount: number;
  needsOcr: boolean;
  warning: string | null;
}

function looksPersian(text: string): boolean {
  const letters = text.match(/[\p{L}]/gu)?.length ?? 0;
  if (letters === 0) return false;
  const persian = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  return persian / letters > 0.25;
}

async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { totalPages, text } = await extractText(pdf, { mergePages: false });
    const pageTexts = Array.isArray(text) ? text : [String(text)];
    const total = pageTexts.join("").trim();
    return {
      pages: pageTexts.map((t, i) => ({ page: i + 1, text: t })),
      pageCount: totalPages ?? pageTexts.length,
      needsOcr: total.length < 40,
      warning: null,
    };
  } catch {
    throw new ServiceError(
      "EXTRACT_PDF_FAILED",
      "استخراج متن از PDF ناموفق بود؛ فایل ممکن است خراب یا رمزگذاری‌شده باشد.",
      422,
    );
  }
}

function extractCsv(buffer: Buffer, fileName: string): ExtractResult {
  const text = buffer.toString("utf-8");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  if (headers.length === 0) {
    throw new ServiceError("EXTRACT_CSV_FAILED", "فایل CSV ستون قابل تشخیصی ندارد.", 422);
  }

  const rows = parsed.data.filter((r) => Object.values(r).some((v) => (v ?? "").trim() !== ""));
  if (rows.length === 0) {
    throw new ServiceError("EXTRACT_CSV_FAILED", "فایل CSV ردیف داده‌ای ندارد.", 422);
  }

  // هر گروه ۲۵ ردیف = یک صفحهٔ شبه‌جدول (ارجاع‌پذیر)
  const perPage = 25;
  const pages: ExtractedPage[] = [];
  for (let i = 0; i < rows.length; i += perPage) {
    const slice = rows.slice(i, i + perPage);
    const lines = [
      `# جدول «${fileName}» — ردیف‌های ${i + 1} تا ${i + slice.length}`,
      "",
      `| ${headers.join(" | ")} |`,
      `| ${headers.map(() => "---").join(" | ")} |`,
      ...slice.map((r) => `| ${headers.map((h) => (r[h] ?? "").replace(/\|/g, "/")).join(" | ")} |`),
    ];
    pages.push({ page: Math.floor(i / perPage) + 1, text: lines.join("\n") });
  }

  return {
    pages,
    pageCount: pages.length,
    needsOcr: false,
    warning:
      parsed.errors.length > 0
        ? `${parsed.errors.length} خطای جزئی در تجزیهٔ CSV نادیده گرفته شد (ردیف‌های بدشکل ممکن است کامل نباشند).`
        : null,
  };
}

export async function extractFile(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<ExtractResult & { persian: boolean }> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  let result: ExtractResult;
  if (ext === "pdf" || mimeType === "application/pdf") {
    result = await extractPdf(buffer);
  } else if (ext === "csv") {
    result = extractCsv(buffer, fileName);
  } else {
    // txt / md
    const text = buffer.toString("utf-8");
    if (text.trim().length === 0) {
      throw new ServiceError("EXTRACT_EMPTY", "فایل متنی خالی است.", 422);
    }
    result = { pages: [{ page: 1, text }], pageCount: 1, needsOcr: false, warning: null };
  }

  const fullText = result.pages.map((p) => p.text).join("\n");
  return { ...result, persian: looksPersian(fullText) };
}
