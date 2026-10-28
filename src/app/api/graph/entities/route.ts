import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";
import { listEntities, upsertEntity } from "@/lib/services/graph";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  type: z.enum([
    "Ingredient",
    "Formulation",
    "Product",
    "Property",
    "Supplier",
    "ManufacturingProcess",
    "FailureMode",
    "Document",
  ]),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    const query = req.nextUrl.searchParams.get("query");
    const entities = await listEntities(type, query);
    return ok({ entities });
  } catch {
    return fail("LIST_FAILED", "دریافت موجودیت‌های گراف ناموفق بود.", 500);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    // رکورد دستی کاربر → تأییدشده در نظر گرفته می‌شود
    const entity = await upsertEntity({ ...parsed.data, verified: true, confidence: 1 });
    return ok({ entity }, 201);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("CREATE_FAILED", "ثبت موجودیت ناموفق بود.", 500);
  }
}
