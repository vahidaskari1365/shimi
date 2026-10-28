import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";
import { dbOrDemo, requireDb } from "@/lib/demo/mode";
import { demoFormulationSummaries } from "@/lib/demo/demo-data";
import type { FormulationSummaryDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().min(2).max(140),
  productCategory: z.string().min(1).max(60),
  description: z.string().max(2000).nullable().optional(),
  ingredients: z
    .array(
      z.object({
        ingredientId: z.string().uuid(),
        percentage: z.number().min(0).max(100),
        unit: z.string().max(20).optional(),
        phase: z.string().max(20).nullable().optional(),
        note: z.string().max(300).nullable().optional(),
      }),
    )
    .min(1)
    .max(60),
});

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query")?.trim().toLowerCase() ?? "";
    const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
    const { data, source } = await dbOrDemo(
      async () => {
        const rows = await db.formulation.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
          include: { _count: { select: { ingredients: true } } },
        });
        let filtered = rows;
        if (query) filtered = filtered.filter((r) => r.name.toLowerCase().includes(query));
        if (category) filtered = filtered.filter((r) => r.productCategory === category);
        return filtered.map(
          (r): FormulationSummaryDTO => ({
            id: r.id,
            name: r.name,
            version: r.version,
            productCategory: r.productCategory,
            description: r.description,
            status: r.status,
            ingredientCount: r._count.ingredients,
            isSeed: r.isSeed,
            createdAt: r.createdAt.toISOString(),
          }),
        );
      },
      () => {
        let list = demoFormulationSummaries();
        if (query) list = list.filter((r) => r.name.toLowerCase().includes(query));
        if (category) list = list.filter((r) => r.productCategory === category);
        return list;
      },
    );
    return ok({ formulations: data, mode: source });
  } catch {
    return fail("LIST_FAILED", "دریافت فهرست فرمولاسیون‌ها ناموفق بود.", 500);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const { name, productCategory, description, ingredients } = parsed.data;

  // اعتبارسنجی دامنه‌ای: مجموع درصدها و تکراری‌نبودن مواد
  const sum = ingredients.reduce((acc, i) => acc + i.percentage, 0);
  if (Math.abs(sum - 100) > 0.5) {
    return fail(
      "PERCENT_SUM",
      `مجموع درصدها باید ۱۰۰ باشد (مجموع فعلی: ${Math.round(sum * 100) / 100}).`,
      422,
    );
  }
  const ids = new Set(ingredients.map((i) => i.ingredientId));
  if (ids.size !== ingredients.length) {
    return fail("DUPLICATE_INGREDIENT", "هر ماده فقط یک‌بار در فرمول می‌آید.", 422);
  }

  // در حالت نمایشی، نوشتن مجاز نیست — قبل از هر کوئری دیتابیس بررسی می‌شود
  try {
    await requireDb();
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    throw err;
  }

  const existingIds = await db.ingredient.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true },
  });
  if (existingIds.length !== ids.size) {
    return fail("INGREDIENT_NOT_FOUND", "یک یا چند مادهٔ انتخابی وجود ندارد.", 422);
  }

  try {
    // نسخه‌بندی: اگر نام تکراری باشد نسخهٔ جدید ساخته می‌شود
    const maxVersion = await db.formulation.aggregate({
      where: { name: name.trim() },
      _max: { version: true },
    });
    const version = (maxVersion._max.version ?? 0) + 1;

    const created = await db.formulation.create({
      data: {
        name: name.trim(),
        version,
        productCategory,
        description: description?.trim() || null,
        ingredients: {
          create: ingredients.map((i) => ({
            ingredientId: i.ingredientId,
            percentage: i.percentage,
            unit: i.unit ?? "percent",
            phase: i.phase?.trim() || null,
            note: i.note?.trim() || null,
          })),
        },
      },
    });
    return ok({ formulation: { id: created.id, version } }, 201);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("CREATE_FAILED", "ثبت فرمولاسیون ناموفق بود.", 500);
  }
}
