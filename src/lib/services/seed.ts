import { db } from "@/lib/db";
import { audit } from "@/lib/api";
import { createDocument } from "@/lib/services/ingestion";
import { upsertEntity, upsertRelationship } from "@/lib/services/graph";
import { createAndAnalyzeCase } from "@/lib/services/troubleshooting";
import { invalidateRetrievalIndex } from "@/lib/retrieval/index-cache";

/**
 * دادهٔ نمایشی «کاملاً مصنوعی» برای دموی MVP.
 * هیچ عدد یا نتیجهٔ آزمایشگاهی واقعی نیست؛ همه با برچسب [نمونهٔ مصنوعی].
 */

const SEED_KEY = "seeded_v1";

const DOC_1 = `# اصول سورفکتانت‌ها و شاخص HLB [نمونهٔ مصنوعی]

این متن یک سند آموزشی نمایشی و کاملاً مصنوعی است و نباید مبنای تصمیم واقعی قرار گیرد.

## تعریف HLB
شاخص HLB (Hydrophilic-Lipophilic Balance) توازن آب‌دوستی و چربی‌دوستی یک سورفکتانت را نشان می‌دهد. در این سند نمایشی، مقادیر HLB بین صفر تا بیست گزارش می‌شوند.

## بازه‌های کاربرد HLB (نمونهٔ آموزشی)
- HLB حدود ۴ تا ۶: مناسب امولسیون‌کنندهٔ روغن در آب (W/O)
- HLB حدود ۷ تا ۹: مناسب مرطوب‌کننده
- HLB حدود ۱۲ تا ۱۶: مناسب شوینده و کف‌ساز در سیستم‌های شفاف
- HLB حدود ۱۶ تا ۱۸: مناسب حل‌کنندهٔ ترکیبات معطر در آب

## نقش HLB در انتخاب سورفکتانت شامپو
برای شامپو معمولاً ترکیبی از سورفکتانت آنیونی اصلی با HLB بالاتر و سورفکتانت آمفوتریک ثانویه استفاده می‌شود تا کف‌سازی خوب و ملایمت پوستی هم‌زمان حاصل شود. طبق این سند نمایشی، ترکیب سورفکتانت آنیونی با آمفوتریک، تحریک‌پذیری چشم را کاهش می‌دهد.

## محاسبهٔ HLB مخلوط
HLB مخلوط از میانگین وزنی درصدهای هر سورفکتانت محاسبه می‌شود: مجموع حاصل‌ضرب HLB هر جزء در درصد وزنی آن، تقسیم بر ۱۰۰.

## نکات پایداری کف
سخت بودن آب (کلسیم و منیزیم بالا) طبق این سند نمایشی می‌تواند کیفیت کف را کاهش دهد؛ استفاده از سکوسترکنت مانند EDTA در فرمول از افت کف جلوگیری می‌کند.`;

const DOC_2 = `# فرمولاسیون پایهٔ شامپو و نکات تولید [نمونهٔ مصنوعی]

سند نمایشی؛ همهٔ مقادیر فرضی هستند.

## فازبندی و ترتیب افزودن
- فاز A: آب دیونیزه، سورفکتانت آنیونی اصلی (لاریل اتر سولفات سدیم)، فعال‌کنندهٔ ثانویه (کوکامیدوپروپیل بتائین)
- فاز B: مواد فعال مراقبتی مثل پانتنول و گلیسیرین به‌عنوان نرم‌کنندهٔ پوست و مو
- فاز C: عدل‌کنندهٔ pH (اسید سیتریک)، تغلیظ‌کنندهٔ نمکی (کلرید سدیم)، نگهدارنده و عطر

## توالی تولید (نمونه)
۱. حل‌کردن فاز A در دمای محیط با همزدن آرام برای پرهیز از حباب زیاد
۲. افزودن فاز B پس از شفاف شدن فاز A
۳. عدل pH به بازهٔ ۵ تا ۵٫۵ با اسید سیتریک
۴. تغلیظ نهایی با محلول نمک به‌صورت تدریجی

## منحنی نمک و ویسکوزیته
طبق این سند نمایشی، افزودن نمک ابتدا ویسکوزیته را بالا می‌برد و بعد از نقطهٔ بهینه، با بیش‌اشباع شدن، ویسکوزیته افت می‌کند. بنابراین نمک باید محلول و تدریجی اضافه شود.

## pH و نگهدارنده
نگهدارنده‌های رایج فنوکسی‌اتانول‌محور در pH حدود ۵ کارایی بهتری دارند. pH بالای ۶ هم برای پوست نامطلوب است و هم پایداری برخی نگهدارنده‌ها را کم می‌کند.`;

const DOC_3 = `# عیب‌یابی رایج مایع ظرفشویی [نمونهٔ مصنوعی]

سند نمایشی برای دمو.

## کدری یا رسوب
- عامل احتمالی ۱: نمک اضافه‌شده بیش از حد منحنی نمک — طبق سند شامپو، بیش‌اشباع نمک باعث افت ویسکوزیته و کدری می‌شود.
- عامل احتمالی ۲: اختلاط ناقص سورفکتانت در دمای پایین؛ محلول باید در دمای محیط به‌طور کامل شفاف شود.
- عامل احتمالی ۳: آلودگی میکروبی که از سند نگهدارنده‌ها قابل پیگیری است.

## افت ویسکوزیته پس از انبارش
- نوسان دمای انبار و ناپایداری امولسیون
- هیدرولیز سورفکتانت در pH نامناسب
- بیش‌رقیق‌شدن حین تولید

## آزمون‌های پیشنهادی (نمونه)
۱. اندازه‌گیری pH نمونهٔ مشکوک در برابر نمونهٔ استاندارد
۲. تکرار آزمون منحنی نمک روی نمونهٔ آزمایشگاهی کوچک
۳. بررسی شفافیت پس از ۲۴ ساعت سکون در دمای ثابت`;

const INGREDIENTS = [
  { name: "لاریل اتر سولفات سدیم", inciName: "Sodium Laureth Sulfate", category: "سورفکتانت", casNumber: "68585-34-2", description: "سورفکتانت آنیونی اصلی با کف‌سازی خوب [نمونهٔ مصنوعی]" },
  { name: "کوکامیدوپروپیل بتائین", inciName: "Cocamidopropyl Betaine", category: "سورفکتانت", casNumber: "61789-40-0", description: "سورفکتانت آمفوتریک؛ افزایش ملایمت و پایداری کف [نمونهٔ مصنوعی]" },
  { name: "کوکو گلوکوزید", inciName: "Coco-Glucoside", category: "سورفکتانت", casNumber: "141464-42-8", description: "سورفکتانت غیریونی ملایم گیاهی [نمونهٔ مصنوعی]" },
  { name: "گلیسیرین", inciName: "Glycerin", category: "فعال‌کننده و نرم‌کننده", casNumber: "56-81-5", description: "مرطوب‌کنندهٔ جاذب رطوبت [نمونهٔ مصنوعی]" },
  { name: "کلرید سدیم", inciName: "Sodium Chloride", category: "تغلیظ‌کننده", casNumber: "7647-14-5", description: "تغلیظ‌کنندهٔ نمکی برای سیستم‌های سولفاتی [نمونهٔ مصنوعی]" },
  { name: "اسید سیتریک", inciName: "Citric Acid", category: "عدل‌کننده pH", casNumber: "77-92-9", description: "عدل‌کنندهٔ pH به بازهٔ اساسی ملایم [نمونهٔ مصنوعی]" },
  { name: "فنوکسی اتانول", inciName: "Phenoxyethanol", category: "نگهدارنده", casNumber: "122-99-6", description: "نگهدارندهٔ پرمصرف؛ در pH اساسی پایدار [نمونهٔ مصنوعی]" },
  { name: "پانتنول", inciName: "Panthenol", category: "فعال دارویی/مراقبتی", casNumber: "81-13-0", description: "فعال مراقبت مو و پوست [نمونهٔ مصنوعی]" },
  { name: "عطر مخصوص شامپو", inciName: "Parfum", category: "عطر و رنگ", casNumber: null, description: "ترکیب معطر نمایشی [نمونهٔ مصنوعی]" },
  { name: "آب دیونیزه", inciName: "Aqua", category: "آب و حلال", casNumber: "7732-18-5", description: "حلال پایه [نمونهٔ مصنوعی]" },
];

export interface SeedResult {
  created: {
    documents: number;
    ingredients: number;
    formulations: number;
    cases: number;
    graphEntities: number;
    graphRelationships: number;
  };
  skipped: boolean;
}

export async function runSeed(): Promise<SeedResult> {
  const existing = await db.appSetting.findUnique({ where: { key: SEED_KEY } });
  if (existing) {
    return {
      created: { documents: 0, ingredients: 0, formulations: 0, cases: 0, graphEntities: 0, graphRelationships: 0 },
      skipped: true,
    };
  }
  // ادعای اجرا — در صورت خطا آزاد می‌شود تا عملیات قابل تکرار باشد
  await db.appSetting.create({ data: { key: SEED_KEY, value: new Date().toISOString() } });
  try {
    return await runSeedInner();
  } catch (err) {
    await db.appSetting.delete({ where: { key: SEED_KEY } }).catch(() => undefined);
    throw err;
  }
}

const SEED_ZERO: SeedResult["created"] = {
  documents: 0,
  ingredients: 0,
  formulations: 0,
  cases: 0,
  graphEntities: 0,
  graphRelationships: 0,
};

async function runSeedInner(): Promise<SeedResult> {
  const created = { ...SEED_ZERO };

  // ── اسناد نمایشی ──
  const docs = [
    { title: "اصول سورفکتانت‌ها و HLB [نمونهٔ مصنوعی]", text: DOC_1 },
    { title: "فرمولاسیون پایهٔ شامپو و نکات تولید [نمونهٔ مصنوعی]", text: DOC_2 },
    { title: "عیب‌یابی رایج مایع ظرفشویی [نمونهٔ مصنوعی]", text: DOC_3 },
  ];
  let doc1Id: string | null = null;
  for (const d of docs) {
    const res = await createDocument({
      title: d.title,
      originalName: `${d.title}.md`,
      mimeType: "text/markdown",
      buffer: Buffer.from(d.text, "utf-8"),
      isSeed: true,
    });
    if (!doc1Id && d.text === DOC_1) doc1Id = res.document.id;
    if (!res.duplicate) created.documents++;
  }

  // ── مواد اولیه ──
  const ingId = new Map<string, string>();
  for (const ing of INGREDIENTS) {
    const row = await db.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: { ...ing, isSeed: true },
    });
    ingId.set(ing.name, row.id);
    created.ingredients++;
  }

  // ── فرمولاسیون شامپو ──
  const shampooRows: [string, number, string | null][] = [
    ["آب دیونیزه", 68, "A"],
    ["لاریل اتر سولفات سدیم", 15, "A"],
    ["کوکامیدوپروپیل بتائین", 8, "A"],
    ["کوکو گلوکوزید", 3, "A"],
    ["گلیسیرین", 2.5, "B"],
    ["پانتنول", 0.5, "B"],
    ["فنوکسی اتانول", 0.8, "C"],
    ["اسید سیتریک", 0.7, "C"],
    ["کلرید سدیم", 1, "C"],
    ["عطر مخصوص شامپو", 0.5, "C"],
  ];
  const shampoo = await db.formulation.create({
    data: {
      name: "شامپو پایهٔ ملایم [نمونهٔ مصنوعی]",
      version: 1,
      productCategory: "شامپو",
      description: "فرمول نمایشی با مجموع درصد ۱۰۰ — هیچ مقداری واقعی نیست.",
      status: "draft",
      isSeed: true,
      ingredients: {
        create: shampooRows.map(([name, percentage, phase]) => ({
          ingredientId: ingId.get(name)!,
          percentage,
          phase,
        })),
      },
    },
  });
  created.formulations++;

  await db.propertyMeasurement.createMany({
    data: [
      { formulationId: shampoo.id, name: "pH", value: 5.4, unit: "-", method: "PH متر آزمایشگاهی [نمونه]" },
      { formulationId: shampoo.id, name: "ویسکوزیته", value: 4200, unit: "cP", method: "بروکفیلد [نمونه]" },
    ],
  });
  await db.experiment.create({
    data: {
      formulationId: shampoo.id,
      title: "آزمون پایداری کف [نمونهٔ مصنوعی]",
      summary: "مقایسهٔ ارتفاع کف اولیه و پایداری پس از ۵ دقیقه",
      results: "کف پایدار در حد انتظار نمونهٔ نمایشی (دادهٔ ساختگی)",
      status: "completed",
    },
  });

  // ── فرمولاسیون مایع ظرفشویی ──
  const dishRows: [string, number, string | null][] = [
    ["آب دیونیزه", 72, "A"],
    ["لاریل اتر سولفات سدیم", 18, "A"],
    ["کوکامیدوپروپیل بتائین", 5, "A"],
    ["گلیسیرین", 2, "B"],
    ["فنوکسی اتانول", 0.8, "C"],
    ["اسید سیتریک", 0.9, "C"],
    ["کلرید سدیم", 1.3, "C"],
  ];
  const dish = await db.formulation.create({
    data: {
      name: "مایع ظرفشویی دست‌ساز [نمونهٔ مصنوعی]",
      version: 1,
      productCategory: "مایع ظرفشویی",
      description: "فرمول نمایشی — مجموع ۱۰۰٪",
      status: "draft",
      isSeed: true,
      ingredients: {
        create: dishRows.map(([name, percentage, phase]) => ({
          ingredientId: ingId.get(name)!,
          percentage,
          phase,
        })),
      },
    },
  });
  created.formulations++;

  // ── پروندهٔ عیب‌یابی نمونه ──
  try {
    const { case: c } = await createAndAnalyzeCase({
      title: "افت ویسکوزیتهٔ شامپو پس از یک هفته [نمونهٔ مصنوعی]",
      productCategory: "شامپو",
      symptoms: "ویسکوزیتهٔ محصول از حد مورد نظر پایین آمده و کمی کدر شده است [نمونه]",
      manufacturingConditions: "افزودن نمک به‌صورت پودر خشک در انتهای سیکل [نمونه]",
      measurements: "pH=6.1 ، ویسکوزیته=2600 cP [نمونه]",
    });
    created.cases = 1;
    await db.troubleshootingCase.update({ where: { id: c.id }, data: { status: "investigating" } });
  } catch {
    created.cases = 0;
  }

  // ── گراف دانش ──
  const eSles = await upsertEntity({ type: "Ingredient", name: "لاریل اتر سولفات سدیم", description: "سورفکتانت آنیونی اصلی [نمونه]", confidence: 0.9, verified: false, sourceDocumentId: doc1Id });
  const eCapb = await upsertEntity({ type: "Ingredient", name: "کوکامیدوپروپیل بتائین", description: "سورفکتانت آمفوتریک [نمونه]", confidence: 0.9, verified: false, sourceDocumentId: doc1Id });
  const eFoam = await upsertEntity({ type: "Property", name: "کف‌سازی", confidence: 0.9, verified: false, sourceDocumentId: doc1Id });
  const eMild = await upsertEntity({ type: "Property", name: "ملایمت پوستی", confidence: 0.9, verified: false, sourceDocumentId: doc1Id });
  const eVisLoss = await upsertEntity({ type: "FailureMode", name: "افت ویسکوزیته", confidence: 0.9, verified: false, sourceDocumentId: doc1Id });
  const eShampoo = await upsertEntity({ type: "Formulation", name: "شامپو پایهٔ ملایم [نمونهٔ مصنوعی]", confidence: 1, verified: true });
  const eSalt = await upsertEntity({ type: "Ingredient", name: "کلرید سدیم", description: "تغلیظ‌کنندهٔ نمکی [نمونه]", confidence: 0.9, verified: false, sourceDocumentId: doc1Id });
  const eThicken = await upsertEntity({ type: "Property", name: "تغلیظ", confidence: 0.9, verified: false, sourceDocumentId: doc1Id });
  const eSupplier = await upsertEntity({ type: "Supplier", name: "تأمین‌کنندهٔ الف [نمونه]", confidence: 1, verified: true });

  const rels: [string, string, string, string, number, boolean][] = [
    [eSles.id, eShampoo.id, "USED_IN", "در فاز A فرمول شامپو [نمونه]", 0.95, false],
    [eCapb.id, eShampoo.id, "USED_IN", "سورفکتانت ثانویه شامپو [نمونه]", 0.95, false],
    [eSles.id, eFoam.id, "HAS_PROPERTY", "سورفکتانت آنیونی با کف‌سازی خوب [نمونه]", 0.85, false],
    [eCapb.id, eMild.id, "ASSOCIATED_WITH", "کاهش تحریک‌پذیری چشم [نمونه]", 0.8, false],
    [eSalt.id, eThicken.id, "HAS_PROPERTY", "افزودن نمک ویسکوزیته را بالا می‌برد [نمونه]", 0.85, false],
    [eVisLoss.id, eShampoo.id, "ASSOCIATED_WITH", "افت ویسکوزیته در شامپو گزارش‌شده [نمونه]", 0.7, false],
    [eSles.id, eSupplier.id, "SUPPLIED_BY", "تأمین نمایشی [نمونه]", 1, true],
    [eSalt.id, eVisLoss.id, "CAUSES_OR_CONTRIBUTES_TO", "بیش‌اشباع نمک باعث افت ویسکوزیته می‌شود [نمونه]", 0.6, false],
  ];
  for (const [sourceEntityId, targetEntityId, type, evidence, confidence, verified] of rels) {
    await upsertRelationship({ sourceEntityId, targetEntityId, type, evidence, confidence, verified, sourceDocumentId: doc1Id });
  }
  created.graphEntities = 8;
  created.graphRelationships = rels.length;

  invalidateRetrievalIndex();
  await audit("seed", "system", null, created);

  return { created, skipped: false };
}
