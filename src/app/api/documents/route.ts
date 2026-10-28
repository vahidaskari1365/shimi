import type { NextRequest } from "next/server";
import { fail, ok, ServiceError } from "@/lib/api";
import { ENV } from "@/lib/env";
import { dbOrDemo, requireDb } from "@/lib/demo/mode";
import { demoDocuments } from "@/lib/demo/demo-data";
import { createDocument, listDocuments } from "@/lib/services/ingestion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, source } = await dbOrDemo(
      () => listDocuments(),
      () => demoDocuments(),
    );
    return ok({ documents: data, mode: source });
  } catch {
    return fail("LIST_FAILED", "دریافت فهرست اسناد ناموفق بود.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireDb();
    const form = await req.formData().catch(() => null);
    if (!form) {
      return fail("BAD_REQUEST", "درخواست multipart معتبر نیست.", 400);
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail("NO_FILE", "فایلی ارسال نشده است.", 400);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!(ENV.allowedExtensions as readonly string[]).includes(ext)) {
      return fail("BAD_TYPE", `پسوند «.${ext}» مجاز نیست. فرمت‌های مجاز: PDF، TXT، Markdown، CSV`, 422);
    }
    if (file.size > ENV.maxUploadMB * 1024 * 1024) {
      return fail("TOO_LARGE", `حجم فایل بیش از ${ENV.maxUploadMB} مگابایت است.`, 413);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { document, duplicate } = await createDocument({
      title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || file.name,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
    });

    return ok({ document, duplicate }, duplicate ? 200 : 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return fail(err.code, err.message, err.status);
    }
    return fail("UPLOAD_FAILED", "بارگذاری و نمایه‌سازی سند ناموفق بود.", 500);
  }
}
