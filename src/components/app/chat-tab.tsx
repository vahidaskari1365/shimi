"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleAlert,
  Network,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MarkdownLite } from "@/components/app/markdown-lite";
import { EvidenceList } from "@/components/app/evidence-card";
import { apiFetch, jsonBody, ApiClientError } from "@/hooks/use-api";
import { faNum } from "@/lib/fa";
import type {
  ChatRequestDTO,
  ChatResponseDTO,
  ChatMeta,
  EvidenceRef,
  GraphFactDTO,
} from "@/lib/types";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: EvidenceRef[];
  graphFacts?: GraphFactDTO[];
  followUps?: string[];
  meta?: ChatMeta;
  error?: string;
}

const SUGGESTED_QUESTIONS = [
  "HLB چیست و در انتخاب سورفکتانت شامپو چه نقشی دارد؟",
  "چرا ویسکوزیتهٔ شامپو پس از تولید افت می‌کند؟",
  "داده‌های فرمولاسیون شامپوی پایه را نشان بده",
  "برای شفاف ماندن مایع ظرفشویی چه نکاتی مهم است؟",
];

let msgSeq = 0;
const nextId = () => `m${++msgSeq}-${Date.now()}`;

function TypingBubble() {
  return (
    <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3">
      <span className="flex gap-1">
        <span className="typing-dot size-1.5 rounded-full bg-emerald-400" />
        <span className="typing-dot size-1.5 rounded-full bg-emerald-400" />
        <span className="typing-dot size-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="text-xs text-muted-foreground">در حال جستجوی مدارک و ترکیب پاسخ مستند…</span>
    </div>
  );
}

export function ChatTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [useKeyword, setUseKeyword] = useState(true);
  const [useVector, setUseVector] = useState(true);
  const [useGraph, setUseGraph] = useState(true);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    const userMsg: ChatMsg = { id: nextId(), role: "user", content: q };
    const pendingId = nextId();
    setMessages((m) => [...m, userMsg, { id: pendingId, role: "assistant", content: "" }]);

    try {
      const res = await apiFetch<ChatResponseDTO>(
        "/api/chat",
        jsonBody({
          question: q,
          useKeyword,
          useVector,
          useGraph,
          history: history.slice(-6),
        } satisfies ChatRequestDTO),
      );
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? {
                ...msg,
                content: res.answer,
                evidence: res.evidence,
                graphFacts: res.graphFacts,
                followUps: res.followUps,
                meta: res.meta,
              }
            : msg,
        ),
      );
      setHistory((h) => [...h.slice(-6), { role: "user", content: q }, { role: "assistant", content: res.answer }]);
    } catch (e) {
      const message = e instanceof ApiClientError ? e.message : "خطای غیرمنتظره در گفت‌وگو رخ داد.";
      setMessages((m) => m.map((msg) => (msg.id === pendingId ? { ...msg, content: "", error: message } : msg)));
    } finally {
      setBusy(false);
    }
  };

  const onCitationClick = (index: number) => {
    setHighlight(index);
    document.getElementById(`evidence-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlight((h) => (h === index ? null : h)), 2400);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {/* سوییچ‌های بازیابی */}
      <div className="glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Search className="size-3.5 text-emerald-300" aria-hidden /> اجزای بازیابی:
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Switch checked={useKeyword} onCheckedChange={setUseKeyword} aria-label="بازیابی کلیدواژه‌ای" />
          کلیدواژه‌ای (BM25)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Switch checked={useVector} onCheckedChange={setUseVector} aria-label="بازیابی برداری" />
          برداری (معنایی)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Switch checked={useGraph} onCheckedChange={setUseGraph} aria-label="بازیابی گراف دانش" />
          گراف دانش
        </label>
        <span className="ms-auto hidden text-[11px] text-muted-foreground sm:block">ادغام: RRF</span>
      </div>

      {/* پنل گفت‌وگو */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div ref={scrollRef} className="nice-scroll max-h-[52vh] min-h-[320px] space-y-4 overflow-y-auto p-4 md:max-h-[58vh]">
          {!hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex size-14 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
              >
                <Sparkles className="size-6" aria-hidden />
              </motion.span>
              <div>
                <p className="font-bold">بپرس؛ پاسخ از دل اسناد شما می‌آید</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  پرسش را فارسی یا انگلیسی بنویس — پاسخ با شمارهٔ منبع و صفحه می‌آید.
                </p>
              </div>
              <div className="flex max-w-lg flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <motion.button
                    key={q}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                    onClick={() => send(q)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : null}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={msg.role === "user" ? "flex justify-start" : "flex justify-end"}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-emerald-500/[0.14] px-4 py-2.5 text-[15px] leading-7 text-emerald-50/95">
                    {msg.content}
                  </div>
                ) : msg.error ? (
                  <div className="flex max-w-[90%] items-start gap-2 rounded-2xl rounded-tl-md border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {msg.error}
                    <button
                      type="button"
                      onClick={() => {
                        setMessages((m) => m.filter((x) => x.id !== msg.id));
                      }}
                      className="ms-auto rounded-md p-1 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-200"
                      aria-label="حذف پیام خطا"
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                    </button>
                  </div>
                ) : msg.content === "" ? (
                  <TypingBubble />
                ) : (
                  <div className="w-full max-w-full rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] p-4">
                    <MarkdownLite content={msg.content} onCitationClick={onCitationClick} />

                    {/* داده‌های گراف دانش — جدای از پاسخ مستند */}
                    {msg.graphFacts && msg.graphFacts.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
                          <Waypoints className="size-3.5" aria-hidden />
                          داده‌های گراف دانش — نیازمند راستی‌آزمایی
                        </p>
                        <ul className="mt-2 space-y-1 text-xs leading-6 text-amber-100/80">
                          {msg.graphFacts.map((g, i) => (
                            <li key={i}>
                              • {g.text}
                              <span className="text-amber-200/50"> — منشأ: {g.source}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* شواهد */}
                    {msg.evidence && msg.evidence.length > 0 ? (
                      <details className="group mt-3">
                        <summary className="flex w-full cursor-pointer list-none items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-emerald-400/30 hover:text-emerald-200">
                          <span className="flex size-4.5 items-center justify-center rounded bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                            {faNum(msg.evidence.length)}
                          </span>
                          منابع پشتیبان (سند و صفحه)
                          <span className="ms-auto transition-transform group-open:rotate-180">⌄</span>
                        </summary>
                        <div className="mt-2">
                          <EvidenceList evidence={msg.evidence} highlightIndex={highlight} />
                        </div>
                      </details>
                    ) : (
                      <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs leading-6 text-amber-200/90">
                        هیچ مدرکی برای این پرسش بازیابی نشد؛ پاسخ مستند ممکن نیست.
                      </p>
                    )}

                    {/* پرسش‌های بعدی */}
                    {msg.followUps && msg.followUps.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.followUps.map((f, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => send(f)}
                            className="rounded-full border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-1 text-[11px] text-emerald-200/90 transition-all hover:scale-[1.03] hover:bg-emerald-500/15"
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {msg.meta ? (
                      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/[0.05] pt-2 text-[10px] text-muted-foreground">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-semibold ${
                            msg.meta.aiMode === "llm"
                              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                          }`}
                        >
                          {msg.meta.aiMode === "llm" ? "پاسخ مدل زبانی" : "پاسخ استخراجی از مدارک"}
                        </span>
                      </p>
                    ) : null}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ورودی */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 border-t border-white/[0.06] bg-white/[0.015] p-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="پرسش فنی خود را بنویسید… (Enter برای ارسال)"
            aria-label="متن پرسش"
            className="nice-scroll max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-emerald-400/50"
          />
          <Button
            type="submit"
            disabled={busy || input.trim() === ""}
            className="h-11 gap-2 rounded-xl bg-emerald-500 px-4 font-bold text-[oklch(0.17_0.03_170)] shadow-[0_8px_24px_-10px_rgba(52,211,153,0.6)] transition-all hover:bg-emerald-400 disabled:opacity-40"
          >
            <Send className="size-4 -scale-x-100" aria-hidden />
            ارسال
          </Button>
        </form>
      </div>

      <p className="text-center text-[11px] leading-5 text-muted-foreground">
        پاسخ‌ها فقط بر اساس اسناد نمایه‌شده ساخته می‌شوند؛ اگر مدرک کافی نباشد، سیستم صریحاً اعلام می‌کند.
      </p>
    </div>
  );
}
