import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";
import { isDbAvailable } from "@/lib/demo/mode";
import { demoTraverse } from "@/lib/demo/demo-data";
import { traverseGraph } from "@/lib/services/graph";

export const dynamic = "force-dynamic";

const TraverseSchema = z.object({
  entityId: z.string().uuid(),
  maxDepth: z.number().int().min(1).max(3).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = TraverseSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    const paths = (await isDbAvailable())
      ? await traverseGraph(parsed.data.entityId, parsed.data.maxDepth ?? 2)
      : demoTraverse(parsed.data.entityId, parsed.data.maxDepth ?? 2);
    return ok({ paths });
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("TRAVERSE_FAILED", "پیمایش گراف ناموفق بود.", 500);
  }
}
