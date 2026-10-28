"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SectionHeader, EmptyState, LoadingCards } from "@/components/app/shared";
import { apiFetch, jsonBody, ApiClientError } from "@/hooks/use-api";
import { useAppStore } from "@/store/app-store";
import { faDate, faInt, faNum, faPct } from "@/lib/fa";
import {
  FORMULATION_STATUS_FA,
  MEASUREMENT_UNITS_FA,
  PRODUCT_CATEGORIES_FA,
  type FormulationDetailDTO,
  type FormulationSummaryDTO,
  type IngredientDTO,
} from "@/lib/types";

interface RowItem {
  key: string;
  ingredientId: string;
  percentage: string;
  phase: string;
}

let rowSeq = 0;

export function FormulationsTab() {
  const [items, setItems] = useState<FormulationSummaryDTO[]>([]);
  const [ingredients, setIngredients] = useState<IngredientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // فرم ایجاد
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<RowItem[]>([]);

  // جزئیات
  const [detail, setDetail] = useState<FormulationDetailDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormulationSummaryDTO | null>(null);

  // افزودن اندازه‌گیری/آزمایش
  const [mName, setMName] = useState("");
  const [mValue, setMValue] = useState("");
  const [mUnit, setMUnit] = useState<string>("-");
  const [eTitle, setETitle] = useState("");
  const [eSummary, setESummary] = useState("");

  const bumpRefresh = useAppStore((s) => s.bumpRefresh);

  const load = useCallback(async () => {
    try {
      const [f, i] = await Promise.all([
        apiFetch<{ formulations: FormulationSummaryDTO[] }>("/api/formulations"),
        apiFetch<{ ingredients: IngredientDTO[] }>("/api/ingredients"),
      ]);
      setItems(f.formulations);
      setIngredients(i.ingredients);
    } catch {
      // حالت خالی
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) => f.name.toLowerCase().includes(q) || f.productCategory.includes(q));
  }, [items, query]);

  const sumPct = useMemo(
    () => rows.reduce((acc, r) => acc + (parseFloat(r.percentage) || 0), 0),
    [rows],
  );
  const sumValid = Math.abs(sumPct - 100) < 0.01;

  const openCreate = () => {
    setName("");
    setCategory("");
    setDescription("");
    setRows([]);
    setCreateOpen(true);
  };

  const addRow = () => {
    if (ingredients.length === 0) {
      toast.error("اول در تب «مواد اولیه» چند ماده ثبت کنید");
      return;
    }
    setRows((r) => [...r, { key: `r${++rowSeq}`, ingredientId: "", percentage: "", phase: "" }]);
  };

  const createFormulation = async () => {
    if (name.trim() === "" || category === "") {
      toast.error("نام فرمولاسیون و دستهٔ محصول الزامی است");
      return;
    }
    const valid = rows.filter((r) => r.ingredientId !== "" && r.percentage !== "");
    if (valid.length === 0) {
      toast.error("حداقل یک ماده با درصد معتبر اضافه کنید");
      return;
    }
    if (!sumValid) {
      toast.error("مجموع درصدها باید دقیقاً ۱۰۰ باشد", {
        description: `مجموع فعلی: ${faNum(Math.round(sumPct * 100) / 100)}`,
      });
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/formulations", {
        method: "POST",
        ...jsonBody({
          name: name.trim(),
          productCategory: category,
          description: description.trim() || null,
          ingredients: valid.map((r) => ({
            ingredientId: r.ingredientId,
            percentage: parseFloat(r.percentage),
            phase: r.phase.trim() || null,
          })),
        }),
      });
      toast.success("فرمولاسیون ثبت شد", { description: name });
      setCreateOpen(false);
      await load();
      bumpRefresh();
    } catch (e) {
      toast.error("ثبت فرمولاسیون ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (f: FormulationSummaryDTO) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await apiFetch<FormulationDetailDTO>(`/api/formulations/${f.id}`);
      setDetail(d);
    } catch (e) {
      toast.error("بارگذاری جزئیات ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const addMeasurement = async () => {
    if (!detail || mName.trim() === "" || mValue.trim() === "") {
      toast.error("نام و مقدار اندازه‌گیری الزامی است");
      return;
    }
    const value = parseFloat(mValue);
    if (Number.isNaN(value)) {
      toast.error("مقدار باید عددی باشد");
      return;
    }
    try {
      await apiFetch(`/api/formulations/${detail.id}/measurements`, {
        method: "POST",
        ...jsonBody({ name: mName.trim(), value, unit: mUnit }),
      });
      toast.success("اندازه‌گیری ثبت شد");
      setMName("");
      setMValue("");
      await openDetail(detail);
    } catch (e) {
      toast.error("ثبت اندازه‌گیری ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    }
  };

  const addExperiment = async () => {
    if (!detail || eTitle.trim() === "") {
      toast.error("عنوان آزمایش الزامی است");
      return;
    }
    try {
      await apiFetch(`/api/formulations/${detail.id}/experiments`, {
        method: "POST",
        ...jsonBody({ title: eTitle.trim(), summary: eSummary.trim() || null }),
      });
      toast.success("آزمایش ثبت شد");
      setETitle("");
      setESummary("");
      await openDetail(detail);
    } catch (e) {
      toast.error("ثبت آزمایش ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    }
  };

  const changeStatus = async (status: string) => {
    if (!detail) return;
    try {
      await apiFetch(`/api/formulations/${detail.id}`, { method: "PATCH", ...jsonBody({ status }) });
      await openDetail(detail);
      toast.success("وضعیت به‌روزرسانی شد");
    } catch (e) {
      toast.error("به‌روزرسانی ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await apiFetch(`/api/formulations/${target.id}`, { method: "DELETE" });
      toast.success("فرمولاسیون حذف شد");
      await load();
      bumpRefresh();
    } catch (e) {
      toast.error("حذف ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="فرمولاسیون‌ها"
        description="نسخه‌های فرمول با مواد، درصد (واحد ٪) و فاز صریح؛ اندازه‌گیری‌ها و آزمایش‌های هر نسخه قابل ثبت است."
        icon={FlaskConical}
        action={
          <Button
            onClick={openCreate}
            className="gap-2 rounded-xl bg-emerald-500 font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
          >
            <Plus className="size-4" aria-hidden />
            فرمولاسیون جدید
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی نام یا دستهٔ محصول…"
          aria-label="جستجوی فرمولاسیون"
          className="border-white/10 bg-white/[0.04] pr-9"
        />
      </div>

      {loading ? (
        <LoadingCards count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={query ? "نتیجه‌ای یافت نشد" : "هنوز فرمولاسیونی ثبت نشده"}
          hint={
            query
              ? "عبارت دیگری را امتحان کنید."
              : "یک فرمول پایه (مثلاً شامپو یا مایع ظرفشویی) با مواد و درصدها بسازید."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((f) => (
              <motion.button
                key={f.id}
                type="button"
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                onClick={() => openDetail(f)}
                className="card-lift group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-start"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{f.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{f.productCategory}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-emerald-400/25 text-emerald-300">
                    نسخهٔ {faNum(f.version)}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-white/5 px-2 py-1">
                    {faInt(f.ingredientCount)} ماده
                  </span>
                  <span className="rounded-md bg-white/5 px-2 py-1">
                    {FORMULATION_STATUS_FA[f.status] ?? f.status}
                  </span>
                  {f.isSeed ? (
                    <span className="rounded-md bg-white/5 px-2 py-1">نمونهٔ مصنوعی</span>
                  ) : null}
                  <span className="ms-auto">{faDate(f.createdAt)}</span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* دیالوگ ایجاد */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dir="rtl" className="max-h-[88vh] max-w-2xl overflow-y-auto nice-scroll border-white/10 bg-[oklch(0.21_0.014_170)]">
          <DialogHeader className="text-right">
            <DialogTitle>فرمولاسیون جدید</DialogTitle>
            <DialogDescription>
              مواد و درصد هر ماده (٪ وزنی) را وارد کنید؛ مجموع باید دقیقاً ۱۰۰ باشد.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="f-name">نام فرمولاسیون *</Label>
                <Input
                  id="f-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: شامپو پایهٔ ملایم"
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="f-desc">توضیحات</Label>
              <Textarea
                id="f-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="border-white/10 bg-white/[0.04]"
              />
            </div>

            {/* مواد و درصدها */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between">
                <Label>مواد تشکیل‌دهنده *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  className="h-8 gap-1.5 rounded-lg text-xs"
                >
                  <Plus className="size-3.5" aria-hidden />
                  ردیف
                </Button>
              </div>
              <div className="space-y-2">
                {rows.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-muted-foreground">
                    هنوز ماده‌ای اضافه نشده است
                  </p>
                ) : null}
                {rows.map((r) => (
                  <div key={r.key} className="flex flex-wrap items-center gap-2">
                    <div className="min-w-40 flex-1">
                      <Select
                        value={r.ingredientId}
                        onValueChange={(v) =>
                          setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, ingredientId: v } : x)))
                        }
                      >
                        <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-xs">
                          <SelectValue placeholder="انتخاب ماده" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={r.percentage}
                      onChange={(e) =>
                        setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, percentage: e.target.value } : x)))
                      }
                      placeholder="٪ وزنی"
                      aria-label="درصد"
                      className="w-24 border-white/10 bg-white/[0.04] text-center text-xs"
                    />
                    <Input
                      value={r.phase}
                      onChange={(e) =>
                        setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, phase: e.target.value } : x)))
                      }
                      placeholder="فاز (مثلاً A)"
                      aria-label="فاز"
                      className="w-28 border-white/10 bg-white/[0.04] text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-rose-300/70 hover:bg-rose-500/10"
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                      aria-label="حذف ردیف"
                    >
                      <X className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
              {rows.length > 0 ? (
                <div className="mt-3">
                  <div className="mb-1.5 flex justify-between text-[11px]">
                    <span className="text-muted-foreground">مجموع درصدها</span>
                    <span className={`font-bold tabular-nums ${sumValid ? "text-emerald-300" : "text-amber-300"}`}>
                      {faNum(Math.round(sumPct * 100) / 100)} / ۱۰۰
                    </span>
                  </div>
                  <Progress
                    value={Math.min(sumPct, 100)}
                    className={`h-1.5 ${sumValid ? "[&>div]:bg-emerald-400" : "[&>div]:bg-amber-400"}`}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="flex-row justify-start gap-2">
            <Button
              onClick={createFormulation}
              disabled={saving}
              className="rounded-xl bg-emerald-500 font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
            >
              {saving ? "در حال ثبت…" : "ثبت فرمولاسیون"}
            </Button>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ جزئیات */}
      <Dialog open={detail !== null || detailLoading} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent dir="rtl" className="max-h-[88vh] max-w-3xl overflow-y-auto nice-scroll border-white/10 bg-[oklch(0.21_0.014_170)]">
          {detailLoading || !detail ? (
            <>
              <DialogHeader className="text-right">
                <DialogTitle>جزئیات فرمولاسیون</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-6">
                <div className="skeleton-shimmer h-8 w-48 rounded-lg bg-white/5" />
                <div className="skeleton-shimmer h-32 rounded-xl bg-white/5" />
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="text-right">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle>{detail.name}</DialogTitle>
                  <Badge variant="outline" className="border-emerald-400/25 text-emerald-300">
                    نسخهٔ {faNum(detail.version)}
                  </Badge>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground">
                    {detail.productCategory}
                  </Badge>
                </div>
                {detail.description ? (
                  <DialogDescription className="text-start leading-6">{detail.description}</DialogDescription>
                ) : null}
              </DialogHeader>

              <div className="grid gap-5">
                {/* مواد */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">ترکیب (٪ وزنی)</p>
                    <Select value={detail.status} onValueChange={changeStatus}>
                      <SelectTrigger className="h-8 w-36 border-white/10 bg-white/[0.04] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FORMULATION_STATUS_FA).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    {detail.ingredients.length === 0 ? (
                      <p className="text-xs text-muted-foreground">ماده‌ای ثبت نشده است.</p>
                    ) : null}
                    {detail.ingredients.map((ri) => (
                      <div
                        key={ri.id}
                        className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                      >
                        <span className="w-40 truncate text-xs font-semibold">{ri.ingredientName}</span>
                        {ri.phase ? (
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            فاز {ri.phase}
                          </span>
                        ) : null}
                        <div className="h-1.5 min-w-10 flex-1 overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(ri.percentage, 100)}%` }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-emerald-400/80"
                          />
                        </div>
                        <span className="w-16 text-end text-xs font-bold tabular-nums text-emerald-200">
                          {faPct(ri.percentage)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* اندازه‌گیری‌ها */}
                <div>
                  <p className="mb-2 text-sm font-bold">اندازه‌گیری‌ها</p>
                  <div className="space-y-1.5">
                    {detail.measurements.length === 0 ? (
                      <p className="text-xs text-muted-foreground">اندازه‌گیری‌ای ثبت نشده است.</p>
                    ) : (
                      detail.measurements.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs"
                        >
                          <span className="font-semibold">{m.name}</span>
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-300 tabular-nums">
                            {faNum(m.value)} {m.unit !== "-" ? m.unit : ""}
                          </span>
                          {m.method ? <span className="text-muted-foreground">روش: {m.method}</span> : null}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Input
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                      placeholder="نام (مثلاً pH)"
                      className="h-9 w-28 border-white/10 bg-white/[0.04] text-xs"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={mValue}
                      onChange={(e) => setMValue(e.target.value)}
                      placeholder="مقدار"
                      className="h-9 w-24 border-white/10 bg-white/[0.04] text-center text-xs"
                    />
                    <Select value={mUnit} onValueChange={setMUnit}>
                      <SelectTrigger className="h-9 w-24 border-white/10 bg-white/[0.04] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEASUREMENT_UNITS_FA.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMeasurement}
                      className="h-9 rounded-lg text-xs"
                    >
                      افزودن اندازه‌گیری
                    </Button>
                  </div>
                </div>

                {/* آزمایش‌ها */}
                <div>
                  <p className="mb-2 text-sm font-bold">آزمایش‌ها و نتایج</p>
                  <div className="space-y-1.5">
                    {detail.experiments.length === 0 ? (
                      <p className="text-xs text-muted-foreground">آزمایشی ثبت نشده است.</p>
                    ) : (
                      detail.experiments.map((ex) => (
                        <div key={ex.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{ex.title}</span>
                            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {ex.status}
                            </span>
                          </div>
                          {ex.summary ? <p className="mt-1 leading-5 text-muted-foreground">{ex.summary}</p> : null}
                          {ex.results ? (
                            <p className="mt-1 leading-5 text-emerald-200/80">نتیجه: {ex.results}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Input
                      value={eTitle}
                      onChange={(e) => setETitle(e.target.value)}
                      placeholder="عنوان آزمایش"
                      className="h-9 w-40 border-white/10 bg-white/[0.04] text-xs"
                    />
                    <Input
                      value={eSummary}
                      onChange={(e) => setESummary(e.target.value)}
                      placeholder="خلاصه (اختیاری)"
                      className="h-9 flex-1 border-white/10 bg-white/[0.04] text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExperiment}
                      className="h-9 rounded-lg text-xs"
                    >
                      افزودن آزمایش
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
          <DialogFooter className="flex-row items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => detail && setDeleteTarget(detail)}
              className="gap-1.5 rounded-xl text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200"
            >
              <Trash2 className="size-3.5" aria-hidden />
              حذف فرمولاسیون
            </Button>
            <Button variant="outline" onClick={() => setDetail(null)} className="rounded-xl">
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأیید حذف */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف فرمولاسیون «{deleteTarget?.name}»؟</AlertDialogTitle>
            <AlertDialogDescription>
              اندازه‌گیری‌ها و آزمایش‌های مرتبط نیز حذف می‌شوند. این عمل بازگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-start gap-2">
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-500 text-white hover:bg-rose-400">
              بله، حذف کن
            </AlertDialogAction>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
