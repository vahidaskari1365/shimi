// کمک‌تابع‌های فارسی‌سازی اعداد و تاریخ

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** تبدیل رقم‌های لاتین به فارسی (برای اعداد و رشته‌ها) */
export function faNum(value: number | string): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** عدد با جداکنندهٔ هزارگان فارسی */
export function faInt(value: number): string {
  return faNum(new Intl.NumberFormat("en-US").format(Math.round(value)));
}

/** درصد فارسی با حداکثر یک رقم اعشار */
export function faPct(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${faNum(rounded)}٪`;
}

/** حجم فایل خوانا */
export function faBytes(bytes: number): string {
  if (bytes < 1024) return `${faInt(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${faNum((bytes / 1024).toFixed(1))} کیلوبایت`;
  return `${faNum((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
}

/** تاریخ و ساعت شمسی */
export function faDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function faDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
