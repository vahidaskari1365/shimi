import { createHash, randomUUID } from "crypto";
import { mkdir, unlink, writeFile, readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { ENV } from "@/lib/env";
import { audit, ServiceError } from "@/lib/api";
import { embeddingProvider } from "@/lib/retrieval/embeddings";
import { invalidateRetrievalIndex } from "@/lib/retrieval/index-cache";
import { extractFile } from "@/lib/ingestion/extract";
import { chunkPages, type ChunkDraft } from "@/lib/ingestion/chunker";
import type { DocumentDTO, DocStatus } from "@/lib/types";

/**
 * سرویس نمایه‌سازی اسناد:
 * - جلوگیری از نمایه‌سازی تکراری با checksum
 * - ذخیرهٔ امن فایل خارج از public (بدون سرو شدن مستقیم)
 * - استخراج → قطعه‌بندی → بردارسازی دسته‌ای → ذخیره با منشأ (سند/صفحه)
 */

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

type DocumentRow = {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  needsOcr: boolean;
  error: string | null;
  pageCount: number | null;
  language: string | null;
  isSeed: boolean;
  createdAt: Date;
  _count?: { chunks: number };
};

export function toDocumentDTO(doc: DocumentRow): DocumentDTO {
  return {
    id: doc.id,
    title: doc.title,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    status: doc.status as DocStatus,
    needsOcr: doc.needsOcr,
    error: doc.error,
    pageCount: doc.pageCount,
    language: doc.language,
    chunkCount: doc._count?.chunks ?? 0,
    isSeed: doc.isSeed,
    createdAt: doc.createdAt.toISOString(),
  };
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || name;
}

/** پردازش کامل یک سند موجود (استخراج تا بردارسازی) */
async function processDocument(docId: string): Promise<void> {
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc) throw new ServiceError("NOT_FOUND", "سند یافت نشد.", 404);

  await db.document.update({ where: { id: docId }, data: { status: "processing", error: null } });

  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, doc.storedName));
    const extracted = await extractFile(doc.originalName, doc.mimeType, buffer);

    if (extracted.needsOcr) {
      await db.document.update({
        where: { id: docId },
        data: {
          status: "needs_ocr",
          needsOcr: true,
          pageCount: extracted.pageCount,
          error: "متن قابل استخراجی یافت نشد؛ احتمالاً سند اسکن‌شده است و به OCR نیاز دارد.",
        },
      });
      invalidateRetrievalIndex();
      return;
    }

    const drafts: ChunkDraft[] = chunkPages(extracted.pages);
    if (drafts.length === 0) {
      throw new ServiceError("NO_CHUNKS", "هیچ محتوای قابل نمایه‌سازی استخراج نشد.", 422);
    }

    // بردارسازی دسته‌ای
    const batchSize = 16;
    const vectors: number[][] = [];
    for (let i = 0; i < drafts.length; i += batchSize) {
      const batch = drafts.slice(i, i + batchSize).map((c) => `${c.heading ?? ""}\n${c.content}`);
      vectors.push(...embeddingProvider.embed(batch));
    }

    await db.chunk.createMany({
      data: drafts.map((c, i) => ({
        documentId: docId,
        seq: c.seq,
        page: c.page,
        heading: c.heading,
        content: c.content,
        embedding: JSON.stringify(vectors[i]),
      })),
    });

    await db.document.update({
      where: { id: docId },
      data: {
        status: "ready",
        needsOcr: false,
        pageCount: extracted.pageCount,
        language: extracted.persian ? "fa" : "en",
        error: extracted.warning,
      },
    });
    invalidateRetrievalIndex();
  } catch (err) {
    const message =
      err instanceof ServiceError
        ? err.message
        : "پردازش سند ناموفق بود؛ لطفاً فایل را بررسی کنید.";
    await db.document
      .update({ where: { id: docId }, data: { status: "failed", error: message } })
      .catch(() => undefined);
    invalidateRetrievalIndex();
    if (err instanceof ServiceError) throw err;
  }
}

export interface CreateDocumentInput {
  title: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  isSeed?: boolean;
}

/** ساخت سند از محتوای باینری — با dedupe و پردازش همگام */
export async function createDocument(
  input: CreateDocumentInput,
): Promise<{ document: DocumentDTO; duplicate: boolean }> {
  const checksum = createHash("sha256").update(input.buffer).digest("hex");

  const existing = await db.document.findUnique({
    where: { checksum },
    include: { _count: { select: { chunks: true } } },
  });
  if (existing) {
    return { document: toDocumentDTO(existing), duplicate: true };
  }

  const ext = input.originalName.split(".").pop()?.toLowerCase() ?? "txt";
  const storedName = `${randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, storedName), input.buffer, { flag: "wx" });

  const doc = await db.document.create({
    data: {
      title: input.title,
      originalName: input.originalName,
      storedName,
      mimeType: input.mimeType || "application/octet-stream",
      sizeBytes: input.buffer.length,
      checksum,
      status: "pending",
      isSeed: input.isSeed ?? false,
    },
  });

  await audit("create", "document", doc.id, { name: input.originalName });
  await processDocument(doc.id);

  const fresh = await db.document.findUnique({
    where: { id: doc.id },
    include: { _count: { select: { chunks: true } } },
  });
  return { document: toDocumentDTO(fresh!), duplicate: false };
}

export async function reindexDocument(id: string): Promise<DocumentDTO> {
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) throw new ServiceError("NOT_FOUND", "سند یافت نشد.", 404);

  await db.chunk.deleteMany({ where: { documentId: id } });
  invalidateRetrievalIndex();

  await processDocument(id);
  await audit("reindex", "document", id);

  const fresh = await db.document.findUnique({
    where: { id },
    include: { _count: { select: { chunks: true } } },
  });
  return toDocumentDTO(fresh!);
}

/** حذف کامل: فایل، قطعات، بردارها و رکوردهای گراف مشتق‌شده */
export async function deleteDocument(id: string): Promise<void> {
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) throw new ServiceError("NOT_FOUND", "سند یافت نشد.", 404);

  await db.document.delete({ where: { id } }); // قطعات و رکوردهای گراف وابسته cascade می‌شوند
  await unlink(path.join(UPLOAD_DIR, doc.storedName)).catch(() => undefined);
  invalidateRetrievalIndex();

  await audit("delete", "document", id, { name: doc.originalName });
}

export async function listDocuments(): Promise<DocumentDTO[]> {
  const docs = await db.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });
  return docs.map(toDocumentDTO);
}
