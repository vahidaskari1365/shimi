import { fail, ok, ServiceError } from "@/lib/api";
import { requireDb } from "@/lib/demo/mode";
import { runSeed } from "@/lib/services/seed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    await requireDb();
    const result = await runSeed();
    return ok(result, result.skipped ? 200 : 201);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("SEED_FAILED", "بارگذاری دادهٔ نمایشی ناموفق بود.", 500);
  }
}
