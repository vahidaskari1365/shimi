# Worklog

---
Task ID: 2-a
Agent: general-purpose (repo evaluator)
Task: ارزیابی ۶ مخزن (OmniRoute, awesome-free-llm-apis, Agent-Reach, ECC, mattpocock/skills, ai-engineering-hub)

Work Log:
- برای هر ۶ مخزن README.md از `raw.githubusercontent.com/<owner>/<repo>/main/README.md` گرفته شد (همگی 200؛ نیازی به شاخه master نبود) و در /tmp/repo-eval ذخیره شد.
- فایل LICENSE همه مخازن با نام‌های مرسوم (LICENSE/LICENSE.md/…) fetch شد: OmniRoute، Agent-Reach، ECC، mattpocock/skills و ai-engineering-hub → MIT؛ mnfst/awesome-free-llm-apis → با نام‌های مرسوم یافت نشد، با `git clone --depth 1` در /tmp فایل `license` (حروف کوچک) شناسایی شد → CC0 1.0. کلون پس از مطالعه حذف شد.
- GitHub REST API به دلیل rate-limit (403) در دسترس نبود؛ آمار star/fork استخراج نشد و ارزیابی صرفاً بر مستندات رسمی (README/LICENSE/data.json) استوار شد — این محدودیت در گزارش ذکر شده است.
- READMEهای بزرگ (OmniRoute ~142KB، ECC ~115KB) بخش‌به‌بخشش (install، tech stack، security، platform support) خوانده و استخراج شد؛ ساختار mnfst (data.json + sources.json + SKILL.md) و هشدار PyPI-jacking و معماری نصب agent-driven در Agent-Reach بررسی شد.
- استک محصول از package.json پروژه تأیید شد (Next.js 16.1.1، React 19، Prisma 6، TS 5، Zod 4) تا سازگاری پیشنهادها صریح شود.
- گزارش کامل فارسی در `docs/REPO-EVALUATION.fa.md` نوشته شد (جدول خلاصه + بخش تفصیلی هر مخزن + منتخب‌ها/ردشده‌ها + سازگاری استک). هیچ کدی در src/ نوشته نشد و هیچ مخزنی داخل پروژه clone نشد.

Stage Summary:
- منتخب: `mattpocock/skills` (MIT، بدون وابستگی) — adoption انتخابی اسکیل‌های tdd/code-review/grill-with-docs/diagnosing-bugs برای بهبود فرایند توسعه و تست.
- فقط-مرجع: `ai-engineering-hub` (MIT؛ الگوهای RAG در TS بازطراحی می‌شود، کد پایتون وارد نمی‌شود)، `awesome-free-llm-apis` (CC0؛ صرفاً کاتالوگ ارائه‌دهندگان، نه سرویس)، `ECC` (MIT+Pro تجاری؛ نصب کامل سنگین رد، ایده‌ها مرجع)، `OmniRoute` (MIT؛ فقط درگاه اختیاری مدل‌ها برای سناریوی BYOK آینده، بدون ادغام در MVP).
- ردشده: `Agent-Reach` (MIT) — نیازی به جمع‌آوری وب از پلتفرم‌هایش تعریف نشده؛ Python/دسکتاپی، کپی session مرورگر و نصب agent-driven پرریسک و غیرقابل‌ادغام با Next.js.
- همه ۶ مخزن در دسترس و ارزیابی‌شده بودند؛ هیچ ادعای «ادغام‌شده» وجود ندارد — تصمیم نهایی اجرا با عامل اصلی است.

---
Task ID: 1, 2-b, 2-c, 3, 4, 5 (main agent)
Agent: Z.ai Code (main)
Task: نصب اسکیل‌ها، ساخت MVP «شیمی‌یار» (فرانت + بک + seed + ارزیابی + مستندات)

Work Log:
- بررسی محیط: dev server فعال (پورت 3000)، شبکه برقرار، framer-motion/zod/prisma/z-ai-web-dev-sdk موجود؛ unpdf + papaparse اضافه شد.
- نصب اسکیل‌ها: ۱۰ مخزن به skills/ کلون شد (taste-skill-plugin، ui-ux-pro-max-skill، claude-seo، magicui، portfolio، blog-template، app-template، awesome-copilot + awesome-design-md و img2threejs از قبل موجود). impeccable و playwright-cli از قبل به‌عنوان اسکیل سیستم نصب بودند (کلون گیت‌هابشان منتقل/آرشیو شده بود). مجوزها بررسی شد؛ skills/ به .gitignore اضافه شد.
- راهنمای طراحی از اسکیل‌های impeccable (Apache-2.0) و gpt-tasteskill اعمال شد: حالت Operate، تیرهٔ آزمایشگاهی زمرد/کهربایی، H1 کوتاه پهن، بدون ایموجی در کد، موشن معنادار.
- Prisma schema کامل نوشته و push شد (Document/Chunk/Ingredient/Formulation/FormulationIngredient/PropertyMeasurement/Experiment/TroubleshootingCase/GraphEntity/GraphRelationship/AuditEvent/AppSetting — بدون User/Post قدیمی).
- فرانت‌اند اول ساخته شد (طبق قاعدهٔ frontend-first): ۷ تب (گفت‌وگو/اسناد/فرمولاسیون‌ها/مواد اولیه/گراف/عیب‌یابی/تنظیمات)، RTL کامل fa، Vazirmatn، aurora متحرک، tab-pill با layoutId، AnimatePresence، چیپ استناد [n] با اسکرول به شواهد، SVG شعاعی گراف، پانویس چسبان با safe-area.
- باگ CSS فونت (import بعد از expansion Tailwind) → منتقل به <link> در layout؛ رفع شد (GET / = 200).
- بک‌اند: نرمال‌ساز فارسی (ی/ک/ارقام/اعراب/ZWNJ)، EmbeddingProvider آفلاین hashing-TFIDF ۳گرام ۳۸۴بعدی، ایندکس حافظه + BM25، کسینوس، RRF (k=60)، استخراج PDF صفحه‌ای (unpdf)/CSV (papaparse به صفحات شبه‌جدول)/TXT/MD، chunker با overlap و تشخیص هدینگ، سرویس ingestion (dedupe SHA-256، needs_ocr، بازنمایه‌سازی، حذف آبشاری + فایل)، سرویس گراف (upsert نرمال‌شده، استخراج LLM با Zod + منشأ، BFS تا عمق ۳)، chat (RAG با استناد [n]، جدایی شواهد/فرضیه، بدون‌مدرک → پاسخ صادقانه بدون LLM)، عیب‌یابی محتاطانه (JSON schema + اطمینان کم/متوسط/زیاد + disclaimer)، seed مصنوعی برچسب‌دار با claim-lock.
- ۱۹ مسیر API با Zod و پاسخ خطای یکنواخت {error:{code,message}} نوشته شد.
- تست دود موفق: health=ok، seed (۳ سند/۱۰ ماده/۲ فرمول/۸+۸ گراف/۱ پرونده با تحلیل LLM)، chat فارسی با استناد [1..3] و جداسازی فرضیه، traverse چند-پله‌ای، آپلود md (chunk=1, lang=fa)، رفتار «مدارک کافی نیست» صحیح.
- ارزیابی بازیابی (پیکرهٔ مصنوعی، ۱۰ پرسش): BM25 Recall@5=80٪/MRR=0.75؛ برداری 90٪/0.78؛ ترکیبی RRF 90٪/MRR=0.83 (بهترین) — اسکریپت ارزیابی پس از اجرا حذف شد (سیاست محیط: بدون تست در repo).
- lint کل پروژه: بدون خطا.
- مستندات: docs/IMPLEMENTATION-REPORT.fa.md + .env.example + README (این فایل‌ها) و docs/REPO-EVALUATION.fa.md (زیرعامل).

Stage Summary:
- MVP کامل و E2E کارا: آپلود→نمایه‌سازی→پرسش مستند‌محور با استناد صفحه، گراف با منشأ، فرمول‌سازی اعتبارسنجی‌شده، عیب‌یابی محتاطانه، UI فارسی موشن‌دار.
- سازگاری با محیط: SQLite/Prisma به‌جای Postgres/pgvector و SDK داخلی به‌جای Ollama — هر دو در معماری Adapter قابل تعویض و در گزارش صادقانه مستند شده‌اند.
- محدودیت‌های صریح: بدون OCR، بدون auth، بدون suite تست خودکار (خط‌مشی محیط)، پیکرهٔ ارزیابی کوچک/مصنوعی.

---
Task ID: ui-meta-hide
Agent: Z.ai Code (main)
Task: حذف نوشتهٔ فنی «z-ai-default • بردارساز: hashing-tfidf-۳گرام • بازیابی: N قطعه در M میلی‌ثانیه» از تمام UI + افزودن پرامپت محرمانهٔ «نخبه/هیئت علمی شیمی جهان» پشت پاسخ‌های هوش مصنوعی بدون افشای نقش

Work Log:
- chat-tab.tsx: حذف کامل خط متای فنی (مدل/بردارساز/آمار بازیابی) از حباب پاسخ؛ نشان‌های «پاسخ مدل زبانی» و «پایگاه دانش نمایشی» حفظ شدند
- settings-tab.tsx: حذف ردیف‌های «ارائه‌دهنده/مدل» و «ارائه‌دهندهٔ بردارساز»؛ جایگزینی با برچسب‌های عمومی (RAG مستندمحور، آفلاین و درونی)؛ عمومی‌سازی دیاگرام معماری (hash-TFIDF → internal embedding)
- prompts.ts: افزودن بخش «سطح علمی پاسخ‌سازی (دستور محرمانهٔ داخلی)» هم‌تراز نخبگان و هیئت علمی برتر شیمی جهان به CHAT_SYSTEM_PROMPT + قاعدهٔ مطلق محرمانگی نقش (منع تصریح نقش در پاسخ) + قاعدهٔ ۸؛ نسخهٔ کوتاه همین دستور به TROUBLESHOOTING_SYSTEM_PROMPT
- آزمون E2E: curl روی /api/chat → پاسخ LLM درجه‌یک بدون هیچ اشاره به نقش؛ agent-browser روی / → UI پاسخ و تنظیمات عاری از z-ai/hashing-tfidf/آمار؛ lint پاک
- Commit c5eefaa به main در vahidaskari1365/shimi پوش شد → Vercel redeploy خودکار

Stage Summary:
- متاinformation فنی مدل/بردارساز دیگر در هیچ‌جای UI دیده نمی‌شود؛ API همچنان برای دیاگنوستیک برمی‌گرداند
- هوش مصنوعی با پرسونای محرمانهٔ «مرجع علمی درجه‌یک جهانی شیمی» پاسخ می‌سازد و طبق قاعدهٔ صریح، هرگز نقش خود را در پاسخ‌ها ذکر نمی‌کند
