"use client";

import { Fragment, type ReactNode } from "react";

/**
 * رندر سبک مارک‌داون برای پاسخ دستیار:
 * پشتیبانی از عنوان‌های ###، فهرست‌ها، **پررنگ** و چیپ‌های استناد [n]
 */
function renderInline(
  text: string,
  keyPrefix: string,
  onCitationClick?: (index: number) => void,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const boldParts = text.split(/\*\*(.+?)\*\*/g);
  boldParts.forEach((part, i) => {
    if (i % 2 === 1) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-bold text-foreground">
          {part}
        </strong>,
      );
      return;
    }
    const segs = part.split(/(\[\d+\])/g);
    segs.forEach((seg, j) => {
      const m = seg.match(/^\[(\d+)\]$/);
      if (m) {
        const n = Number(m[1]);
        nodes.push(
          <button
            key={`${keyPrefix}-c${i}-${j}`}
            type="button"
            onClick={() => onCitationClick?.(n)}
            className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-emerald-400/40 bg-emerald-500/15 px-1 align-middle text-[11px] font-bold text-emerald-300 transition-all hover:scale-110 hover:bg-emerald-500/25 hover:shadow-[0_0_12px_-2px_rgba(52,211,153,0.5)]"
            aria-label={`رفتن به منبع ${n}`}
          >
            {seg.replace(/[\[\]]/g, "")}
          </button>,
        );
      } else if (seg !== "") {
        nodes.push(<Fragment key={`${keyPrefix}-t${i}-${j}`}>{seg}</Fragment>);
      }
    });
  });
  return nodes;
}

export function MarkdownLite({
  content,
  onCitationClick,
}: {
  content: string;
  onCitationClick?: (index: number) => void;
}) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: { ordered: boolean; text: string }[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    const { ordered } = listBuffer[0];
    const items = listBuffer.map((li, idx) => (
      <li key={`${key}-li${idx}`} className="leading-7">
        {renderInline(li.text, `${key}-li${idx}`, onCitationClick)}
      </li>
    ));
    blocks.push(
      ordered ? (
        <ol key={key} className="my-2 list-decimal space-y-1 pe-5 marker:text-emerald-400/70">
          {items}
        </ol>
      ) : (
        <ul key={key} className="my-2 list-disc space-y-1 pe-5 marker:text-emerald-400/70">
          {items}
        </ul>
      ),
    );
    listBuffer = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    const bullet = line.match(/^[-•*]\s+(.*)$/);
    const ordered = line.match(/^\d+[.)]\s+(.*)$/);
    const heading = line.match(/^(#{2,4})\s+(.*)$/);

    if (bullet) {
      listBuffer.push({ ordered: false, text: bullet[1] });
      return;
    }
    if (ordered) {
      if (listBuffer.length > 0 && listBuffer[0].ordered === false) flushList(`l${idx}`);
      listBuffer.push({ ordered: true, text: ordered[1] });
      return;
    }
    flushList(`l${idx}`);
    if (heading) {
      blocks.push(
        <p key={`h${idx}`} className="mt-3 mb-1 font-bold text-emerald-200/90">
          {renderInline(heading[2], `h${idx}`, onCitationClick)}
        </p>,
      );
      return;
    }
    if (line.trim() === "") {
      blocks.push(<div key={`s${idx}`} className="h-1.5" />);
      return;
    }
    blocks.push(
      <p key={`p${idx}`} className="leading-7">
        {renderInline(line, `p${idx}`, onCitationClick)}
      </p>,
    );
  });
  flushList("l-end");

  return <div className="text-[15px] text-foreground/95">{blocks}</div>;
}
