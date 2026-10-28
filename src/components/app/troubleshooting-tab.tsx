"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  FlaskConicalOff,
  ListChecks,
  ShieldAlert,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader, EmptyState, LoadingCards, ConfidenceBadge } from "@/components/app/shared";
import { EvidenceList } from "@/components/app/evidence-card";
import { apiFetch, jsonBody, ApiClientError } from "@/hooks/use-api";
import { useAppStore } from "@/store/app-store";
import { faDate, faNum } from "@/lib/fa";
import {
  PRODUCT_CATEGORIES_FA,
  type TroubleshootingAnalysis,
  type TroubleshootingCaseDTO,
} from "@/lib/types";

export function TroubleshootingTab() {
  const [cases, setCases] = useState<TroubleshootingCaseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [conditions, setConditions] = useState("");
  const [measurements, setMeasurements] = useState("");

  const [openCase, setOpenCase] = useState<string | null>(null);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ cases: TroubleshootingCaseDTO[] }>("/api/troubleshooting/cases");
      setCases(res.cases);
    } catch {
      // حالت خالی
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (title.trim() === "" || category === "" || symptoms.trim() === "") {
      toast.error("عنوان، دستهٔ محصول و علائم مشاهده‌شده الزامی است");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ case: TroubleshootingCaseDTO }>("/api/troubleshooting/cases", {
        method: "POST",
        ...jsonBody({
          title: title.trim(),
          productCategory: category,
          symptoms: symptoms.trim(),
          manufacturingConditions: conditions.trim() || null,
          measurements: measurements.trim() || null,
        }),
      });
      toast.success("پرونده ثبت و تحلیل محتاطانه انجام شد", { description: res.case.title });
      setTitle("");
      setCategory("");
      setSymptoms("");
      setConditions("");
      setMeasurements("");
      setOpenCase(res.case.id);
      await load();
      bumpRefresh();
    } catch (e) {
      toast.error("ثبت پرونده ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="عیب‌یابی محتاطانه"
        description="علائم و شرایط تولید را ثبت کنید؛ سیستم مدارک و پرونده‌های قبلی مرتبط را بازیابی و «عوامل احتمالی مبتنی بر شواهد» پیشنهاد می‌دهد — نه علت قطعی."
        icon={Wrench}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* فرم ثبت */}
        <div className="h-fit rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="mb-4 font-bold">ثبت پروندهٔ جدید</p>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tc-title">عنوان پرونده *</Label>
              <Input
                id="tc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: افت ویسکوزیتهٔ شامپو پس از یک هفته"
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
            <div className="grid gap-2">
              <Label>دستهٔ محصول *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
                  <SelectValue placeholder="انتخاب دسته" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES_FA.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tc-symptoms">علائم مشاهده‌شده *</Label>
              <Textarea
                id="tc-symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={3}
                placeholder="چه چیزی دیده می‌شود؟ از کی؟ در چه شرایطی؟"
                className="nice-scroll border-white/10 bg-white/[0.04]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tc-conditions">شرایط تولید</Label>
              <Textarea
                id="tc-conditions"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                rows={2}
                placeholder="دما، ترتیب افزودن، سرعت همزدن، زمان مخلوط‌کردن و…"
                className="nice-scroll border-white/10 bg-white/[0.04]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tc-measurements">اندازه‌گیری‌های موجود</Label>
              <Textarea
                id="tc-measurements"
                value={measurements}
                onChange={(e) => setMeasurements(e.target.value)}
                rows={2}
                placeholder="مثلاً: pH=6.2 ، ویسکوزیته=1200 cP ، درصد نمک اندازه‌گیری نشده"
                className="nice-scroll border-white/10 bg-white/[0.04]"
              />
            </div>
            <Button
              onClick={submit}
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-500 font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
            >
              {submitting ? "در حال تحلیل مدارک…" : "ثبت پرونده و تحلیل محتاطانه"}
            </Button>
          </div>
        </div>

        {/* تاریخچه پرونده‌ها */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-bold">
            <ClipboardList className="size-4 text-emerald-300" aria-hidden />
            پرونده‌های ثبت‌شده
          </p>
          {loading ? (
            <LoadingCards count={2} />
          ) : cases.length === 0 ? (
            <EmptyState
              icon={FlaskConicalOff}
              title="هنوز پرونده‌ای ثبت نشده"
              hint="اولین مورد عیب‌یابی را ثبت کنید تا تحلیل مبتنی بر مدارک دریافت کنید."
            />
          ) : (
            <div className="nice-scroll max-h-[62vh] space-y-3 overflow-y-auto pe-1">
              {cases.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenCase(openCase === c.id ? null : c.id)}
                    className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{c.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {c.productCategory} • {faDate(c.createdAt)}
                      </p>
                    </div>
                    <span className="ms-auto shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {openCase === c.id ? "بستن" : "مشاهده تحلیل"}
                    </span>
                  </button>
                  {openCase === c.id ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-white/[0.06] p-4"
                    >
                      <p className="text-xs leading-6 text-muted-foreground">
                        <span className="font-semibold text-foreground/80">علائم:</span> {c.symptoms}
                      </p>
                      {c.analysis ? (
                        <AnalysisView analysis={c.analysis} />
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">تحلیلی برای این پرونده ثبت نشده است.</p>
                      )}
                    </motion.div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnalysisView({ analysis }: { analysis: TroubleshootingAnalysis }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
        <p className="text-xs leading-6 text-amber-100/90">{analysis.disclaimer}</p>
      </div>

      {analysis.summary ? (
        <p className="text-[13px] leading-7 text-foreground/90">{analysis.summary}</p>
      ) : null}

      {analysis.possibleFactors.length > 0 ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-200">
            <ListChecks className="size-3.5" aria-hidden />
            عوامل احتمالی مبتنی بر مدارک
          </p>
          <div className="space-y-2">
            {analysis.possibleFactors.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold">{f.factor}</span>
                  <ConfidenceBadge level={f.confidence} />
                  {f.evidenceRefs.length > 0 ? (
                    <span className="flex gap-1">
                      {f.evidenceRefs.map((n) => (
                        <a
                          key={n}
                          href={`#evidence-${n}`}
                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-emerald-400/40 bg-emerald-500/15 px-1 text-[11px] font-bold text-emerald-300"
                          aria-label={`منبع ${n}`}
                        >
                          {faNum(n)}
                        </a>
                      ))}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-xs leading-6 text-muted-foreground">{f.rationale}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

      {analysis.missingInfo.length > 0 ? (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-200">
            <TriangleAlert className="size-3.5" aria-hidden />
            اطلاعات مورد نیاز برای نتیجه‌گیری
          </p>
          <ul className="list-disc space-y-1 pe-5 text-xs leading-6 text-muted-foreground marker:text-amber-400/60">
            {analysis.missingInfo.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.suggestedInvestigations.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-bold text-emerald-200">اقدامات پیشنهادی برای بررسی (نه تغییر فرمول تولید)</p>
          <ol className="list-decimal space-y-1 pe-5 text-xs leading-6 text-muted-foreground marker:text-emerald-400/70">
            {analysis.suggestedInvestigations.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {analysis.evidence && analysis.evidence.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">مدارک بازیابی‌شده</p>
          <EvidenceList evidence={analysis.evidence} />
        </div>
      ) : null}
    </div>
  );
}
