import { db } from "@/lib/db";
import { isDbAvailable } from "@/lib/demo/mode";
import { demoChunkRows } from "@/lib/demo/demo-data";
import { cosineSimilarity, embeddingProvider } from "@/lib/retrieval/embeddings";
import { tokenize } from "@/lib/retrieval/tokenize";

/**
 * ایندکس درون‌حافظه‌ای قطعات (کش محلی).
 * مقیاس MVP: تا چند هزار قطعه؛ در استقرار بزرگ‌تر باید به pgvector/FTS منتقل شود.
 */

export interface CachedChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  page: number | null;
  heading: string | null;
  content: string;
  tokens: string[];
  tf: Map<string, number>;
  vector: number[];
  /** طول سند بر حسب توکن (برای BM25) */
  length: number;
}

interface RetrievalIndex {
  chunks: CachedChunk[];
  /** document frequency هر توکن */
  df: Map<string, number>;
  avgdl: number;
  n: number;
  builtAt: number;
}

let cached: RetrievalIndex | null = null;
let cacheVersion = 0;
let source: "db" | "demo" = "db";

/** منبع فعلی ایندکس: دیتابیس واقعی یا دادهٔ نمایشی */
export function getIndexSource(): "db" | "demo" {
  return source;
}

/** با تغییر اسناد (افزودن/حذف/بازنمایه‌سازی) صدا زده می‌شود */
export function invalidateRetrievalIndex(): void {
  cacheVersion++;
}

export async function getRetrievalIndex(): Promise<RetrievalIndex> {
  if (cached) return cached;

  let rows: {
    id: string;
    documentId: string;
    page: number | null;
    heading: string | null;
    content: string;
    seq: number;
    document: { title: string };
  }[] = [];

  if (await isDbAvailable()) {
    try {
      rows = await db.chunk.findMany({
        where: { document: { status: "ready" } },
        include: { document: { select: { title: true } } },
        orderBy: [{ documentId: "asc" }, { seq: "asc" }],
      });
    } catch (err) {
      console.error("[retrieval] db index load failed, falling back to demo:", err);
      rows = [];
    }
  }

  if (rows.length === 0 && !(await isDbAvailable())) {
    source = "demo";
    rows = demoChunkRows();
  } else {
    source = "db";
  }

  const chunks: CachedChunk[] = [];
  const df = new Map<string, number>();

  for (const row of rows) {
    const tokens = tokenize(`${row.heading ?? ""} ${row.content}`);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);

    let vector: number[] = [];
    try {
      const parsed = JSON.parse(row.embedding) as unknown;
      if (Array.isArray(parsed)) vector = parsed.map(Number);
    } catch {
      vector = [];
    }

    chunks.push({
      id: row.id,
      documentId: row.documentId,
      documentTitle: row.document.title,
      page: row.page,
      heading: row.heading,
      content: row.content,
      tokens,
      tf,
      vector,
      length: tokens.length,
    });
  }

  const n = chunks.length;
  const avgdl = n > 0 ? chunks.reduce((a, c) => a + c.length, 0) / n : 0;
  cached = { chunks, df, avgdl, n, builtAt: Date.now() };
  return cached;
}

/** امتیاز BM25 برای یک توکن */
function bm25(
  tf: number,
  dfValue: number,
  n: number,
  docLength: number,
  avgdl: number,
  k1 = 1.5,
  b = 0.75,
): number {
  const idf = Math.log(1 + (n - dfValue + 0.5) / (dfValue + 0.5));
  return idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgdl || 1))));
}

export interface KeywordHit {
  chunk: CachedChunk;
  score: number;
}

/** رتبه‌بندی کلیدواژه‌ای BM25 روی ایندکس حافظه */
export async function rankKeyword(
  query: string,
  topN: number,
  documentId?: string | null,
): Promise<KeywordHit[]> {
  const index = await getRetrievalIndex();
  const qTokens = tokenize(query);
  if (qTokens.length === 0 || index.n === 0) return [];

  const pool = documentId ? index.chunks.filter((c) => c.documentId === documentId) : index.chunks;
  const scored = pool
    .map((chunk) => {
      let score = 0;
      const seen = new Set<string>();
      for (const t of qTokens) {
        if (seen.has(t)) continue;
        seen.add(t);
        const tf = chunk.tf.get(t);
        if (!tf) continue;
        score += bm25(tf, index.df.get(t) ?? 0, index.n, chunk.length, index.avgdl);
      }
      return { chunk, score };
    })
    .filter((h) => h.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

export interface VectorHit {
  chunk: CachedChunk;
  score: number;
}

/** رتبه‌بندی برداری (کسینوس) روی ایندکس حافظه */
export async function rankVector(
  query: string,
  topN: number,
  documentId?: string | null,
): Promise<VectorHit[]> {
  const index = await getRetrievalIndex();
  if (index.n === 0) return [];
  const [qVec] = embeddingProvider.embed([query]);
  const pool = documentId ? index.chunks.filter((c) => c.documentId === documentId) : index.chunks;

  const scored = pool
    .filter((c) => c.vector.length === qVec.length)
    .map((chunk) => ({ chunk, score: cosineSimilarity(qVec, chunk.vector) }))
    .filter((h) => h.score > 0.01);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

/** بازیابی پنجرهٔ برتر از متن قطعه برای نمایش در شواهد */
export function bestWindow(content: string, query: string, radius = 190): string {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return content.slice(0, radius * 2);
  const lower = content.toLowerCase();
  let bestPos = 0;
  let bestHits = -1;
  for (let i = 0; i < Math.max(content.length - radius, 1); i += 40) {
    const window = lower.slice(i, i + radius * 2);
    let hits = 0;
    for (const t of qTokens) if (window.includes(t)) hits++;
    if (hits > bestHits) {
      bestHits = hits;
      bestPos = i;
    }
    if (bestHits >= qTokens.length) break;
  }
  const slice = content.slice(bestPos, bestPos + radius * 2).trim();
  return (bestPos > 0 ? "… " : "") + slice + (bestPos + radius * 2 < content.length ? " …" : "");
}
