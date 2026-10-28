import type {
  DocumentDTO,
  EvidenceRef,
  GraphEntityDTO,
  GraphFactDTO,
  GraphRelationshipDTO,
  IngredientDTO,
  FormulationDetailDTO,
  TraversePathDTO,
  TroubleshootingCaseDTO,
} from "@/lib/types";

/**
 * دادهٔ نمایشی (Demo Dataset) — کاملاً مصنوعی و فقط برای آزمایش رابط کاربری.
 * ⚠️ هیچ‌کدام از اعداد، نتایج آزمایش یا ویژگی‌های شیمیایی این بخش، دادهٔ واقعی
 * یا تأییدشده نیستند و نباید مبنای تصمیم فرمولاسیون قرار گیرند.
 */

// ───────────────────────── شناسه‌های قطعی (UUID شبه‌تصادفی ثابت) ─────────────────────────

function did(n: number): string {
  const hex = n.toString(16).padStart(4, "0");
  return `d0000000-0000-4000-8000-${hex}00000000`;
}
function iid(n: number): string {
  const hex = n.toString(16).padStart(4, "0");
  return `i0000000-0000-4000-8000-${hex}00000000`;
}
function fid(n: number): string {
  const hex = n.toString(16).padStart(4, "0");
  return `f0000000-0000-4000-8000-${hex}00000000`;
}
function gid(n: number): string {
  const hex = n.toString(16).padStart(4, "0");
  return `g0000000-0000-4000-8000-${hex}00000000`;
}
function cid(n: number): string {
  const hex = n.toString(16).padStart(4, "0");
  return `c0000000-0000-4000-8000-${hex}00000000`;
}

const DEMO_TAG = "[نمونهٔ نمایشی — دادهٔ مصنوعی]";

// ───────────────────────── اسناد و قطعات دانش ─────────────────────────

interface DemoChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  seq: number;
  page: number | null;
  heading: string | null;
  content: string;
}

const DOC1 = "اصول فرمولاسیون شوینده‌ها — راهنمای نمایشی";
const DOC2 = "پایداری امولسیون‌ها در محصولات آرایشی — نمونهٔ نمایشی";
const DOC3 = "نگهدارنده‌ها و چالش میکروبی — نمونهٔ نمایشی";
const DOC4 = "عیب‌یابی رایج تولید شامپو و مایع ظرفشویی — نمونهٔ نمایشی";

const DEMO_CHUNKS: DemoChunk[] = [
  // سند ۱ — شوینده‌ها
  {
    id: cid(1), documentId: did(1), documentTitle: DOC1, seq: 0, page: 1,
    heading: "سورفکتانت‌های آنیونی",
    content: `${DEMO_TAG} سورفکتانت‌های آنیونی مانند لاریل اتر سولفات سدیم (SLES) و لوریل سولفات سدیم (SLS) اصلی‌ترین مواد فعال کف‌ساز و پاک‌کننده در شامپو و مایع ظرفشویی هستند. قدرت پاک‌کنندگی آن‌ها بالا است اما می‌توانند برای پوست خشک‌کننده باشند؛ برای کاهش تحریک‌پذیری معمولاً با سورفکتانت‌های آمفوتریک مانند کوکامیدوپروپیل بتائین ترکیب می‌شوند.`,
  },
  {
    id: cid(2), documentId: did(1), documentTitle: DOC1, seq: 1, page: 2,
    heading: "سورفکتانت‌های آمفوتریک و غیر یونی",
    content: `${DEMO_TAG} کوکامیدوپروپیل بتائین (CAPB) یک سورفکتانت آمفوتریک ملایم است که کف را پایدارتر می‌کند و تحریک‌پذیری چشم را کاهش می‌دهد. سورفکتانت‌های غیر یونی مانند الکل‌های چرب اتوکسیله (مثلاً لوریل گلوکوزید) برای فرمول‌های ملایم و پاک‌کننده‌های صورت به‌کار می‌روند و با سورفکتانت‌های آنیونی سازگاری خوبی دارند.`,
  },
  {
    id: cid(3), documentId: did(1), documentTitle: DOC1, seq: 2, page: 3,
    heading: "تغلیظ‌کننده‌ها",
    content: `${DEMO_TAG} گران‌روی شوینده‌ها معمولاً با نمک طعام (سدیم کلرید) به‌صورت موقت تنظیم می‌شود؛ افزودن تدریجی نمک تا نقطهٔ بهینه گران‌روی را افزایش می‌دهد اما افزودن بیش از حد باعث ریزش گران‌روی می‌شود. برای گران‌روی پایدارتر می‌توان از آمیدهای چرب مانند کوکامید DEA یا پلیمرهای تغلیظ‌کننده استفاده کرد.`,
  },
  {
    id: cid(4), documentId: did(1), documentTitle: DOC1, seq: 3, page: 4,
    heading: "pH در محصولات شوینده",
    content: `${DEMO_TAG} pH مناسب شامپو معمولاً در محدودهٔ اسیدی ملایم (حدود ۵ تا ۶) گزارش می‌شود تا با pH طبیعی پوست و مو سازگار باشد. برای تنظیم pH از اسید سیتریک یا لاکتیک اسید استفاده می‌شود. pH خیلی بالا می‌تواند باعث خشکی مو و تحریک پوست سر شود؛ pH خیلی پایین نیز برخی سورفکتانت‌ها را رسوب می‌دهد.`,
  },
  {
    id: cid(5), documentId: did(1), documentTitle: DOC1, seq: 4, page: 5,
    heading: "ترتیب افزودن مواد",
    content: `${DEMO_TAG} در تولید شامپو معمولاً ابتدا آب در همزن ریخته می‌شود، سپس سورفکتانت‌های اصلی به‌آرامی اضافه می‌شوند تا هوای اضافی وارد نشود؛ پس از یکنواخت‌شدن، آمفوتریک‌ها و مواد کمکی (مرطوب‌کننده، تغلیظ‌کننده) افزوده و در پایان pH و ویسکوزیته تنظیم می‌شود. همزدن شدید در مرحلهٔ سورفکتانت باعث کف‌زدن و حباب‌گیری محصول می‌شود.`,
  },
  // سند ۲ — امولسیون‌ها
  {
    id: cid(6), documentId: did(2), documentTitle: DOC2, seq: 0, page: 1,
    heading: "امولسیفایرها و عدد HLB",
    content: `${DEMO_TAG} امولسیون‌های روغن در آب (O/W) مانند کرم مرطوب‌کننده به امولسیفایرهایی با HLB بالاتر نیاز دارند و امولسیون‌های آب در روغن (W/O) به امولسیفایرهای کم‌HLB. تطابق HLB فاز چرب با HLB ترکیب امولسیفایرها یکی از عوامل کلیدی پایداری است.`,
  },
  {
    id: cid(7), documentId: did(2), documentTitle: DOC2, seq: 1, page: 2,
    heading: "دمای پردازش امولسیون",
    content: `${DEMO_TAG} در ساخت کرم، فاز چرب و فاز آبی معمولاً جداگانه به حدود ۷۰ تا ۷۵ درجهٔ سانتی‌گراد حرارت داده و سپس زیر همزدن با هم مخلوط می‌شوند. اختلاف دمای زیاد دو فاز یا سردشدن سریع بدون همزدن می‌تواند موجب دانه‌دانه‌شدن یا جداشدن امولسیون شود.`,
  },
  {
    id: cid(8), documentId: did(2), documentTitle: DOC2, seq: 2, page: 3,
    heading: "آزمون پایداری",
    content: `${DEMO_TAG} پایداری امولسیون با چرخه‌های حرارتی (مثلاً سه چرخهٔ یخچال و اتاقک گرم)، سانتریفیوژ و نگهداری در دمای اتاق بررسی می‌شود. جداشدن فازها، تغییر رنگ یا بوی غیرمعمول نشانهٔ ناپایداری است. هر عدد عددی در این متن نمایشی است و مبنای آزمایش واقعی نیست.`,
  },
  {
    id: cid(9), documentId: did(2), documentTitle: DOC2, seq: 3, page: 4,
    heading: "مرطوب‌کننده‌ها",
    content: `${DEMO_TAG} گلیسیرین و پروپیلن گلیکول مرطوب‌کننده‌های رایج‌اند که آب را در پوست نگه می‌دارند. غلظت‌های بالا می‌تواند حس چسبندگی ایجاد کند. هیالورونیک اسید در غلظت‌های کم به‌عنوان فعال مراقبتی افزوده می‌شود.`,
  },
  // سند ۳ — نگهدارنده‌ها
  {
    id: cid(10), documentId: did(3), documentTitle: DOC3, seq: 0, page: 1,
    heading: "انتخاب نگهدارنده",
    content: `${DEMO_TAG} نگهدارنده‌ها باید با pH فرمول سازگار باشند؛ مثلاً برخی ترکیبات بر پایهٔ اسید در pH بالاتر از محدودهٔ مؤثر خود کارایی را از دست می‌دهند. سدیم بنزوات و پتاسیم سوربات در محدودهٔ اسیدی مؤثرند.`,
  },
  {
    id: cid(11), documentId: did(3), documentTitle: DOC3, seq: 1, page: 2,
    heading: "آلودگی میکروبی",
    content: `${DEMO_TAG} آلودگی میکروبی معمولاً از آب آلوده، ظروف غیربهداشتی یا رعایت‌نکردن بهداشت تولید می‌آید. تغییر بو، کدورت یا رسوب می‌تواند نشانهٔ رشد میکروبی باشد؛ تشخیص قطعی فقط با آزمون میکروبی امکان‌پذیر است.`,
  },
  {
    id: cid(12), documentId: did(3), documentTitle: DOC3, seq: 2, page: 3,
    heading: "چالش فرمول",
    content: `${DEMO_TAG} برخی سورفکتانت‌های غیر یونی می‌توانند اثر نگهدارنده را کاهش دهند؛ در این صورت باید دوز یا ترکیب نگهدارنده با آزمون چالش میکروبی (Challenge Test) بازبینی شود. اعداد و توصیه‌های این سند نمایشی‌اند.`,
  },
  // سند ۴ — عیب‌یابی
  {
    id: cid(13), documentId: did(4), documentTitle: DOC4, seq: 0, page: 1,
    heading: "گران‌روی پایین شامپو",
    content: `${DEMO_TAG} اگر گران‌روی شامپو کمتر از هدف باشد، عوامل احتمالی: نمک ناکافی، دمای بالای فرایند که ساختار تغلیظ‌کننده را تخریب کرده، یا نسبت بالای سورفکتانت فعال. برای هر مورد باید گران‌روی، درجهٔ نمک و دمای پردازش ثبت و بررسی شود.`,
  },
  {
    id: cid(14), documentId: did(4), documentTitle: DOC4, seq: 1, page: 2,
    heading: "کدورت و رسوب",
    content: `${DEMO_TAG} کدورت در مایع ظرفشویی می‌تواند از حلال‌نشدن کامل نمک، سردشدن زیر نقطهٔ ابری سورفکتانت یا واکنش املاح سخت آب با سورفکتانت ناشی شود. اندازه‌گیری pH، هدایت و شفافیت در دماهای مختلف به تفکیک علت کمک می‌کند.`,
  },
  {
    id: cid(15), documentId: did(4), documentTitle: DOC4, seq: 2, page: 3,
    heading: "جداشدن فاز در کرم",
    content: `${DEMO_TAG} جداشدن آب و روغن در کرم‌ها معمولاً به عدم تطابق HLB، همزدن ناکافی در مرحلهٔ خنک‌سازی یا نوسان دمای نگهداری مربوط است. ثبت دمای مخلوط‌سازی و سرعت همزن برای یافتن علت ضروری است.`,
  },
  {
    id: cid(16), documentId: did(4), documentTitle: DOC4, seq: 3, page: 4,
    heading: "کف کم در ظرفشویی",
    content: `${DEMO_TAG} کاهش کف در مایع ظرفشویی می‌تواند ناشی از کاهش درصد مادهٔ فعال (خطای توزین)، رقیق‌سازی اشتباه یا حضور ضدکف ناخواسته از تجهیزات پیشین باشد. بررسی سوابق توزین و شست‌وشوی خط تولید از اقدامات اولیه است.`,
  },
];

// ───────────────────────── مواد اولیه ─────────────────────────

export type DemoIngredient = IngredientDTO;

const NOW = "2026-01-01T00:00:00.000Z";

const DEMO_INGREDIENTS: DemoIngredient[] = [
  { id: iid(1), name: "آب دیونیزه", inciName: "Aqua", category: "آب و حلال", description: `${DEMO_TAG} حلال پایهٔ بیشتر فرمول‌ها`, casNumber: "7732-18-5", isSeed: true, createdAt: NOW },
  { id: iid(2), name: "لاریل اتر سولفات سدیم", inciName: "Sodium Laureth Sulfate (SLES)", category: "سورفکتانت", description: `${DEMO_TAG} سورفکتانت آنیونی اصلی کف و پاک‌کنندگی`, casNumber: "68585-34-2", isSeed: true, createdAt: NOW },
  { id: iid(3), name: "کوکامیدوپروپیل بتائین", inciName: "Cocamidopropyl Betaine", category: "سورفکتانت", description: `${DEMO_TAG} آمفوتریک ملایم، پایدارکنندهٔ کف`, casNumber: "61789-40-0", isSeed: true, createdAt: NOW },
  { id: iid(4), name: "گلیسیرین", inciName: "Glycerin", category: "فعال‌کننده و نرم‌کننده", description: `${DEMO_TAG} مرطوب‌کنندهٔ جاذب رطوبت`, casNumber: "56-81-5", isSeed: true, createdAt: NOW },
  { id: iid(5), name: "اسید سیتریک", inciName: "Citric Acid", category: "عدل‌کننده pH", description: `${DEMO_TAG} تنظیم pH به محدودهٔ اسیدی ملایم`, casNumber: "77-92-9", isSeed: true, createdAt: NOW },
  { id: iid(6), name: "سدیم کلرید", inciName: "Sodium Chloride", category: "تغلیظ‌کننده", description: `${DEMO_TAG} تنظیم موقت گران‌روی در شوینده‌ها`, casNumber: "7647-14-5", isSeed: true, createdAt: NOW },
  { id: iid(7), name: "سدیم بنزوات", inciName: "Sodium Benzoate", category: "نگهدارنده", description: `${DEMO_TAG} نگهدارندهٔ مؤثر در pH اسیدی`, casNumber: "532-32-1", isSeed: true, createdAt: NOW },
  { id: iid(8), name: "پتاسیم سوربات", inciName: "Potassium Sorbate", category: "نگهدارنده", description: `${DEMO_TAG} نگهدارندهٔ ضد کپک و مخمر`, casNumber: "24634-61-5", isSeed: true, createdAt: NOW },
  { id: iid(9), name: "گلیکول مونوستئارات", inciName: "Glycol Distearate", category: "دیگر", description: `${DEMO_TAG} ایجاد جلای مرواریدی در شامپو`, casNumber: "627-83-8", isSeed: true, createdAt: NOW },
  { id: iid(10), name: "اسید لاکتیک", inciName: "Lactic Acid", category: "عدل‌کننده pH", description: `${DEMO_TAG} تنظیم pH با حس پوستی ملایم`, casNumber: "50-21-5", isSeed: true, createdAt: NOW },
];

export function demoIngredients(query?: string | null): IngredientDTO[] {
  const q = query?.trim().toLowerCase();
  if (!q) return DEMO_INGREDIENTS;
  return DEMO_INGREDIENTS.filter(
    (i) => i.name.toLowerCase().includes(q) || (i.inciName ?? "").toLowerCase().includes(q),
  );
}

// ───────────────────────── فرمولاسیون‌ها ─────────────────────────

const DEMO_FORMULATION_DETAILS: FormulationDetailDTO[] = [
  {
    id: fid(1), name: `شامپو ملایم روزانه ${DEMO_TAG}`, version: 1, productCategory: "شامپو",
    description: "فرمول پایهٔ نمایشی با سورفکتانت آنیونی + آمفوتریک؛ اعداد کاملاً مصنوعی‌اند.",
    status: "draft", ingredientCount: 6, isSeed: true, createdAt: NOW,
    ingredients: [
      { id: "fi1", ingredientId: iid(1), ingredientName: "آب دیونیزه", percentage: 68, unit: "%", phase: "A", note: null },
      { id: "fi2", ingredientId: iid(2), ingredientName: "لاریل اتر سولفات سدیم", percentage: 16, unit: "%", phase: "B", note: "مادهٔ فعال اصلی" },
      { id: "fi3", ingredientId: iid(3), ingredientName: "کوکامیدوپروپیل بتائین", percentage: 6, unit: "%", phase: "B", note: "ملایم‌کننده" },
      { id: "fi4", ingredientId: iid(4), ingredientName: "گلیسیرین", percentage: 3, unit: "%", phase: "C", note: null },
      { id: "fi5", ingredientId: iid(6), ingredientName: "سدیم کلرید", percentage: 1.2, unit: "%", phase: "D", note: "تنظیم گران‌روی" },
      { id: "fi6", ingredientId: iid(5), ingredientName: "اسید سیتریک", percentage: 0.3, unit: "%", phase: "E", note: "تنظیم pH" },
    ],
    measurements: [
      { id: "fm1", name: "pH (نمایشی)", value: 5.8, unit: "-", method: "کاغذ pH", note: "مقدار مصنوعی", createdAt: NOW },
      { id: "fm2", name: "گران‌روی (نمایشی)", value: 3800, unit: "cP", method: "ویسکومتر بروکفیلد", note: "مقدار مصنوعی", createdAt: NOW },
    ],
    experiments: [
      { id: "fe1", title: "آزمون پایداری چرخه‌ای (نمایشی)", summary: "سه چرخهٔ گرم/سرد", results: "بدون جداشدن فاز (دادهٔ مصنوعی)", status: "resolved", createdAt: NOW },
    ],
  },
  {
    id: fid(2), name: `مایع ظرفشویی غلیظ ${DEMO_TAG}`, version: 1, productCategory: "مایع ظرفشویی",
    description: "نمونهٔ نمایشی با درصد مادهٔ فعال بالاتر.",
    status: "in_review", ingredientCount: 5, isSeed: true, createdAt: NOW,
    ingredients: [
      { id: "fi7", ingredientId: iid(1), ingredientName: "آب دیونیزه", percentage: 60, unit: "%", phase: "A", note: null },
      { id: "fi8", ingredientId: iid(2), ingredientName: "لاریل اتر سولفات سدیم", percentage: 24, unit: "%", phase: "B", note: null },
      { id: "fi9", ingredientId: iid(3), ingredientName: "کوکامیدوپروپیل بتائین", percentage: 4, unit: "%", phase: "B", note: null },
      { id: "fi10", ingredientId: iid(6), ingredientName: "سدیم کلرید", percentage: 2, unit: "%", phase: "D", note: null },
      { id: "fi11", ingredientId: iid(5), ingredientName: "اسید سیتریک", percentage: 0.4, unit: "%", phase: "E", note: null },
    ],
    measurements: [],
    experiments: [],
  },
  {
    id: fid(3), name: `کرم مرطوب‌کنندهٔ صورت ${DEMO_TAG}`, version: 2, productCategory: "کرم مرطوب‌کننده",
    description: "امولسیون O/W نمایشی برای آزمایش تب فرمولاسیون.",
    status: "approved", ingredientCount: 5, isSeed: true, createdAt: NOW,
    ingredients: [
      { id: "fi12", ingredientId: iid(1), ingredientName: "آب دیونیزه", percentage: 71, unit: "%", phase: "آبی", note: null },
      { id: "fi13", ingredientId: iid(4), ingredientName: "گلیسیرین", percentage: 5, unit: "%", phase: "آبی", note: null },
      { id: "fi14", ingredientId: iid(9), ingredientName: "گلیکول مونوستئارات", percentage: 3, unit: "%", phase: "چرب", note: "امولسیفایر نمایشی" },
      { id: "fi15", ingredientId: iid(7), ingredientName: "سدیم بنزوات", percentage: 0.5, unit: "%", phase: "آبی", note: "نگهدارنده" },
      { id: "fi16", ingredientId: iid(10), ingredientName: "اسید لاکتیک", percentage: 0.2, unit: "%", phase: "پایانی", note: "تنظیم pH" },
    ],
    measurements: [],
    experiments: [],
  },
];

export function demoFormulationSummaries() {
  return DEMO_FORMULATION_DETAILS.map(({ ingredients: _i, measurements: _m, experiments: _e, ...rest }) => rest);
}

export function demoFormulationDetail(id: string): FormulationDetailDTO | null {
  return DEMO_FORMULATION_DETAILS.find((f) => f.id === id) ?? null;
}

// ───────────────────────── گراف دانش ─────────────────────────

export type DemoGraphEntity = GraphEntityDTO;

interface DemoRelation {
  sourceId: string;
  targetId: string;
  type: string;
  evidence: string;
  confidence: number;
}

const DEMO_GRAPH_ENTITIES: DemoGraphEntity[] = [
  { id: gid(1), type: "Ingredient", name: "لاریل اتر سولفات سدیم", description: "سورفکتانت آنیونی (نمایشی)", confidence: 1, verified: true, sourceDocumentId: did(1), sourceDocumentTitle: DOC1, createdAt: NOW },
  { id: gid(2), type: "Property", name: "کف‌سازی بالا", description: null, confidence: 0.85, verified: false, sourceDocumentId: did(1), sourceDocumentTitle: DOC1, createdAt: NOW },
  { id: gid(3), type: "Property", name: "خشک‌کنندگی پوست", description: null, confidence: 0.8, verified: false, sourceDocumentId: did(1), sourceDocumentTitle: DOC1, createdAt: NOW },
  { id: gid(4), type: "Ingredient", name: "کوکامیدوپروپیل بتائین", description: "سورفکتانت آمفوتریک ملایم (نمایشی)", confidence: 1, verified: true, sourceDocumentId: did(1), sourceDocumentTitle: DOC1, createdAt: NOW },
  { id: gid(5), type: "Formulation", name: "شامپو ملایم روزانه", description: "فرمول نمایشی", confidence: 1, verified: true, sourceDocumentId: null, sourceDocumentTitle: null, createdAt: NOW },
  { id: gid(6), type: "Property", name: "پایداری کف", description: null, confidence: 0.85, verified: false, sourceDocumentId: did(1), sourceDocumentTitle: DOC1, createdAt: NOW },
  { id: gid(7), type: "FailureMode", name: "گران‌روی پایین", description: "نمایشی — عیب رایج شامپو", confidence: 0.9, verified: false, sourceDocumentId: did(4), sourceDocumentTitle: DOC4, createdAt: NOW },
  { id: gid(8), type: "Ingredient", name: "سدیم کلرید", description: "تغلیظ‌کنندهٔ نمایشی", confidence: 1, verified: true, sourceDocumentId: did(1), sourceDocumentTitle: DOC1, createdAt: NOW },
  { id: gid(9), type: "FailureMode", name: "جداشدن فاز", description: "نمایشی — عیب امولسیون", confidence: 0.9, verified: false, sourceDocumentId: did(4), sourceDocumentTitle: DOC4, createdAt: NOW },
  { id: gid(10), type: "Ingredient", name: "گلیکول مونوستئارات", description: "امولسیفایر/جلای مرواریدی (نمایشی)", confidence: 1, verified: true, sourceDocumentId: did(2), sourceDocumentTitle: DOC2, createdAt: NOW },
];

const DEMO_GRAPH_RELATIONS: DemoRelation[] = [
  { sourceId: gid(1), targetId: gid(2), type: "HAS_PROPERTY", evidence: "سورفکتانت آنیونی کف‌ساز (نمایشی)", confidence: 0.85 },
  { sourceId: gid(1), targetId: gid(3), type: "ASSOCIATED_WITH", evidence: "خشکی پوست در غلظت بالا (نمایشی)", confidence: 0.7 },
  { sourceId: gid(4), targetId: gid(6), type: "HAS_PROPERTY", evidence: "پایدارکنندهٔ کف (نمایشی)", confidence: 0.8 },
  { sourceId: gid(5), targetId: gid(1), type: "CONTAINS", evidence: "فرمول شامپو نمایشی", confidence: 1 },
  { sourceId: gid(5), targetId: gid(4), type: "CONTAINS", evidence: "فرمول شامپو نمایشی", confidence: 1 },
  { sourceId: gid(7), targetId: gid(8), type: "ASSOCIATED_WITH", evidence: "نمک ناکافی → گران‌روی کم (نمایشی)", confidence: 0.75 },
  { sourceId: gid(9), targetId: gid(10), type: "CAUSES_OR_CONTRIBUTES_TO", evidence: "عدم تطابق HLB (نمایشی)", confidence: 0.7 },
  { sourceId: gid(1), targetId: gid(5), type: "USED_IN", evidence: "سورفکتانت اصلی شامپو (نمایشی)", confidence: 1 },
];

export function demoGraphEntities(type?: string | null, query?: string | null): GraphEntityDTO[] {
  let list = DEMO_GRAPH_ENTITIES;
  if (type && type !== "all") list = list.filter((e) => e.type === type);
  const q = query?.trim().toLowerCase();
  if (q) list = list.filter((e) => e.name.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q));
  return list;
}

export function demoGraphRelationsFor(entityId: string): GraphRelationshipDTO[] {
  const byId = new Map(DEMO_GRAPH_ENTITIES.map((e) => [e.id, e]));
  const rels: GraphRelationshipDTO[] = [];
  DEMO_GRAPH_RELATIONS.forEach((r, idx) => {
    if (r.sourceId !== entityId && r.targetId !== entityId) return;
    const outgoing = r.sourceId === entityId;
    const other = byId.get(outgoing ? r.targetId : r.sourceId);
    if (!other) return;
    rels.push({
      id: `gr-${idx}`,
      type: r.type,
      direction: outgoing ? "outgoing" : "incoming",
      otherEntity: { id: other.id, name: other.name, type: other.type },
      evidence: r.evidence,
      confidence: r.confidence,
      verified: false,
      sourceDocumentTitle: other.sourceDocumentTitle,
    });
  });
  return rels;
}

export function demoGraphFactForQuery(query: string, limit = 4): GraphFactDTO[] {
  const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
  const byId = new Map(DEMO_GRAPH_ENTITIES.map((e) => [e.id, e]));
  const matched = DEMO_GRAPH_ENTITIES.filter(
    (e) => tokens.some((t) => e.name.toLowerCase().includes(t)) || tokens.some((t) => t.includes(e.name.toLowerCase())),
  );
  const facts: GraphFactDTO[] = [];
  for (const e of matched.slice(0, limit)) {
    for (const r of DEMO_GRAPH_RELATIONS.filter((r) => r.sourceId === e.id || r.targetId === e.id).slice(0, 2)) {
      const source = byId.get(r.sourceId);
      const target = byId.get(r.targetId);
      if (!source || !target) continue;
      facts.push({
        text: `${source.name} ← ${r.type} → ${target.name}`,
        source: source.sourceDocumentTitle ? `سند «${source.sourceDocumentTitle}»` : "گراف دانش (نمایشی)",
        confidence: r.confidence,
        verified: false,
      });
    }
  }
  return facts.slice(0, 8);
}

/** پیمایش BFS نمایشی روی گراف نمونه */
export function demoTraverse(entityId: string, maxDepth: number): TraversePathDTO[] {
  const byId = new Map(DEMO_GRAPH_ENTITIES.map((e) => [e.id, e]));
  if (!byId.has(entityId)) return [];

  const paths: TraversePathDTO[] = [];
  const walk = (
    currentId: string,
    entities: { id: string; name: string; type: string }[],
    relations: TraversePathDTO["relations"],
    visited: Set<string>,
    level: number,
  ) => {
    if (level > maxDepth) {
      if (relations.length > 0) paths.push({ depth: relations.length, entities: [...entities], relations: [...relations] });
      return;
    }
    const neighbors = DEMO_GRAPH_RELATIONS.filter((r) => r.sourceId === currentId || r.targetId === currentId);
    let extended = false;
    for (const r of neighbors) {
      const outgoing = r.sourceId === currentId;
      const nextId = outgoing ? r.targetId : r.sourceId;
      const next = byId.get(nextId);
      if (!next || visited.has(nextId)) continue;
      extended = true;
      visited.add(nextId);
      walk(
        nextId,
        [...entities, { id: next.id, name: next.name, type: next.type }],
        [...relations, { type: r.type, evidence: r.evidence, confidence: r.confidence, verified: false }],
        visited,
        level + 1,
      );
      visited.delete(nextId);
    }
    if (!extended && relations.length > 0) {
      paths.push({ depth: relations.length, entities: [...entities], relations: [...relations] });
    }
  };

  const origin = byId.get(entityId);
  if (!origin) return [];
  walk(entityId, [{ id: origin.id, name: origin.name, type: origin.type }], [], new Set([entityId]), 1);
  return paths.sort((a, b) => a.depth - b.depth).slice(0, 50);
}

// ───────────────────────── عیب‌یابی ─────────────────────────
const DEMO_EVIDENCE: EvidenceRef[] = [
  {
    index: 1,
    documentId: did(4),
    documentTitle: DOC4,
    page: 1,
    heading: "گران‌روی پایین شامپو",
    snippet: `${DEMO_TAG} عوامل احتمالی: نمک ناکافی، دمای بالای فرایند یا نسبت بالای مادهٔ فعال. ثبت گران‌روی، درجهٔ نمک و دمای پردازش ضروری است.`,
    score: 0.9,
  },
  {
    index: 2,
    documentId: did(1),
    documentTitle: DOC1,
    page: 3,
    heading: "تغلیظ‌کننده‌ها",
    snippet: `${DEMO_TAG} افزودن تدریجی نمک تا نقطهٔ بهینه گران‌روی را افزایش می‌دهد و افزونِ بیش از حد باعث ریزش گران‌روی می‌شود.`,
    score: 0.75,
  },
];

export function demoTroubleshootingCases(): TroubleshootingCaseDTO[] {
  return [
    {
      id: "c0000000-0000-4000-8000-000000000001",
      title: `گران‌روی پایین بچ شامپو ${DEMO_TAG}`,
      productCategory: "شامپو",
      symptoms: "گران‌روی نهایی بچ کمتر از هدف؛ محصول رقیب به نظر می‌رسد. (سناریوی مصنوعی)",
      manufacturingConditions: "دمای پردازش بالا گزارش شده؛ افزودن نمک تا حد مشخص انجام شده است.",
      measurements: "pH و گران‌روی ثبت نشده است.",
      status: "investigating",
      analysis: {
        summary: "بر اساس سند نمایشی عیب‌یابی، احتمال‌های اولیه شامل کمبود نمک، تخریب حرارتی تغلیظ‌کننده و نسبت مادهٔ فعال است (دادهٔ نمایشی).",
        possibleFactors: [
          { factor: "سدیم کلرید ناکافی", rationale: "تغلیظ موقت با نمک است؛ افزودن تدریجی تا نقطهٔ بهینه باید ثبت شود.", evidenceRefs: [1, 2], confidence: "متوسط" },
          { factor: "دمای بالای فرایند", rationale: "دمای بالا می‌تواند ساختار تغلیظ‌کننده را تخریب کند.", evidenceRefs: [1], confidence: "متوسط" },
        ],
        missingInfo: ["اندازه‌گیری دقیق گران‌روی (روش و دما)", "درجهٔ نمک بچ", "دمای واقعی پردازش"],
        suggestedInvestigations: ["افزایش تدریجی نمک با ثبت گران‌روی در هر مرحله", "تکرار آزمایش با دمای پردازش پایین‌تر"],
        evidence: DEMO_EVIDENCE,
        disclaimer: "این تحلیل فقط روی دادهٔ نمایشی ساخته شده و هیچ ارزش فرمولاسیونی واقعی ندارد.",
      },
      createdAt: NOW,
    },
    {
      id: "c0000000-0000-4000-8000-000000000002",
      title: `کدورت مایع ظرفشویی ${DEMO_TAG}`,
      productCategory: "مایع ظرفشویی",
      symptoms: "کدورت محصول بعد از چند روز نگهداری. (سناریوی مصنوعی)",
      manufacturingConditions: null,
      measurements: null,
      status: "open",
      analysis: null,
      createdAt: NOW,
    },
  ];
}

// ───────────────────────── اسناد (تب اسناد) ─────────────────────────

export type DemoDocument = DocumentDTO;

export function demoDocuments(): DemoDocument[] {
  const docs = [DOC1, DOC2, DOC3, DOC4];
  return docs.map((title, idx) => ({
    id: did(idx + 1),
    title,
    originalName: `demo-${idx + 1}.md`,
    mimeType: "text/markdown",
    sizeBytes: 2400 + idx * 300,
    status: "ready" as const,
    needsOcr: false,
    error: null,
    pageCount: 5 - idx >= 1 ? 5 - (idx % 3) : 3,
    language: "fa",
    chunkCount: DEMO_CHUNKS.filter((c) => c.documentId === did(idx + 1)).length,
    isSeed: true,
    createdAt: NOW,
  }));
}

// ───────────────────────── خروجی برای ایندکس بازیابی ─────────────────────────

export interface DemoIndexRow {
  id: string;
  documentId: string;
  page: number | null;
  heading: string | null;
  content: string;
  seq: number;
  document: { title: string };
}

export function demoChunkRows(): DemoIndexRow[] {
  return DEMO_CHUNKS.map((c) => ({
    id: c.id,
    documentId: c.documentId,
    page: c.page,
    heading: c.heading,
    content: c.content,
    seq: c.seq,
    document: { title: c.documentTitle },
  }));
}

// ───────────────────────── شمارنده‌ها برای تنظیمات ─────────────────────────

export function demoCounts() {
  return {
    documents: DEMO_CHUNKS.length ? new Set(DEMO_CHUNKS.map((c) => c.documentId)).size : 0,
    chunks: DEMO_CHUNKS.length,
    ingredients: DEMO_INGREDIENTS.length,
    formulations: DEMO_FORMULATION_DETAILS.length,
    graphEntities: DEMO_GRAPH_ENTITIES.length,
    graphRelationships: DEMO_GRAPH_RELATIONS.length,
    cases: 2,
  };
}

export const DEMO_MODE_NOTE = DEMO_TAG;
