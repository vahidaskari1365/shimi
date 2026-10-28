import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";
import type { IngredientDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().min(2).max(120),
  inciName: z.string().max(160).nullable().optional(),
  category: z.string().min(1).max(60),
  description: z.string().max(2000).nullable().optional(),
  casNumber: z.string().max(40).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query")?.trim().toLowerCase() ?? "";
    const rows = await db.ingredient.findMany({ orderBy: { name: "asc" }, take: 500 });
    const filtered = query
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            (r.inciName ?? "").toLowerCase().includes(query) ||
            r.category.toLowerCase().includes(query),
        )
      : rows;
    const ingredients: IngredientDTO[] = filtered.map((r) => ({
      id: r.id,
      name: r.name,
      inciName: r.inciName,
      category: r.category,
      description: r.description,
      casNumber: r.casNumber,
      isSeed: r.isSeed,
      createdAt: r.createdAt.toISOString(),
    }));
    return ok({ ingredients });
  } catch {
    return fail("LIST_FAILED", "دریافت فهرست مواد اولیه ناموفق بود.", 500);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    const created = await db.ingredient.create({
      data: {
        name: parsed.data.name.trim(),
        inciName: parsed.data.inciName?.trim() || null,
        category: parsed.data.category,
        description: parsed.data.description?.trim() || null,
        casNumber: parsed.data.casNumber?.trim() || null,
      },
    });
    return ok({ ingredient: { ...created, createdAt: created.createdAt.toISOString() } }, 201);
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return fail("DUPLICATE", "ماده‌ای با این نام قبلاً ثبت شده است.", 409);
    }
    return fail("CREATE_FAILED", "ثبت ماده اولیه ناموفق بود.", 500);
  }
}
