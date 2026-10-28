"use client";

import type { LucideIcon } from "lucide-react";
import { DOC_STATUS_FA, type DocStatus } from "@/lib/types";
import { faInt } from "@/lib/fa";
import { motion } from "framer-motion";

// ───────────── عنوان بخش (بدون برچسب‌های متادیتای ارزان‌قیمت) ─────────────
export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-bold tracking-tight md:text-xl">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

// ───────────── حالت خالی ─────────────
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300/80">
        <Icon className="size-7" aria-hidden />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {hint ? <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}

// ───────────── نشان وضعیت سند ─────────────
const DOC_STATUS_STYLE: Record<DocStatus, string> = {
  pending: "border-white/15 bg-white/5 text-muted-foreground",
  processing: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  ready: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  failed: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  needs_ocr: "border-amber-400/40 bg-amber-400/10 text-amber-200",
};

export function DocStatusBadge({ status }: { status: DocStatus }) {
  const isBusy = status === "processing";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${DOC_STATUS_STYLE[status]}`}
    >
      {isBusy ? <span className="pulse-dot size-1.5 rounded-full bg-amber-300" /> : null}
      {DOC_STATUS_FA[status]}
    </span>
  );
}

// ───────────── نشان سطح اطمینان ─────────────
export function ConfidenceBadge({ level }: { level: "کم" | "متوسط" | "زیاد" }) {
  const style =
    level === "زیاد"
      ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
      : level === "متوسط"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
        : "border-white/15 bg-white/5 text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${style}`}>
      اطمینان {level}
    </span>
  );
}

// ───────────── نشان منشأ (استخراج‌شده در برابر تأییدشده) ─────────────
export function ProvenanceBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
      تأییدشده
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-200/90">
      استخراج‌شده — نیازمند راستی‌آزمایی
    </span>
  );
}

// ───────────── چیپ آمار ─────────────
export function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
}) {
  return (
    <div className="glass flex items-center gap-2.5 rounded-full px-4 py-2">
      <Icon className="size-4 text-emerald-300" aria-hidden />
      <span className="text-sm font-bold tabular-nums">{value === null ? "—" : faInt(value)}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ───────────── اسکلت بارگذاری ─────────────
export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-28 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      ))}
    </div>
  );
}
