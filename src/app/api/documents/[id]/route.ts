import type { NextRequest } from "next/server";
import { fail, ok, ServiceError } from "@/lib/api";
import { requireDb } from "@/lib/demo/mode";
import { deleteDocument } from "@/lib/services/ingestion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireDb();
    const { id } = await ctx.params;
    await deleteDocument(id);
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("DELETE_FAILED", "حذف سند ناموفق بود.", 500);
  }
}
