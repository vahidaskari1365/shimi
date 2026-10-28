import { ok } from "@/lib/api";
import { APP_VERSION } from "@/lib/env";
import { isDbAvailable } from "@/lib/demo/mode";
import { llmConfigured, llmModelName, llmProviderName } from "@/lib/llm/provider";
import type { HealthDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await isDbAvailable();

  const body: HealthDTO = {
    status: database ? "ok" : "degraded",
    database,
    llmConfigured: llmConfigured(),
    mode: database ? "live" : "demo",
    time: new Date().toISOString(),
    version: APP_VERSION,
    model: llmModelName(),
    provider: llmProviderName(),
  };
  return ok(body);
}
