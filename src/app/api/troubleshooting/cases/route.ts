import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";
import { dbOrDemo, requireDb } from "@/lib/demo/mode";
import { demoTroubleshootingCases } from "@/lib/demo/demo-data";
import { listCases, createAndAnalyzeCase } from "@/lib/services/troubleshooting";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateSchema = z.object({
  title: z.string().min(3).max(160),
  productCategory: z.string().min(1).max(60),
  symptoms: z.string().min(5).max(3000),
  manufacturingConditions: z.string().max(2000).nullable().optional(),
  measurements: z.string().max(2000).nullable().optional(),
  formulationId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  try {
    const { data, source } = await dbOrDemo(
      () => listCases(),
      () => demoTroubleshootingCases(),
    );
    return ok({ cases: data, mode: source });
  } catch {
    return fail("LIST_FAILED", "دریافت پرونده‌ها ناموفق بود.", 500);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    await requireDb();
    const result = await createAndAnalyzeCase({
      title: parsed.data.title.trim(),
      productCategory: parsed.data.productCategory,
      symptoms: parsed.data.symptoms.trim(),
      manufacturingConditions: parsed.data.manufacturingConditions?.trim() || null,
      measurements: parsed.data.measurements?.trim() || null,
      formulationId: undefined,
    });
    return ok(result, 201);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("CREATE_FAILED", "ثبت پروندهٔ عیب‌یابی ناموفق بود.", 500);
  }
}
