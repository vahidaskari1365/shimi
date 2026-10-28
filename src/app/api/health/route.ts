import { db } from "@/lib/db";
import { ok } from "@/lib/api";
import { APP_VERSION } from "@/lib/env";
import type { HealthDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  try {
    await db.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  const body: HealthDTO = {
    status: database ? "ok" : "degraded",
    database,
    llmConfigured: true, // ارائه‌دهندهٔ پیش‌فرض محیط همیشه پیکربندی است
    time: new Date().toISOString(),
    version: APP_VERSION,
  };
  return ok(body);
}
