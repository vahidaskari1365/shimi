import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, zodFail } from "@/lib/api";
import { requireDb } from "@/lib/demo/mode";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  title: z.string().min(2).max(160),
  summary: z.string().max(2000).nullable().optional(),
  results: z.string().max(4000).nullable().optional(),
  status: z.enum(["planned", "running", "completed", "cancelled"]).optional(),
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

    const created = await db.experiment.create({
      data: {
        formulationId: id,
        title: parsed.data.title.trim(),
        summary: parsed.data.summary?.trim() || null,
        results: parsed.data.results?.trim() || null,
        status: parsed.data.status ?? "planned",
      },
    });
    return ok({ experiment: { ...created, createdAt: created.createdAt.toISOString() } }, 201);
  } catch {
    return fail("CREATE_FAILED", "ثبت آزمایش ناموفق بود.", 500);
  }
}
