"use client";

import { FileText, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { EvidenceRef } from "@/lib/types";
import { faNum, faPct } from "@/lib/fa";

/** فهرست شواهد — چیپ‌های [n] داخل پاسخ به همین فهرست اشاره می‌کنند */
export function EvidenceList({
  evidence,
  highlightIndex,
}: {
  evidence: EvidenceRef[];
  highlightIndex?: number | null;
}) {
  return (
    <ol className="space-y-2.5">
      <AnimatePresence initial={false}>
        {evidence.map((ev) => (
          <motion.li
            key={ev.index}
            id={`evidence-${ev.index}`}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: ev.index * 0.05 }}
            className={`rounded-xl border p-3 transition-colors ${
              highlightIndex === ev.index
                ? "border-emerald-400/60 bg-emerald-500/[0.08]"
                : "border-white/[0.07] bg-white/[0.02]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/20 font-bold text-emerald-300">
                {faNum(ev.index)}
              </span>
              <FileText className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="font-semibold text-foreground/90">{ev.documentTitle}</span>
              {ev.page !== null ? (
                <span className="inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  <MapPin className="size-3" aria-hidden />
                  صفحهٔ {faNum(ev.page)}
                </span>
              ) : null}
              {ev.heading ? (
                <span className="text-[11px] text-muted-foreground">بخش: {ev.heading}</span>
              ) : null}
              <span className="ms-auto rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                امتیاز {faPct(Math.min(ev.score * 100, 100))}
              </span>
            </div>
            <p className="mt-2 line-clamp-4 text-[13px] leading-6 text-muted-foreground">{ev.snippet}</p>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
