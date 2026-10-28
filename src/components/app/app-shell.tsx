"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  FileStack,
  FlaskConical,
  MessageSquareText,
  Network,
  Settings2,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useAppStore, type TabId } from "@/store/app-store";
import { useHealth } from "@/hooks/use-api";
import { BackgroundAurora } from "@/components/app/background-aurora";
import { StatChip } from "@/components/app/shared";
import { ChatTab } from "@/components/app/chat-tab";
import { DocumentsTab } from "@/components/app/documents-tab";
import { FormulationsTab } from "@/components/app/formulations-tab";
import { IngredientsTab } from "@/components/app/ingredients-tab";
import { GraphTab } from "@/components/app/graph-tab";
import { TroubleshootingTab } from "@/components/app/troubleshooting-tab";
import { SettingsTab } from "@/components/app/settings-tab";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "chat", label: "گفت‌وگو", icon: MessageSquareText },
  { id: "documents", label: "اسناد", icon: FileStack },
  { id: "formulations", label: "فرمولاسیون‌ها", icon: FlaskConical },
  { id: "ingredients", label: "مواد اولیه", icon: Boxes },
  { id: "graph", label: "گراف دانش", icon: Network },
  { id: "troubleshooting", label: "عیب‌یابی", icon: Wrench },
  { id: "settings", label: "تنظیمات", icon: Settings2 },
];

function HealthPill() {
  const { health, offline } = useHealth(20000);
  const setHealth = useAppStore((s) => s.setHealth);

  useEffect(() => {
    if (health) setHealth(health);
  }, [health, setHealth]);

  const state = offline
    ? { dot: "bg-rose-400", label: "قطع ارتباط", ring: "border-rose-400/30 bg-rose-500/10 text-rose-300" }
    : health?.status === "ok" || health?.mode === "demo"
      ? { dot: "bg-emerald-400", label: "سامانه فعال", ring: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" }
      : health
        ? { dot: "bg-amber-400", label: "محدود", ring: "border-amber-400/30 bg-amber-400/10 text-amber-300" }
        : { dot: "bg-white/40", label: "در حال اتصال", ring: "border-white/10 bg-white/5 text-muted-foreground" };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${state.ring}`}
      role="status"
    >
      <span className={`pulse-dot size-1.5 rounded-full ${state.dot}`} />
      {state.label}
    </span>
  );
}

function LogoMark() {
  return (
    <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-[oklch(0.17_0.03_170)] shadow-[0_8px_24px_-8px_rgba(52,211,153,0.55)]">
      <FlaskConical className="size-5" strokeWidth={2.4} aria-hidden />
    </span>
  );
}

export function AppShell() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const settings = useAppStore((s) => s.settings);
  const settingsLoading = useAppStore((s) => s.settingsLoading);
  const loadSettings = useAppStore((s) => s.loadSettings);
  const refreshTick = useAppStore((s) => s.refreshTick);

  useEffect(() => {
    loadSettings();
  }, [loadSettings, refreshTick]);

  return (
    <div className="flex min-h-screen flex-col">
      <BackgroundAurora />

      {/* سربرگ */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[oklch(0.155_0.012_170)]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 md:px-6">
          <LogoMark />
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight">شیمی‌یار</p>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              دستیار پژوهش و فرمولاسیون شوینده و آرایشی-بهداشتی
            </p>
          </div>
          <div className="ms-auto">
            <HealthPill />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* هیروی سینمایی فشرده */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6 md:px-6 md:pt-14">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl text-3xl leading-[1.25] font-black tracking-tight md:text-5xl md:leading-[1.2]"
          >
            پژوهش، فرمولاسیون و عیب‌یابی با <span className="text-gradient">هوش مصنوعیِ مستند‌محور</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground md:text-base"
          >
            هر پاسخ به سند و صفحهٔ منبع گره خورده است؛ فرضیه‌ها از شواهد جدا می‌شوند و سیستم هرگز
            نتایج آزمایشگاهی را از خودش نمی‌سازد.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-wrap gap-2.5"
          >
            <StatChip icon={FileStack} label="سند نمایه‌شده" value={settings?.counts.documents ?? null} />
            <StatChip icon={MessageSquareText} label="قطعهٔ دانش" value={settings?.counts.chunks ?? null} />
            <StatChip icon={FlaskConical} label="فرمولاسیون" value={settings?.counts.formulations ?? null} />
            <StatChip icon={Network} label="رأس گراف" value={settings?.counts.graphEntities ?? null} />
          </motion.div>
        </section>

        {/* نوار تب‌ها */}
        <nav
          aria-label="بخش‌های برنامه"
          className="sticky top-16 z-30 border-y border-white/[0.05] bg-[oklch(0.155_0.012_170)]/70 backdrop-blur-xl"
        >
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <div className="tab-scroll flex items-center gap-1 overflow-x-auto py-2.5">
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                      active ? "text-emerald-200" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-full border border-emerald-400/30 bg-emerald-500/[0.12]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <t.icon className="relative z-10 size-4" aria-hidden />
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* محتوای تب فعال */}
        <div className="mx-auto w-full max-w-6xl px-4 py-8 pb-16 md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "chat" ? <ChatTab /> : null}
              {activeTab === "documents" ? <DocumentsTab /> : null}
              {activeTab === "formulations" ? <FormulationsTab /> : null}
              {activeTab === "ingredients" ? <IngredientsTab /> : null}
              {activeTab === "graph" ? <GraphTab /> : null}
              {activeTab === "troubleshooting" ? <TroubleshootingTab /> : null}
              {activeTab === "settings" ? <SettingsTab /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* پانویس چسبان به پایین */}
      <footer className="mt-auto border-t border-white/[0.06] bg-white/[0.015]">
        <div
          className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 md:px-6"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-sm font-bold">شیمی‌یار</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              MVP نسخهٔ ۰٫۱
            </span>
          </div>
          <p className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-400/80" aria-hidden />
            نمونهٔ اولیهٔ پژوهشی؛ جایگزین شیمی‌دان، آزمایش، بازبینی ایمنی و مقررات نیست.
          </p>
          <p className="ms-auto text-[11px] text-muted-foreground">
            بازیابی ترکیبی + گراف دانش + استناد صفحه‌به‌صفحه
          </p>
        </div>
      </footer>
    </div>
  );
}
