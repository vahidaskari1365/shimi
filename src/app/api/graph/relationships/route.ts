import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";
import { upsertRelationship } from "@/lib/services/graph";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  type: z.enum([
    "CONTAINS",
    "HAS_PROPERTY",
    "USED_IN",
    "SUPPLIED_BY",
    "ASSOCIATED_WITH",
    "CAUSES_OR_CONTRIBUTES_TO",
    "DOCUMENTED_IN",
  ]),
  evidence: z.string().max(1000).nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    // رابطهٔ دستی کاربر → تأییدشده
    const result = await upsertRelationship({ ...parsed.data, verified: true, confidence: parsed.data.confidence ?? 1 });
    return ok(result, result.created ? 201 : 200);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("CREATE_FAILED", "ثبت رابطه ناموفق بود.", 500);
  }
}
