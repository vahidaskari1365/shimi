// نرمال‌سازی و توکن‌سازی متن فارسی/انگلیسی برای بازیابی

const STOPWORDS = new Set([
  // فارسی
  "از","به","با","که","این","را","برای","و","در","است","می","های","تا","هم","بر","آن","یک",
  "روی","یا","اگر","اما","هستند","شود","شده","دارد","کند","کرد","کنید","باشد","نیز","هر",
  "چه","چگونه","چطور","چیست","باید","بود","خود","هایی","اثر","مورد",
  "دیگر","بین","پس","آنها","ما","شما","من","همه","بیشتر","کمتر","اول","داخل",
  // انگلیسی
  "the","a","an","of","in","to","for","is","are","and","or","on","with","by","as","at",
  "it","its","this","that","be","was","were","from","not","can","will","do","does",
]);

// اعراب (فتحه تا سکون)، مدّ، علامت‌های قرآنی و کاراکترهای کنترل جهت
const DIACRITICS_AND_CONTROLS = new RegExp(
  "[" +
    "\\u064B-\\u0652" + // تنوین و اعراب
    "\\u0670" + // admitted alef khanjariah
    "\\u0640" + // کشیده (tatweel)
    "\\u200b-\\u200f" + // zero-width ها و mark های جهت
    "\\u202a-\\u202e" + // کنترل جهت
    "\\u2066-\\u2069" + // isolate ها
    "]",
  "g",
);

/** یکسان‌سازی حروف عربی/فارسی، ارقام، اعراب و نیم‌فاصله */
export function normalizePersian(text: string): string {
  return text
    .replace(DIACRITICS_AND_CONTROLS, "")
    .replace(/\u200c/g, " ") // نیم‌فاصله → فاصله (برای تطبیق بهتر)
    .replace(/[يى]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ی")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .toLowerCase();
}

/** توکن‌سازی: نرمال‌سازی + شکستن روی نقطه‌گذاری/فاصله + حذف ایست‌واژه‌ها */
export function tokenize(text: string): string[] {
  const norm = normalizePersian(text);
  return norm
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2 && t.length <= 40 && !STOPWORDS.has(t));
}

/** هر دو شکل ی/ک و فاصله‌ها را برای جستجوی زیررشته یکسان می‌کند */
export function normalizeForContains(text: string): string {
  return normalizePersian(text).replace(/\s+/g, " ").trim();
}
