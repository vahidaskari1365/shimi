"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Boxes, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { faDate, faInt } from "@/lib/fa";
import { INGREDIENT_CATEGORIES_FA, type IngredientDTO } from "@/lib/types";

interface IngredientForm {
  name: string;
  inciName: string;
  category: string;
  description: string;
  casNumber: string;
}

const EMPTY_FORM: IngredientForm = { name: "", inciName: "", category: "", description: "", casNumber: "" };

export function IngredientsTab() {
  const [items, setItems] = useState<IngredientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientDTO | null>(null);
  const [form, setForm] = useState<IngredientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IngredientDTO | null>(null);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ ingredients: IngredientDTO[] }>("/api/ingredients");
      setItems(res.ingredients);
    } catch {
      // حالت خالی نشان داده می‌شود
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
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.inciName ?? "").toLowerCase().includes(q) ||
        i.category.includes(q),
    );
  }, [items, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (ing: IngredientDTO) => {
    setEditing(ing);
    setForm({
      name: ing.name,
      inciName: ing.inciName ?? "",
      category: ing.category,
      description: ing.description ?? "",
      casNumber: ing.casNumber ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (form.name.trim() === "" || form.category === "") {
      toast.error("نام ماده و دسته الزامی است");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        inciName: form.inciName.trim() || null,
        category: form.category,
        description: form.description.trim() || null,
        casNumber: form.casNumber.trim() || null,
      };
      if (editing) {
        await apiFetch(`/api/ingredients/${editing.id}`, { method: "PATCH", ...jsonBody(payload) });
        toast.success("ماده اولیه به‌روزرسانی شد");
      } else {
        await apiFetch("/api/ingredients", { method: "POST", ...jsonBody(payload) });
        toast.success("ماده اولیه اضافه شد");
      }
      setDialogOpen(false);
      await load();
      bumpRefresh();
    } catch (e) {
      toast.error("ذخیره ناموفق بود", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await apiFetch(`/api/ingredients/${target.id}`, { method: "DELETE" });
      toast.success("ماده اولیه حذف شد");
      await load();
      bumpRefresh();
    } catch (e) {
      toast.error("حذف ناموفق", {
        description:
          e instanceof ApiClientError
            ? e.message === "HTTP_409" || e.message.includes("CONFLICT")
              ? "این ماده در فرمولاسیونی استفاده شده و حذف آن مجاز نیست."
              : e.message
            : "خطای نامشخص",
      });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مواد اولیه"
        description="فهرست مرجع مواد خام؛ پایهٔ ساخت فرمولاسیون‌ها و گره‌های «ماده اولیه» در گراف دانش."
        icon={Boxes}
        action={
          <Button
            onClick={openCreate}
            className="gap-2 rounded-xl bg-emerald-500 font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
          >
            <Plus className="size-4" aria-hidden />
            مادهٔ جدید
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو در نام، INCI یا دسته…"
          aria-label="جستجوی ماده اولیه"
          className="border-white/10 bg-white/[0.04] pe-3 pr-9"
        />
      </div>

      {loading ? (
        <LoadingCards count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={query ? "نتیجه‌ای یافت نشد" : "هنوز ماده اولیه‌ای ثبت نشده"}
          hint={
            query
              ? "عبارت دیگری را امتحان کنید یا مادهٔ جدیدی بسازید."
              : "مواد خام پایه (سورفکتانت، نگهدارنده، عدل‌کننده pH و…) را ثبت کنید تا در فرمولاسیون‌ها قابل استفاده باشند."
          }
          action={
            query ? undefined : (
              <Button onClick={openCreate} variant="outline" className="gap-2 rounded-xl">
                <Plus className="size-4" aria-hidden />
                ثبت اولین ماده
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
          <div className="nice-scroll max-h-[60vh] overflow-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky top-0 z-10 bg-[oklch(0.19_0.014_170)] text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">نام تجاری</th>
                  <th className="px-4 py-3 text-start font-semibold">INCI</th>
                  <th className="px-4 py-3 text-start font-semibold">دسته</th>
                  <th className="px-4 py-3 text-start font-semibold">CAS</th>
                  <th className="px-4 py-3 text-start font-semibold">ثبت</th>
                  <th className="px-4 py-3 text-end font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((ing) => (
                    <motion.tr
                      key={ing.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-semibold">
                        {ing.name}
                        {ing.isSeed ? (
                          <span className="ms-2 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] text-muted-foreground">
                            نمایشی
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                        {ing.inciName ?? "—"}
                      </td>
                      <td className="px-4 py-3">{ing.category}</td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                        {ing.casNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{faDate(ing.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-emerald-300"
                            onClick={() => openEdit(ing)}
                            aria-label={`ویرایش ${ing.name}`}
                          >
                            <Pencil className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-200"
                            onClick={() => setDeleteTarget(ing)}
                            aria-label={`حذف ${ing.name}`}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <p className="border-t border-white/[0.05] px-4 py-2.5 text-[11px] text-muted-foreground">
            {faInt(filtered.length)} ماده اولیه
          </p>
        </div>
      )}

      {/* دیالوگ افزودن/ویرایش */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-lg border-white/10 bg-[oklch(0.21_0.014_170)]">
          <DialogHeader className="text-right">
            <DialogTitle>{editing ? `ویرایش «${editing.name}»` : "مادهٔ اولیهٔ جدید"}</DialogTitle>
            <DialogDescription>مشخصات پایهٔ ماده را وارد کنید؛ نام باید یکتا باشد.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ing-name">نام تجاری *</Label>
              <Input
                id="ing-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="مثال: لاریل اتر سولفات سدیم"
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ing-inci">نام INCI</Label>
                <Input
                  id="ing-inci"
                  dir="ltr"
                  value={form.inciName}
                  onChange={(e) => setForm((f) => ({ ...f, inciName: e.target.value }))}
                  placeholder="Sodium Laureth Sulfate"
                  className="border-white/10 bg-white/[0.04] text-left"
                />
              </div>
              <div className="grid gap-2">
                <Label>دسته *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
                    <SelectValue placeholder="انتخاب دسته" />
                  </SelectTrigger>
                  <SelectContent>
                    {INGREDIENT_CATEGORIES_FA.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ing-cas">شمارهٔ CAS</Label>
              <Input
                id="ing-cas"
                dir="ltr"
                value={form.casNumber}
                onChange={(e) => setForm((f) => ({ ...f, casNumber: e.target.value }))}
                placeholder="68585-34-2"
                className="border-white/10 bg-white/[0.04] text-left"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ing-desc">توضیحات</Label>
              <Textarea
                id="ing-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="نقش کاربردی، محدودیت‌ها، نکات فرمولاسیون…"
                rows={3}
                className="nice-scroll border-white/10 bg-white/[0.04]"
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-start gap-2">
            <Button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-emerald-500 font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
            >
              {saving ? "در حال ذخیره…" : "ذخیره"}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأیید حذف */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف «{deleteTarget?.name}»؟</AlertDialogTitle>
            <AlertDialogDescription>
              اگر این ماده در فرمولاسیونی به‌کاررفته باشد، حذف با خطای تداخل مواجه می‌شود.
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
