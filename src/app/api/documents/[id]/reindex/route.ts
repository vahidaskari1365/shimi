import type { NextRequest } from "next/server";
import { fail, ok, ServiceError } from "@/lib/api";
import { requireDb } from "@/lib/demo/mode";
import { reindexDocument } from "@/lib/services/ingestion";
import type { DocumentDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireDb();
    const { id } = await ctx.params;
    const document: DocumentDTO = await reindexDocument(id);
    return ok({ document });
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("REINDEX_FAILED", "بازنمایه‌سازی سند ناموفق بود.", 500);
  }
}
