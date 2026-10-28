import type { NextRequest } from "next/server";
import { fail, ok, ServiceError } from "@/lib/api";
import { extractGraphFromDocument } from "@/lib/services/graph";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const result = await extractGraphFromDocument(id);
    return ok(result);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("GRAPH_EXTRACT_FAILED", "استخراج گراف از سند ناموفق بود.", 500);
  }
}
