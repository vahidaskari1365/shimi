"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleAlert,
  FileStack,
  FileText,
  RefreshCw,
  Trash2,
  UploadCloud,
  Waypoints,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { SectionHeader, EmptyState, DocStatusBadge, LoadingCards } from "@/components/app/shared";
import { apiFetch, ApiClientError } from "@/hooks/use-api";
import { useAppStore } from "@/store/app-store";
import { faBytes, faDate, faInt, faNum } from "@/lib/fa";
import type { DocumentDTO } from "@/lib/types";

const ALLOWED = ["application/pdf", "text/plain", "text/markdown", "text/csv"];
const MAX_MB = 15;

export function DocumentsTab() {
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentDTO | null>(null);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ documents: DocumentDTO[] }>("/api/documents");
      setDocuments(res.documents);
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "NETWORK") {
        // سرور هنوز گرم نشده — بی‌صدا نگه می‌داریم
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, ]);

  const uploadFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["pdf", "txt", "md", "csv"].includes(ext)) {
        toast.error(`پسوند .${ext} پشتیبانی نمی‌شود`, { description: "فرمت‌های مجاز: PDF، TXT، Markdown، CSV" });
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`حجم ${file.name} بیش از ${MAX_MB} مگابایت است`);
        continue;
      }
      setUploading(file.name);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await apiFetch<{ document: DocumentDTO; duplicate: boolean }>("/api/documents", {
          method: "POST",
          body: fd,
        });
        if (res.duplicate) {
          toast.info("این فایل قبلاً نمایه شده است", { description: res.document.title });
        } else if (res.document.status === "needs_ocr") {
          toast.warning("سند اسکن‌شده است", {
            description: "متن قابل استخراج نبود؛ برای این سند به OCR نیاز است.",
          });
        } else {
          toast.success("سند نمایه شد", {
            description: `${res.document.title} — ${faInt(res.document.chunkCount)} قطعه دانش`,
          });
        }
        await load();
        bumpRefresh();
      } catch (e) {
        toast.error("نمایه‌سازی ناموفق بود", {
          description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
        });
      } finally {
        setUploading(null);
      }
    }
  };

  const reindex = async (doc: DocumentDTO) => {
    setBusyDocId(doc.id);
    try {
      await apiFetch(`/api/documents/${doc.id}/reindex`, { method: "POST" });
      toast.success("بازنمایه‌سازی انجام شد", { description: doc.title });
      await load();
      bumpRefresh();
    } catch (e) {
      toast.error("بازنمایه‌سازی ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    } finally {
      setBusyDocId(null);
    }
  };

  const extractGraph = async (doc: DocumentDTO) => {
    setBusyDocId(doc.id);
    const t = toast.loading("استخراج موجودیت‌ها و روابط از سند…", { description: doc.title });
    try {
      const res = await apiFetch<{ entities: number; relationships: number }>(
        `/api/documents/${doc.id}/extract-graph`,
        { method: "POST" },
      );
      toast.success("استخراج گراف کامل شد", {
        id: t,
        description: `${faInt(res.entities)} موجودیت و ${faInt(res.relationships)} رابطه اضافه/به‌روز شد (همه نیازمند راستی‌آزمایی).`,
      });
      bumpRefresh();
    } catch (e) {
      toast.error("استخراج گراف ناموفق", {
        id: t,
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    } finally {
      setBusyDocId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const doc = deleteTarget;
    setDeleteTarget(null);
    setBusyDocId(doc.id);
    try {
      await apiFetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      toast.success("سند و داده‌های وابسته حذف شد", { description: doc.title });
      await load();
      bumpRefresh();
    } catch (e) {
      toast.error("حذف ناموفق", { description: e instanceof ApiClientError ? e.message : "خطای نامشخص" });
    } finally {
      setBusyDocId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="کتابخانهٔ اسناد"
        description="PDF، TXT، Markdown و CSV را بارگذاری کنید؛ متن استخراج، قطعه‌قطعه و بردارسازی می‌شود. منشأ هر قطعه (سند و صفحه) حفظ می‌شود."
        icon={FileStack}
      />

      {/* ناحیهٔ بارگذاری */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        aria-label="بارگذاری سند"
        className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all ${
          dragOver
            ? "border-emerald-400/70 bg-emerald-500/[0.08]"
            : "border-white/10 bg-white/[0.02] hover:border-emerald-400/40 hover:bg-emerald-500/[0.04]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.csv"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <motion.span
          animate={uploading ? { y: [0, -6, 0] } : {}}
          transition={{ repeat: uploading ? Infinity : 0, duration: 1 }}
          className="flex size-14 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
        >
          <UploadCloud className="size-7" aria-hidden />
        </motion.span>
        {uploading ? (
          <p className="text-sm font-semibold text-emerald-200">
            در حال نمایه‌سازی «{uploading}» … این ممکن است چند لحظه طول بکشد
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold">
              سند را اینجا رها کنید یا <span className="text-emerald-300">انتخاب فایل</span>
            </p>
            <p className="text-xs text-muted-foreground">
              PDF، TXT، Markdown، CSV — حداکثر {faNum(MAX_MB)} مگابایت • فایل تکراری دوباره نمایه نمی‌شود
            </p>
          </>
        )}
      </div>

      {/* فهرست اسناد */}
      {loading ? (
        <LoadingCards count={3} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="هنوز سندی نمایه نشده"
          hint="برای شروع، یک سند علمی یا فرمولاسیون داخلی بارگذاری کنید؛ سپس در گفت‌وگو می‌توانید دربارهٔ آن بپرسید."
        />
      ) : (
        <div className="nice-scroll max-h-[62vh] space-y-3 overflow-y-auto pe-1">
          <AnimatePresence initial={false}>
            {documents.map((doc) => (
              <motion.article
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
                className="card-lift rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-emerald-300">
                    <FileText className="size-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{doc.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {doc.originalName} • {faBytes(doc.sizeBytes)} • {faDate(doc.createdAt)}
                      {doc.isSeed ? " • دادهٔ نمایشی مصنوعی" : ""}
                    </p>
                  </div>
                  <div className="ms-auto flex items-center gap-2">
                    <DocStatusBadge status={doc.status} />
                  </div>
                </div>

                {doc.error ? (
                  <p className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-rose-400/25 bg-rose-500/[0.07] px-2.5 py-1.5 text-xs text-rose-200">
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {doc.error}
                  </p>
                ) : null}
                {doc.needsOcr ? (
                  <p className="mt-2.5 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-2.5 py-1.5 text-xs leading-5 text-amber-200">
                    این سند متنی قابل استخراج ندارد (احتمالاً اسکن‌شده است) و به OCR نیاز دارد. در این MVP، OCR اجرا نمی‌شود.
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-3">
                  {doc.status === "ready" ? (
                    <span className="text-[11px] text-muted-foreground">
                      {faNum(doc.pageCount ?? 0)} صفحه • {faInt(doc.chunkCount)} قطعه
                    </span>
                  ) : null}
                  <div className="ms-auto flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyDocId === doc.id || doc.status !== "ready"}
                      onClick={() => extractGraph(doc)}
                      className="h-8 gap-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                    >
                      <Waypoints className="size-3.5" aria-hidden />
                      استخراج گراف
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyDocId === doc.id}
                      onClick={() => reindex(doc)}
                      className="h-8 gap-1.5 text-xs"
                    >
                      <RefreshCw className={`size-3.5 ${busyDocId === doc.id ? "animate-spin" : ""}`} aria-hidden />
                      بازنمایه‌سازی
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyDocId === doc.id}
                      onClick={() => setDeleteTarget(doc)}
                      className="h-8 gap-1.5 text-xs text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      حذف
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* تأیید حذف */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف سند «{deleteTarget?.title}»؟</AlertDialogTitle>
            <AlertDialogDescription>
              فایل اصلی، همهٔ قطعات متن، بردارها و رکوردهای گراف مشتق‌شده از این سند حذف می‌شوند. این عمل
              بازگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-start gap-2">
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-500 text-white hover:bg-rose-400"
            >
              بله، حذف کن
            </AlertDialogAction>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
