import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";

/** پاسخ موفق یکنواخت */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** پاسخ خطای یکنواخت: { error: { code, message, details? } } */
export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/** تبدیل خطای اعتبارسنجی Zod به پاسخ ۴۲۲ استاندارد */
export function zodFail(err: ZodError): NextResponse {
  return fail("VALIDATION", "اعتبارسنجی ورودی ناموفق بود.", 422, err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  })));
}

/** خطای سطح سرویس با کد — برای تبدیل به پاسخ HTTP در route */
export class ServiceError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** ثبت رویداد حسابرسی (بدون لاگ محتوای اسناد) */
export async function audit(
  action: string,
  entityType: string,
  entityId?: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        action,
        entityType,
        entityId: entityId ?? null,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // حسابرسی هرگز جریان اصلی را نباید بشکند
  }
}
