import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, zodFail, ServiceError } from "@/lib/api";
import { answerQuestion } from "@/lib/services/chat";
import type { ChatResponseDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  question: z.string().min(2).max(2000),
  topK: z.number().int().min(1).max(30).optional(),
  useKeyword: z.boolean().optional(),
  useVector: z.boolean().optional(),
  useGraph: z.boolean().optional(),
  documentId: z.string().uuid().nullable().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  try {
    const result: ChatResponseDTO = await answerQuestion(parsed.data);
    return ok(result);
  } catch (err) {
    if (err instanceof ServiceError) return fail(err.code, err.message, err.status);
    return fail("CHAT_FAILED", "پاسخ‌گویی ناموفق بود.", 500);
  }
}
