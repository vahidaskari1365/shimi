import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";
import { isDbAvailable, requireDb } from "@/lib/demo/mode";
import { demoFormulationDetail } from "@/lib/demo/demo-data";
import type { FormulationDetailDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["draft", "in_review", "approved", "deprecated"]).optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!(await isDbAvailable())) {
    const demo = demoFormulationDetail(id);
    if (demo) return ok(demo);
    return fail("NOT_FOUND", "فرمولاسیون یافت نشد.", 404);
  }
  try {
    const row = await db.formulation.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: { ingredient: { select: { name: true } } },
          orderBy: { percentage: "desc" },
        },
        measurements: { orderBy: { createdAt: "desc" } },
        experiments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!row) return fail("NOT_FOUND", "فرمولاسیون یافت نشد.", 404);

    const detail: FormulationDetailDTO = {
      id: row.id,
      name: row.name,
      version: row.version,
      productCategory: row.productCategory,
      description: row.description,
      status: row.status,
      ingredientCount: row.ingredients.length,
      isSeed: row.isSeed,
      createdAt: row.createdAt.toISOString(),
      ingredients: row.ingredients.map((ri) => ({
        id: ri.id,
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredient.name,
        percentage: ri.percentage,
        unit: ri.unit,
        phase: ri.phase,
        note: ri.note,
      })),
      measurements: row.measurements.map((m) => ({
        id: m.id,
        name: m.name,
        value: m.value,
        unit: m.unit,
        method: m.method,
        note: m.note,
        createdAt: m.createdAt.toISOString(),
      })),
      experiments: row.experiments.map((e) => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
        results: e.results,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
      })),
    };
    return ok(detail);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("GET_FAILED", "دریافت فرمولاسیون ناموفق بود.", 500);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    await requireDb();
    const { id } = await ctx.params;
    await db.formulation.update({ where: { id }, data: parsed.data });
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2025") {
      return fail("NOT_FOUND", "فرمولاسیون یافت نشد.", 404);
    }
    return fail("UPDATE_FAILED", "به‌روزرسانی فرمولاسیون ناموفق بود.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireDb();
    const { id } = await ctx.params;
    await db.formulation.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2025") {
      return fail("NOT_FOUND", "فرمولاسیون یافت نشد.", 404);
    }
    return fail("DELETE_FAILED", "حذف فرمولاسیون ناموفق بود.", 500);
  }
}
