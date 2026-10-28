import { ENV } from "@/lib/env";
import type { EvidenceRef } from "@/lib/types";
import { bestWindow, rankKeyword, rankVector, type CachedChunk } from "@/lib/retrieval/index-cache";

/**
 * بازیابی ترکیبی (Hybrid RAG):
 *  ۱) کلیدواژه‌ای (BM25)  ۲) برداری (کسینوس)  → ادغام با Reciprocal Rank Fusion
 *  هر مؤلفه قابل خاموش‌کردن برای ارزیابی است.
 */

export interface RetrieveOptions {
  query: string;
  topK?: number;
  useKeyword?: boolean;
  useVector?: boolean;
  documentId?: string | null;
}

export interface RetrievalResult {
  evidence: EvidenceRef[];
  retrieved: number;
  keywordMs: number;
  vectorMs: number;
  fusion: "rrf";
}

function snippet(chunk: CachedChunk, query: string): string {
  const headingPrefix = chunk.heading ? `«${chunk.heading}» — ` : "";
  return headingPrefix + bestWindow(chunk.content, query);
}

export async function retrieveHybrid(opts: RetrieveOptions): Promise<RetrievalResult> {
  const topK = opts.topK ?? ENV.retrievalTopK;
  const useKeyword = opts.useKeyword ?? true;
  const useVector = opts.useVector ?? true;
  const rrfK = ENV.rrfK;

  const t0 = performance.now();
  const keywordTask = useKeyword
    ? rankKeyword(opts.query, Math.max(topK * 3, 20), opts.documentId)
    : Promise.resolve([]);
  const t1 = performance.now();
  const vectorTask = useVector
    ? rankVector(opts.query, Math.max(topK * 3, 20), opts.documentId)
    : Promise.resolve([]);

  const [keywordHits, vectorHits] = await Promise.all([keywordTask, vectorTask]);
  const keywordMs = Math.round(performance.now() - t0);
  const vectorMs = Math.round(performance.now() - t1);

  // Reciprocal Rank Fusion
  const fused = new Map<string, { chunk: CachedChunk; score: number }>();
  const addRanking = (hits: { chunk: CachedChunk }[]) => {
    hits.forEach((hit, rank) => {
      const cur = fused.get(hit.chunk.id);
      const contribution = 1 / (rrfK + rank + 1);
      if (cur) cur.score += contribution;
      else fused.set(hit.chunk.id, { chunk: hit.chunk, score: contribution });
    });
  };
  addRanking(keywordHits);
  addRanking(vectorHits);

  const ranked = Array.from(fused.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // نرمال‌سازی امتیاز برای نمایش (بیشینه = ۱)
  const maxScore = ranked[0]?.score ?? 1;

  const evidence: EvidenceRef[] = ranked.map((r, i) => ({
    index: i + 1,
    documentId: r.chunk.documentId,
    documentTitle: r.chunk.documentTitle,
    page: r.chunk.page,
    heading: r.chunk.heading,
    snippet: snippet(r.chunk, opts.query),
    score: maxScore > 0 ? Math.round((r.score / maxScore) * 100) / 100 : 0,
  }));

  return {
    evidence,
    retrieved: ranked.length,
    keywordMs,
    vectorMs,
    fusion: "rrf",
  };
}
