import { ENV } from "@/lib/env";
import type { ExtractedPage } from "@/lib/ingestion/extract";

export interface ChunkDraft {
  seq: number;
  page: number | null;
  heading: string | null;
  content: string;
}

interface Block {
  text: string;
  page: number | null;
  heading: string | null;
}

/** تشخیص عنوان: هدینگ مارک‌داون یا خط کوتاه بدون نقطهٔ پایانی */
function headingOf(text: string): string | null {
  const md = text.match(/^#{1,6}\s+(.{2,90})$/);
  if (md) return md[1].trim();
  const first = text.split("\n")[0]?.trim() ?? "";
  if (first.length >= 3 && first.length <= 70 && !/[.!?؟]$/.test(first) && !first.startsWith("|")) {
    return first;
  }
  return null;
}

function splitBlocks(page: ExtractedPage): Block[] {
  // ابتدا روی پاراگراف، سپس در صورت لزوم روی خطوط
  const raw = page.text.split(/\n{2,}/).flatMap((p) => (p.trim() === "" ? [] : [p.trim()]));
  if (raw.length <= 1) {
    return page.text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((text) => ({ text, page: page.page, heading: headingOf(text) }));
  }
  return raw.map((text) => ({ text, page: page.page, heading: headingOf(text) }));
}

function hardSplit(text: string, size: number, overlap: number): string[] {
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      // برش در مرز واژه
      const space = text.lastIndexOf(" ", end);
      if (space > start + size * 0.6) end = space;
    }
    parts.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return parts.filter((p) => p.length > 0);
}

/**
 * قطعه‌بندی با حفظ صفحه، عنوان و هم‌پوشانی.
 * هیچ جدول یا متن بدشکلی بی‌صدا دور ریخته نمی‌شود — همه داخل قطعات می‌مانند.
 */
export function chunkPages(
  pages: ExtractedPage[],
  opts?: { size?: number; overlap?: number },
): ChunkDraft[] {
  const size = opts?.size ?? ENV.chunkSize;
  const overlap = Math.min(opts?.overlap ?? ENV.chunkOverlap, Math.floor(size / 3));

  const blocks = pages.flatMap(splitBlocks).filter((b) => b.text.length > 0);
  const chunks: ChunkDraft[] = [];

  let buffer: string[] = [];
  let bufferLen = 0;
  let bufferPage: number | null = null;
  let bufferHeading: string | null = null;

  const flush = () => {
    if (buffer.length === 0) return;
    const content = buffer.join("\n\n").trim();
    if (content.length >= 20) {
      chunks.push({
        seq: chunks.length,
        page: bufferPage,
        heading: bufferHeading,
        content,
      });
    }
    // هم‌پوشانی: پایان قطعهٔ قبلی به ابتدای بعدی می‌چسبد
    const tail = content.slice(-overlap);
    const space = tail.indexOf(" ");
    buffer = space >= 0 && space < tail.length - 1 ? [tail.slice(space + 1)] : [tail];
    bufferLen = buffer[0].length;
    // صفحه/عنوان قطعهٔ بعدی از بلوک بعدی تعیین می‌شود
  };

  for (const block of blocks) {
    const pieces = block.text.length > size ? hardSplit(block.text, size, overlap) : [block.text];
    for (const piece of pieces) {
      if (bufferLen > 0 && bufferLen + piece.length + 2 > size) {
        flush();
      }
      if (bufferLen === 0) {
        bufferPage = block.page;
        bufferHeading = block.heading ?? bufferHeading;
      }
      buffer.push(piece);
      bufferLen += piece.length + 2;
    }
  }
  flush();

  return chunks;
}
