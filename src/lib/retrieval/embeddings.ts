import { ENV } from "@/lib/env";
import { tokenize } from "@/lib/retrieval/tokenize";

/**
 * ارائه‌دهندهٔ بردار نهفته.
 * معماری قابلیت تعویض دارد: در استقرار تولیدی می‌توان پیاده‌سازی Ollama
 * (مثلاً nomic-embed-text) یا هر سرویس دیگر را با همین اینترفیس اضافه کرد.
 * این نسخهٔ آفلاین (hashing + TF-IDF با n-gram نویسه‌ای) برای فارسی هم کار می‌کند
 * و هیچ سرویس خارجی یا داده‌ای را به بیرون نمی‌فرستد (محرمانگی اسناد).
 */
export interface EmbeddingProvider {
  readonly name: string;
  readonly dim: number;
  embed(texts: string[]): number[][];
}

/** FNV-1a 32-bit */
function fnv1a(str: string, seed = 0x811c9dc5): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function sublinearTf(tf: number): number {
  return 1 + Math.log(tf);
}

function vectorize(text: string, dim: number): number[] {
  const vec = new Float64Array(dim);
  const tokens = tokenize(text);

  // وزن واژه‌ها
  const wordTf = new Map<string, number>();
  for (const t of tokens) wordTf.set(t, (wordTf.get(t) ?? 0) + 1);
  for (const [t, tf] of wordTf) {
    const h = fnv1a(t);
    const idx = h % dim;
    const sign = (h & 1) === 1 ? 1 : -1;
    vec[idx] += sign * sublinearTf(tf);
  }

  // وزن n-gram نویسه‌ای (۳تایی) — برای تطبیق صرفی فارسی
  const gramTf = new Map<string, number>();
  for (const t of tokens) {
    const padded = `^${t}$`;
    for (let i = 0; i + 3 <= padded.length; i++) {
      const g = padded.slice(i, i + 3);
      gramTf.set(g, (gramTf.get(g) ?? 0) + 1);
    }
  }
  for (const [g, tf] of gramTf) {
    const h = fnv1a(g, 0x9747b28c);
    const idx = h % dim;
    const sign = (h & 1) === 1 ? 1 : -1;
    vec[idx] += sign * 0.35 * sublinearTf(tf);
  }

  // نرمال‌سازی L2
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  return Array.from(vec, (v) => v / norm);
}

export class HashingTfIdfEmbedding implements EmbeddingProvider {
  readonly name = "hashing-tfidf-۳گرام (آفلاین، فارسی‌پسند)";
  readonly dim: number;

  constructor(dim = ENV.embeddingDim) {
    this.dim = dim;
  }

  embed(texts: string[]): number[][] {
    return texts.map((t) => vectorize(t, this.dim));
  }
}

/** نمونهٔ سراسری — قابل تعویض با ارائه‌دهندهٔ دیگر بدون تغییر بقیهٔ کد */
export const embeddingProvider: EmbeddingProvider = new HashingTfIdfEmbedding();

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot; // بردارها L2-نرمال هستند
}
