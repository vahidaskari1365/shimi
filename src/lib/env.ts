// پیکربندی محیط‌محور — همهٔ مقادیر قابل تغییر با متغیرهای محیطی
function numEnv(key: string, def: number): number {
  const raw = process.env[key];
  if (!raw) return def;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export const ENV = {
  chunkSize: numEnv("CHUNK_SIZE", 900),
  chunkOverlap: numEnv("CHUNK_OVERLAP", 150),
  retrievalTopK: numEnv("RETRIEVAL_TOP_K", 8),
  rrfK: numEnv("RRF_K", 60),
  maxUploadMB: numEnv("MAX_UPLOAD_MB", 15),
  embeddingDim: numEnv("EMBEDDING_DIM", 384),
  graphExtractMaxChunks: numEnv("GRAPH_EXTRACT_MAX_CHUNKS", 24),
  llmModel: process.env.LLM_MODEL ?? "z-ai-default",
  llmProvider: process.env.LLM_PROVIDER ?? "z-ai-web-dev-sdk (پیش‌فرض محیط)",
  allowedExtensions: ["pdf", "txt", "md", "csv"],
} as const;

export const APP_VERSION = "0.1.0-mvp";
