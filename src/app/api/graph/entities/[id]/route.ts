import type { NextRequest } from "next/server";
import { fail, ok, ServiceError } from "@/lib/api";
import { getEntityDetail, deleteEntity } from "@/lib/services/graph";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const entity = await getEntityDetail(id);
    return ok(entity);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("GET_FAILED", "دریافت موجودیت ناموفق بود.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await deleteEntity(id);
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("DELETE_FAILED", "حذف موجودیت ناموفق بود.", 500);
  }
}
