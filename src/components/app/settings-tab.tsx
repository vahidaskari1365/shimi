"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Database,
  Gauge,
  Info,
  Network,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionHeader, LoadingCards } from "@/components/app/shared";
import { apiFetch, ApiClientError } from "@/hooks/use-api";
import { useAppStore } from "@/store/app-store";
import { faInt, faNum } from "@/lib/fa";
import type { SettingsDTO } from "@/lib/types";

function ConfigCard({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof Bot;
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="card-lift rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="flex size-8 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
          <Icon className="size-4" aria-hidden />
        </span>
        {title}
      </p>
      <dl className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 text-xs">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="rounded-md bg-white/5 px-2 py-1 font-semibold" dir="auto">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SettingsTab() {
  const { settings, settingsLoading, loadSettings, refreshTick } = useAppStore();
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings, refreshTick]);

  const runSeed = async () => {
    setSeeding(true);
    const t = toast.loading("بارگذاری داده‌های نمایشی مصنوعی…");
    try {
      const res = await apiFetch<{ created: { documents: number; ingredients: number; formulations: number; cases: number; graphEntities: number; graphRelationships: number } }>(
        "/api/seed",
        { method: "POST" },
      );
      toast.success("دادهٔ نمایشی بارگذاری شد", {
        id: t,
        description: `${faInt(res.created.documents)} سند، ${faInt(res.created.ingredients)} ماده، ${faInt(res.created.formulations)} فرمولاسیون، ${faInt(res.created.graphEntities)} موجودیت گراف`,
      });
      await loadSettings();
    } catch (e) {
      toast.error("بارگذاری دادهٔ نمونه ناموفق", {
        id: t,
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تنظیمات و پیکربندی"
        description="پیکربندی جاری مدل زبانی، بردارسازی، بازیابی و محدودیت‌ها — همه از متغیرهای محیطی سرور خوانده می‌شود."
        icon={Settings2}
      />

      {settingsLoading || !settings ? (
        <LoadingCards count={4} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ConfigCard
              icon={Bot}
              title="مدل زبانی"
              rows={[
                { label: "وضعیت", value: settings.mode === "demo" ? "حالت نمایشی (بدون دیتابیس)" : "متصل و فعال" },
                { label: "معماری", value: "RAG مستندمحور با استناد" },
                { label: "اجرا", value: "سمت سرور (ایزوله)" },
              ]}
            />
            <ConfigCard
              icon={Sparkles}
              title="بردارسازی"
              rows={[
                { label: "حالت", value: "آفلاین و درونی" },
                { label: "بعد بردار", value: faNum(settings.embeddingDim) },
                { label: "ذخیره‌سازی", value: "SQLite (JSON)" },
              ]}
            />
            <ConfigCard
              icon={Search}
              title="بازیابی (RAG)"
              rows={[
                { label: "top-K", value: faNum(settings.retrieval.topK) },
                { label: "ثابت RRF (k)", value: faNum(settings.retrieval.rrfK) },
                { label: "اندازهٔ قطعه", value: `${faNum(settings.retrieval.chunkSize)} نویسه` },
                { label: "هم‌پوشانی", value: `${faNum(settings.retrieval.chunkOverlap)} نویسه` },
                {
                  label: "اجزا",
                  value: [
                    settings.retrieval.keywordEnabled ? "کلیدواژه" : null,
                    settings.retrieval.vectorEnabled ? "برداری" : null,
                    settings.retrieval.graphEnabled ? "گراف" : null,
                  ]
                    .filter(Boolean)
                    .join(" + "),
                },
              ]}
            />
            <ConfigCard
              icon={Gauge}
              title="محدودیت‌ها"
              rows={[
                { label: "حداکثر حجم آپلود", value: `${faNum(settings.limits.maxUploadMB)} مگابایت` },
                { label: "پسوندهای مجاز", value: settings.limits.allowedExtensions.join("، ") },
              ]}
            />
          </div>

          {/* آمار */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="mb-4 flex items-center gap-2 text-sm font-bold">
              <Database className="size-4 text-emerald-300" aria-hidden />
              آمار مخزن دانش
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {(
                [
                  ["اسناد", settings.counts.documents],
                  ["قطعات", settings.counts.chunks],
                  ["مواد", settings.counts.ingredients],
                  ["فرمولاسیون‌ها", settings.counts.formulations],
                  ["رأس گراف", settings.counts.graphEntities],
                  ["رابطه گراف", settings.counts.graphRelationships],
                  ["پرونده عیب‌یابی", settings.counts.cases],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
                  <p className="text-xl font-black tabular-nums text-emerald-300">{faInt(value)}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-4">
              <Button
                onClick={runSeed}
                disabled={seeding}
                variant="outline"
                className="gap-2 rounded-xl border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10"
              >
                <Sparkles className="size-4" aria-hidden />
                بارگذاری دادهٔ نمایشی مصنوعی
              </Button>
              <p className="text-[11px] leading-5 text-muted-foreground">
                شامل اسناد نمونهٔ فارسی، مواد، دو فرمولاسیون و گراف — همه برچسب‌گذاری‌شده به‌عنوان دادهٔ مصنوعی
                (هرگز دادهٔ آزمایشگاهی واقعی نیست).
              </p>
            </div>
          </div>

          {/* امنیت */}
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
              <ShieldAlert className="size-4" aria-hidden />
              امنیت و محرمانگی
            </p>
            <ul className="space-y-2">
              {settings.security.notes.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-6 text-amber-100/85">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-amber-400" />
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-start gap-1.5 border-t border-amber-400/15 pt-3 text-[11px] leading-5 text-amber-200/70">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {settings.disclaimer}
            </p>
          </div>

          {/* معماری */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Network className="size-4 text-emerald-300" aria-hidden />
              معماری در یک نگاه
            </p>
            <div className="nice-scroll overflow-x-auto">
              <pre dir="ltr" className="min-w-[560px] rounded-xl bg-[oklch(0.14_0.012_170)] p-4 text-left text-[11px] leading-6 text-emerald-100/80">
{`Upload (PDF/TXT/MD/CSV)
   │  extract → pages → chunk (size/overlap) → internal embedding (384d)
   ▼
SQLite (Prisma) ── Document ── Chunk(text, page, heading, vector)
   │                                   │
   │                     ┌─────────────┴─────────────┐
   │                BM25 keyword               cosine vector
   │                     └──────── RRF fusion ──┘──► top-K evidence
   │                                                  │
Graph entities/relations ◄── LLM extraction      LLM answer + [n] citations
(SQLite adjacency, BFS multi-hop)                «شواهد» ≠ «فرضیه»`}
            </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
