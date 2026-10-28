"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Network, Plus, Search, Trash2, Waypoints } from "lucide-react";
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
import { SectionHeader, EmptyState, LoadingCards, ProvenanceBadge } from "@/components/app/shared";
import { apiFetch, jsonBody, ApiClientError } from "@/hooks/use-api";
import { useAppStore } from "@/store/app-store";
import { faNum } from "@/lib/fa";
import {
  ENTITY_TYPE_FA,
  GRAPH_ENTITY_TYPES,
  GRAPH_RELATION_TYPES,
  RELATION_TYPE_FA,
  type GraphEntityDTO,
  type GraphEntityDetailDTO,
  type TraversePathDTO,
} from "@/lib/types";

interface RNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  isCenter: boolean;
}
interface REdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  direction: "outgoing" | "incoming";
}

export function GraphTab() {
  const [entities, setEntities] = useState<GraphEntityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GraphEntityDetailDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [paths, setPaths] = useState<TraversePathDTO[] | null>(null);
  const [traversing, setTraversing] = useState(false);
  const [maxDepth, setMaxDepth] = useState("2");

  const [addEntityOpen, setAddEntityOpen] = useState(false);
  const [eType, setEType] = useState<string>("");
  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");

  const [addRelOpen, setAddRelOpen] = useState(false);
  const [rSource, setRSource] = useState<string>("");
  const [rTarget, setRTarget] = useState<string>("");
  const [rType, setRType] = useState<string>("");
  const [rEvidence, setREvidence] = useState("");

  const bumpRefresh = useAppStore((s) => s.bumpRefresh);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ entities: GraphEntityDTO[] }>("/api/graph/entities");
      setEntities(res.entities);
    } catch {
      // حالت خالی
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = useCallback(async (id: string) => {
    setPaths(null);
    setDetailLoading(true);
    try {
      const d = await apiFetch<GraphEntityDetailDTO>(`/api/graph/entities/${id}`);
      setSelected(d);
    } catch {
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    let list = entities;
    if (typeFilter !== "all") list = list.filter((e) => e.type === typeFilter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q));
    return list;
  }, [entities, typeFilter, query]);

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    entities.forEach((e) => map.set(e.type, (map.get(e.type) ?? 0) + 1));
    return map;
  }, [entities]);

  // چیدمان شعاعی ۱-پله برای بصری‌سازی
  const viz = useMemo(() => {
    if (!selected) return null;
    const nodes: RNode[] = [{ id: selected.id, name: selected.name, type: selected.type, x: 200, y: 175, isCenter: true }];
    const edges: REdge[] = [];
    const rels = selected.relations.slice(0, 14);
    rels.forEach((r, i) => {
      const angle = (2 * Math.PI * i) / Math.max(rels.length, 1) - Math.PI / 2;
      const x = 200 + 118 * Math.cos(angle);
      const y = 175 + 105 * Math.sin(angle);
      nodes.push({ id: r.otherEntity.id, name: r.otherEntity.name, type: r.otherEntity.type, x, y, isCenter: false });
      edges.push({
        id: r.id,
        x1: 200,
        y1: 175,
        x2: x,
        y2: y,
        direction: r.direction,
      });
    });
    return { nodes, edges };
  }, [selected]);

  const createEntity = async () => {
    if (eType === "" || eName.trim() === "") {
      toast.error("نوع و نام موجودیت الزامی است");
      return;
    }
    try {
      const res = await apiFetch<{ entity: GraphEntityDTO }>("/api/graph/entities", {
        method: "POST",
        ...jsonBody({ type: eType, name: eName.trim(), description: eDesc.trim() || null }),
      });
      toast.success("موجودیت ثبت شد", { description: `${res.entity.name} — رکورد دستی، تأییدشده` });
      setAddEntityOpen(false);
      setEName("");
      setEDesc("");
      await load();
      await openDetail(res.entity.id);
      bumpRefresh();
    } catch (e) {
      toast.error("ثبت موجودیت ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    }
  };

  const createRelationship = async () => {
    if (rSource === "" || rTarget === "" || rType === "") {
      toast.error("مبدأ، مقصد و نوع رابطه الزامی است");
      return;
    }
    if (rSource === rTarget) {
      toast.error("مبدأ و مقصد نمی‌توانند یکی باشند");
      return;
    }
    try {
      await apiFetch("/api/graph/relationships", {
        method: "POST",
        ...jsonBody({ sourceEntityId: rSource, targetEntityId: rTarget, type: rType, evidence: rEvidence.trim() || null }),
      });
      toast.success("رابطه ثبت شد");
      setAddRelOpen(false);
      setREvidence("");
      await load();
      if (selected) await openDetail(selected.id);
      bumpRefresh();
    } catch (e) {
      toast.error("ثبت رابطه ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    }
  };

  const traverse = async () => {
    if (!selected) return;
    setTraversing(true);
    try {
      const res = await apiFetch<{ paths: TraversePathDTO[] }>("/api/graph/traverse", {
        method: "POST",
        ...jsonBody({ entityId: selected.id, maxDepth: parseInt(maxDepth, 10) }),
      });
      setPaths(res.paths);
      if (res.paths.length === 0) toast.info("مسیری با این عمق یافت نشد");
    } catch (e) {
      toast.error("پیمایش ناموفق", {
        description: e instanceof ApiClientError ? e.message : "خطای نامشخص",
      });
    } finally {
      setTraversing(false);
    }
  };

  const deleteEntity = async (entity: GraphEntityDTO) => {
    try {
      await apiFetch(`/api/graph/entities/${entity.id}`, { method: "DELETE" });
      toast.success("موجودیت و روابطش حذف شد");
      setSelected(null);
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
        title="گراف دانش"
        description="موجودیت‌ها (ماده، فرمولاسیون، خاصیت، تأمین‌کننده و…) و روابط تایپ‌دار با منشأ مشخص. رکوردهای استخراج‌شده از اسناد، «ادعا» هستند نه واقعیت تأییدشده."
        icon={Network}
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => setAddRelOpen(true)}
              variant="outline"
              disabled={entities.length < 2}
              className="gap-2 rounded-xl"
            >
              <ArrowLeftRight className="size-4" aria-hidden />
              رابطهٔ جدید
            </Button>
            <Button
              onClick={() => setAddEntityOpen(true)}
              className="gap-2 rounded-xl bg-emerald-500 font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
            >
              <Plus className="size-4" aria-hidden />
              موجودیت جدید
            </Button>
          </div>
        }
      />

      {loading ? (
        <LoadingCards count={3} />
      ) : entities.length === 0 ? (
        <EmptyState
          icon={Waypoints}
          title="گراف خالی است"
          hint="از تب «اسناد» روی هر سند «استخراج گراف» را بزنید، یا موجودیت‌ها و روابط را دستی بسازید."
          action={
            <Button onClick={() => setAddEntityOpen(true)} variant="outline" className="gap-2 rounded-xl">
              <Plus className="size-4" aria-hidden />
              ساختن اولین موجودیت
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[330px_1fr]">
          {/* ستون فهرست */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی موجودیت…"
                aria-label="جستجوی موجودیت"
                className="border-white/10 bg-white/[0.04] pr-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  typeFilter === "all"
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                }`}
              >
                همه ({faNum(entities.length)})
              </button>
              {GRAPH_ENTITY_TYPES.filter((t) => typeCounts.get(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    typeFilter === t
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ENTITY_TYPE_FA[t]} ({faNum(typeCounts.get(t) ?? 0)})
                </button>
              ))}
            </div>
            <div className="nice-scroll max-h-[54vh] space-y-2 overflow-y-auto pe-1">
              <AnimatePresence initial={false}>
                {filtered.map((e) => (
                  <motion.button
                    key={e.id}
                    type="button"
                    layout
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => openDetail(e.id)}
                    className={`w-full rounded-xl border p-3 text-start transition-colors ${
                      selected?.id === e.id
                        ? "border-emerald-400/50 bg-emerald-500/[0.08]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {ENTITY_TYPE_FA[e.type] ?? e.type}
                      </span>
                      <span className="truncate text-sm font-bold">{e.name}</span>
                    </div>
                    {e.description ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{e.description}</p>
                    ) : null}
                  </motion.button>
                ))}
              </AnimatePresence>
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">موردی مطابق فیلتر نیست</p>
              ) : null}
            </div>
          </div>

          {/* ستون جزئیات */}
          <div className="min-h-[420px] rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 md:p-5">
            {detailLoading ? (
              <div className="space-y-3">
                <div className="skeleton-shimmer h-8 w-56 rounded-lg bg-white/5" />
                <div className="skeleton-shimmer h-64 rounded-xl bg-white/5" />
              </div>
            ) : !selected ? (
              <div className="flex h-full min-h-[380px] flex-col items-center justify-center gap-3 text-center">
                <Network className="size-10 text-emerald-300/50" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  یک موجودیت را از فهرست انتخاب کنید تا روابط، منشأ و مسیرهای چند-پله‌ای آن را ببینید.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{selected.name}</h3>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {ENTITY_TYPE_FA[selected.type] ?? selected.type}
                  </span>
                  <ProvenanceBadge verified={selected.verified} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ms-auto size-8 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-200"
                    onClick={() => deleteEntity(selected)}
                    aria-label="حذف موجودیت"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
                {selected.description ? (
                  <p className="text-sm leading-6 text-muted-foreground">{selected.description}</p>
                ) : null}
                {selected.sourceDocumentTitle ? (
                  <p className="text-[11px] text-muted-foreground">
                    منشأ استخراج: سند «{selected.sourceDocumentTitle}»
                  </p>
                ) : null}

                {/* بصری‌سازی شعاعی ۱-پله */}
                {viz && viz.edges.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[oklch(0.14_0.012_170)]">
                    <svg viewBox="0 0 400 350" className="mx-auto block h-72 w-full max-w-md" role="img" aria-label="نمای شبکه‌ای روابط">
                      {viz.edges.map((edge, i) => (
                        <motion.line
                          key={edge.id}
                          x1={edge.x1}
                          y1={edge.y1}
                          x2={edge.x2}
                          y2={edge.y2}
                          stroke={edge.direction === "outgoing" ? "rgba(52,211,153,0.5)" : "rgba(251,191,36,0.45)"}
                          strokeWidth={1.4}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.7, delay: i * 0.06 }}
                        />
                      ))}
                      {viz.nodes.map((n, i) => (
                        <motion.g
                          key={n.id}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                          style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                        >
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r={n.isCenter ? 26 : 18}
                            fill={n.isCenter ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.06)"}
                            stroke={n.isCenter ? "rgba(52,211,153,0.8)" : "rgba(255,255,255,0.2)"}
                            strokeWidth={1.5}
                          />
                          <text
                            x={n.x}
                            y={n.y + 4}
                            textAnchor="middle"
                            fill={n.isCenter ? "#a7f3d0" : "rgba(255,255,255,0.75)"}
                            fontSize={n.isCenter ? 11 : 9}
                            fontWeight={n.isCenter ? 700 : 400}
                          >
                            {n.name.length > 14 ? `${n.name.slice(0, 13)}…` : n.name}
                          </text>
                        </motion.g>
                      ))}
                    </svg>
                    <p className="border-t border-white/[0.05] px-3 py-2 text-center text-[10px] text-muted-foreground">
                      خط سبز: رابطهٔ خروجی • خط کهربایی: رابطهٔ ورودی — {faNum(selected.relations.length)} رابطهٔ مستقیم
                    </p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-muted-foreground">
                    این موجودیت هنوز رابطه‌ای ندارد
                  </p>
                )}

                {/* پیمایش چند-پله‌ای */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <Label className="text-xs">عمق پیمایش:</Label>
                  <Select value={maxDepth} onValueChange={setMaxDepth}>
                    <SelectTrigger className="h-8 w-20 border-white/10 bg-white/[0.04] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">۱ پله</SelectItem>
                      <SelectItem value="2">۲ پله</SelectItem>
                      <SelectItem value="3">۳ پله</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={traverse}
                    disabled={traversing}
                    className="h-8 gap-1.5 rounded-lg bg-emerald-500 text-xs font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
                  >
                    <Waypoints className={`size-3.5 ${traversing ? "animate-pulse" : ""}`} aria-hidden />
                    {traversing ? "در حال پیمایش…" : "پیمایش مسیرها"}
                  </Button>
                </div>

                {paths ? (
                  paths.length === 0 ? (
                    <p className="text-xs text-muted-foreground">مسیری یافت نشد.</p>
                  ) : (
                    <div className="nice-scroll max-h-56 space-y-2 overflow-y-auto pe-1">
                      {paths.map((p, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {p.entities.map((n, j) => (
                              <span key={j} className="flex items-center gap-1.5">
                                {j > 0 ? <span className="text-emerald-400/60">←</span> : null}
                                <span className="rounded-md bg-white/5 px-1.5 py-0.5">
                                  {n.name}
                                  <span className="ms-1 text-[9px] text-muted-foreground">
                                    {ENTITY_TYPE_FA[n.type] ?? n.type}
                                  </span>
                                </span>
                              </span>
                            ))}
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {p.relations.map((r) => RELATION_TYPE_FA[r.type] ?? r.type).join(" ← ")}
                            {!p.relations.every((r) => r.verified) ? " — شامل ادعای استخراج‌شده" : ""}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : null}

                {/* روابط مستقیم */}
                <div>
                  <p className="mb-2 text-sm font-bold">روابط مستقیم</p>
                  <div className="nice-scroll max-h-52 space-y-1.5 overflow-y-auto pe-1">
                    {selected.relations.length === 0 ? (
                      <p className="text-xs text-muted-foreground">رابطه‌ای ثبت نشده است.</p>
                    ) : null}
                    {selected.relations.map((r) => (
                      <div key={r.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-300">
                            {RELATION_TYPE_FA[r.type] ?? r.type}
                          </span>
                          <span className="text-muted-foreground">{r.direction === "outgoing" ? "به سمت" : "از سمت"}</span>
                          <span className="font-semibold">{r.otherEntity.name}</span>
                          <ProvenanceBadge verified={r.verified} />
                        </div>
                        {r.evidence ? (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">شاهد: {r.evidence}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* دیالوگ موجودیت جدید */}
      <Dialog open={addEntityOpen} onOpenChange={setAddEntityOpen}>
        <DialogContent dir="rtl" className="max-w-md border-white/10 bg-[oklch(0.21_0.014_170)]">
          <DialogHeader className="text-right">
            <DialogTitle>موجودیت جدید</DialogTitle>
            <DialogDescription>رکوردهای دستی به‌عنوان «تأییدشده» ثبت می‌شوند؛ رکوردهای استخراج از سند، نیازمند راستی‌آزمایی‌اند.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>نوع موجودیت *</Label>
              <Select value={eType} onValueChange={setEType}>
                <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
                  <SelectValue placeholder="انتخاب نوع" />
                </SelectTrigger>
                <SelectContent>
                  {GRAPH_ENTITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ENTITY_TYPE_FA[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ge-name">نام *</Label>
              <Input
                id="ge-name"
                value={eName}
                onChange={(e) => setEName(e.target.value)}
                placeholder="مثال: سورفکتانت آمفوتریک"
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ge-desc">توضیح</Label>
              <Textarea
                id="ge-desc"
                value={eDesc}
                onChange={(e) => setEDesc(e.target.value)}
                rows={2}
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-start gap-2">
            <Button
              onClick={createEntity}
              className="rounded-xl bg-emerald-500 font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
            >
              ثبت
            </Button>
            <Button variant="outline" onClick={() => setAddEntityOpen(false)} className="rounded-xl">
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ رابطهٔ جدید */}
      <Dialog open={addRelOpen} onOpenChange={setAddRelOpen}>
        <DialogContent dir="rtl" className="max-w-md border-white/10 bg-[oklch(0.21_0.014_170)]">
          <DialogHeader className="text-right">
            <DialogTitle>رابطهٔ جدید</DialogTitle>
            <DialogDescription>اگر شاهد متنی دارید (مثلاً نقل از سند)، آن را ثبت کنید تا منشأ رابطه قابل پیگیری باشد.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>مبدأ *</Label>
              <Select value={rSource} onValueChange={setRSource}>
                <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
                  <SelectValue placeholder="انتخاب موجودیت مبدأ" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({ENTITY_TYPE_FA[e.type] ?? e.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>نوع رابطه *</Label>
              <Select value={rType} onValueChange={setRType}>
                <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
                  <SelectValue placeholder="انتخاب نوع" />
                </SelectTrigger>
                <SelectContent>
                  {GRAPH_RELATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {RELATION_TYPE_FA[t]} ({t})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>مقصد *</Label>
              <Select value={rTarget} onValueChange={setRTarget}>
                <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
                  <SelectValue placeholder="انتخاب موجودیت مقصد" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({ENTITY_TYPE_FA[e.type] ?? e.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gr-evidence">شاهد (اختیاری)</Label>
              <Textarea
                id="gr-evidence"
                value={rEvidence}
                onChange={(e) => setREvidence(e.target.value)}
                rows={2}
                placeholder="مثلاً: صفحهٔ ۳ سند فرمولاسیون شامپو"
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-start gap-2">
            <Button
              onClick={createRelationship}
              className="rounded-xl bg-emerald-500 font-bold text-[oklch(0.17_0.03_170)] hover:bg-emerald-400"
            >
              ثبت رابطه
            </Button>
            <Button variant="outline" onClick={() => setAddRelOpen(false)} className="rounded-xl">
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
