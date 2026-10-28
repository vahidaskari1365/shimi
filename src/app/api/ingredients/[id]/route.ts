import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  inciName: z.string().max(160).nullable().optional(),
  category: z.string().min(1).max(60).optional(),
  description: z.string().max(2000).nullable().optional(),
  casNumber: z.string().max(40).nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    const { id } = await ctx.params;
    await db.ingredient.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
        ...(parsed.data.inciName !== undefined ? { inciName: parsed.data.inciName?.trim() || null } : {}),
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description?.trim() || null }
          : {}),
        ...(parsed.data.casNumber !== undefined ? { casNumber: parsed.data.casNumber?.trim() || null } : {}),
      },
    });
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2025") {
      return fail("NOT_FOUND", "ماده اولیه یافت نشد.", 404);
    }
    return fail("UPDATE_FAILED", "به‌روزرسانی ماده اولیه ناموفق بود.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const usage = await db.formulationIngredient.count({ where: { ingredientId: id } });
    if (usage > 0) {
      return fail("IN_USE", `این ماده در ${usage} ردیف فرمولاسیون استفاده شده و حذف آن مجاز نیست.`, 409);
    }
    await db.ingredient.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2025") {
      return fail("NOT_FOUND", "ماده اولیه یافت نشد.", 404);
    }
    return fail("DELETE_FAILED", "حذف ماده اولیه ناموفق بود.", 500);
  }
}
