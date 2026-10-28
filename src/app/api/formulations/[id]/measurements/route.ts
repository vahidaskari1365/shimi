import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, zodFail } from "@/lib/api";
import { requireDb } from "@/lib/demo/mode";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  value: z.number().finite(),
  unit: z.string().min(1).max(20),
  method: z.string().max(160).nullable().optional(),
  note: z.string().max(400).nullable().optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    await requireDb();
    const { id } = await ctx.params;
    const formulation = await db.formulation.findUnique({ where: { id }, select: { id: true } });
    if (!formulation) return fail("NOT_FOUND", "فرمولاسیون یافت نشد.", 404);

    const created = await db.propertyMeasurement.create({
      data: {
        formulationId: id,
        name: parsed.data.name.trim(),
        value: parsed.data.value,
        unit: parsed.data.unit,
        method: parsed.data.method?.trim() || null,
        note: parsed.data.note?.trim() || null,
      },
    });
    return ok({ measurement: { ...created, createdAt: created.createdAt.toISOString() } }, 201);
  } catch {
    return fail("CREATE_FAILED", "ثبت اندازه‌گیری ناموفق بود.", 500);
  }
}
