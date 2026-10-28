import { db } from "@/lib/db";

/**
 * تشخیص وضعیت پایگاه‌داده و مدیریت «حالت نمایشی».
 * اگر DATABASE_URL در دسترس نباشد (مثلاً استقرار Vercel بدون دیتابیس)،
 * برنامه به‌جای خطای ۵۰۰، با دادهٔ نمونهٔ مصنوعیِ برچسب‌دار بالا می‌آید.
 */

export type AppMode = "live" | "demo";

let cached: { value: boolean; at: number } | null = null;
const CACHE_TTL_MS = 15_000;

/** آیا پایگاه‌داده در دسترس است؟ (نتیجه ۱۵ ثانیه کش می‌شود) */
export async function isDbAvailable(): Promise<boolean> {
  if (process.env.FORCE_DEMO_MODE === "1") return false;
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;

  let value = false;
  try {
    await db.$queryRaw`SELECT 1`;
    value = true;
  } catch {
    value = false;
  }
  cached = { value, at: now };
  return value;
}

/** اجرای عملیات خواندن با fallback به دادهٔ نمایشی */
export async function dbOrDemo<T>(live: () => Promise<T>, demo: () => T): Promise<{ data: T; source: AppMode }> {
  if (await isDbAvailable()) {
    try {
      return { data: await live(), source: "live" };
    } catch {
      return { data: demo(), source: "demo" };
    }
  }
  return { data: demo(), source: "demo" };
}

/**
 * محافظ عملیات‌های نوشتن در حالت نمایشی —
 * دادهٔ نمایشی تغییرناپذیر است تا وعدهٔ «فقط نمایشی» صادق بماند.
 */
export async function requireDb(): Promise<void> {
  if (!(await isDbAvailable())) {
    const { ServiceError } = await import("@/lib/api");
    throw new ServiceError(
      "DEMO_MODE",
      "در حال حاضر ذخیره‌سازی در دسترس نیست؛ لطفاً بعداً دوباره تلاش کنید.",
      503,
    );
  }
}
