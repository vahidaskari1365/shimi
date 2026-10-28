import { z } from "zod";
import { db } from "@/lib/db";
import { ENV } from "@/lib/env";
import { audit, ServiceError } from "@/lib/api";
import { isDbAvailable } from "@/lib/demo/mode";
import { demoGraphFactForQuery } from "@/lib/demo/demo-data";
import { normalizeForContains } from "@/lib/retrieval/tokenize";
import { llmComplete, extractJson } from "@/lib/llm/provider";
import { GRAPH_EXTRACT_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import {
  GRAPH_ENTITY_TYPES,
  GRAPH_RELATION_TYPES,
  type GraphEntityDTO,
  type GraphEntityDetailDTO,
  type TraversePathDTO,
} from "@/lib/types";

/** نام نرمال‌شده برای تشخیص تکراری */
const normalizeName = (name: string) => normalizeForContains(name).slice(0, 120);

const EntityInput = z.object({
  type: z.enum(GRAPH_ENTITY_TYPES),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  verified: z.boolean().optional(),
  sourceDocumentId: z.string().uuid().nullable().optional(),
});

const RelationshipInput = z.object({
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  type: z.enum(GRAPH_RELATION_TYPES),
  evidence: z.string().max(1000).nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  verified: z.boolean().optional(),
  sourceDocumentId: z.string().uuid().nullable().optional(),
});

type EntityWithDoc = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  confidence: number;
  verified: boolean;
  sourceDocumentId: string | null;
  createdAt: Date;
  sourceDocument?: { title: string } | null;
};

function toEntityDTO(e: EntityWithDoc): GraphEntityDTO {
  return {
    id: e.id,
    type: e.type,
    name: e.name,
    description: e.description,
    confidence: e.confidence,
    verified: e.verified,
    sourceDocumentId: e.sourceDocumentId,
    sourceDocumentTitle: e.sourceDocument?.title ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

// ───────────────────────── ایجاد/به‌روزرسانی ─────────────────────────

export async function upsertEntity(raw: unknown): Promise<GraphEntityDTO> {
  const input = EntityInput.parse(raw);
  const normalizedName = normalizeName(input.name);

  const existing = await db.graphEntity.findUnique({
    where: { type_normalizedName: { type: input.type, normalizedName } },
    include: { sourceDocument: { select: { title: true } } },
  });

  if (existing) {
    const updated = await db.graphEntity.update({
      where: { id: existing.id },
      data: {
        description: existing.description ?? input.description ?? null,
        confidence: Math.max(existing.confidence, input.confidence ?? 1),
      },
      include: { sourceDocument: { select: { title: true } } },
    });
    return toEntityDTO(updated);
  }

  const created = await db.graphEntity.create({
    data: {
      type: input.type,
      name: input.name.trim(),
      normalizedName,
      description: input.description ?? null,
      confidence: input.confidence ?? 1,
      verified: input.verified ?? false,
      sourceDocumentId: input.sourceDocumentId ?? null,
    },
    include: { sourceDocument: { select: { title: true } } },
  });
  return toEntityDTO(created);
}

export async function upsertRelationship(raw: unknown): Promise<{ id: string; created: boolean }> {
  const input = RelationshipInput.parse(raw);
  if (input.sourceEntityId === input.targetEntityId) {
    throw new ServiceError("SELF_RELATION", "مبدأ و مقصد رابطه نمی‌توانند یکی باشند.", 422);
  }

  const [source, target] = await Promise.all([
    db.graphEntity.findUnique({ where: { id: input.sourceEntityId } }),
    db.graphEntity.findUnique({ where: { id: input.targetEntityId } }),
  ]);
  if (!source || !target) {
    throw new ServiceError("ENTITY_NOT_FOUND", "موجودیت مبدأ یا مقصد یافت نشد.", 404);
  }

  const existing = await db.graphRelationship.findUnique({
    where: {
      sourceEntityId_targetEntityId_type: {
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        type: input.type,
      },
    },
  });

  if (existing) {
    await db.graphRelationship.update({
      where: { id: existing.id },
      data: {
        evidence: existing.evidence ?? input.evidence ?? null,
        confidence: Math.max(existing.confidence, input.confidence ?? 1),
      },
    });
    return { id: existing.id, created: false };
  }

  const created = await db.graphRelationship.create({
    data: {
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      type: input.type,
      evidence: input.evidence ?? null,
      confidence: input.confidence ?? 1,
      verified: input.verified ?? false,
      sourceDocumentId: input.sourceDocumentId ?? null,
    },
  });
  return { id: created.id, created: true };
}

// ───────────────────────── پرس‌وجو ─────────────────────────

export async function listEntities(type?: string | null, query?: string | null): Promise<GraphEntityDTO[]> {
  const where: { type?: string; name?: { contains: string } } = {};
  if (type && type !== "all") where.type = type;
  const entities = await db.graphEntity.findMany({
    where,
    orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
    take: 300,
    include: { sourceDocument: { select: { title: true } } },
  });
  const q = query?.trim().toLowerCase();
  const filtered = q
    ? entities.filter(
        (e) =>
          normalizeForContains(e.name).includes(normalizeForContains(q)) ||
          (e.description ?? "").toLowerCase().includes(q),
      )
    : entities;
  return filtered.map(toEntityDTO);
}

export async function getEntityDetail(id: string): Promise<GraphEntityDetailDTO> {
  const entity = await db.graphEntity.findUnique({
    where: { id },
    include: { sourceDocument: { select: { title: true } } },
  });
  if (!entity) throw new ServiceError("NOT_FOUND", "موجودیت یافت نشد.", 404);

  const rels = await db.graphRelationship.findMany({
    where: { OR: [{ sourceEntityId: id }, { targetEntityId: id }] },
    include: {
      sourceEntity: { select: { id: true, name: true, type: true } },
      targetEntity: { select: { id: true, name: true, type: true } },
      sourceDocument: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    ...toEntityDTO(entity),
    relations: rels.map((r) => {
      const outgoing = r.sourceEntityId === id;
      const other = outgoing ? r.targetEntity : r.sourceEntity;
      return {
        id: r.id,
        type: r.type,
        direction: outgoing ? ("outgoing" as const) : ("incoming" as const),
        otherEntity: { id: other.id, name: other.name, type: other.type },
        evidence: r.evidence,
        confidence: r.confidence,
        verified: r.verified,
        sourceDocumentTitle: r.sourceDocument?.title ?? null,
      };
    }),
  };
}

export async function deleteEntity(id: string): Promise<void> {
  const entity = await db.graphEntity.findUnique({ where: { id } });
  if (!entity) throw new ServiceError("NOT_FOUND", "موجودیت یافت نشد.", 404);
  await db.graphEntity.delete({ where: { id } });
  await audit("delete", "graph_entity", id, { name: entity.name });
}

/** پیمایش چند-پله‌ای BFS با جلوگیری از چرخه */
export async function traverseGraph(entityId: string, maxDepth: number): Promise<TraversePathDTO[]> {
  const depth = Math.min(Math.max(maxDepth, 1), 3);
  const origin = await db.graphEntity.findUnique({ where: { id: entityId } });
  if (!origin) throw new ServiceError("NOT_FOUND", "موجودیت یافت نشد.", 404);

  const allRels = await db.graphRelationship.findMany({
    include: {
      sourceEntity: { select: { id: true, name: true, type: true } },
      targetEntity: { select: { id: true, name: true, type: true } },
    },
  });

  const paths: TraversePathDTO[] = [];

  const walk = (
    currentId: string,
    entities: { id: string; name: string; type: string }[],
    relations: TraversePathDTO["relations"],
    visited: Set<string>,
    level: number,
  ) => {
    if (level > depth) {
      if (relations.length > 0) {
        paths.push({ depth: relations.length, entities: [...entities], relations: [...relations] });
      }
      return;
    }
    const neighbors = allRels.filter((r) => r.sourceEntityId === currentId || r.targetEntityId === currentId);
    let extended = false;
    for (const r of neighbors) {
      const outgoing = r.sourceEntityId === currentId;
      const next = outgoing ? r.targetEntity : r.sourceEntity;
      if (visited.has(next.id)) continue;
      extended = true;
      visited.add(next.id);
      walk(
        next.id,
        [...entities, { id: next.id, name: next.name, type: next.type }],
        [
          ...relations,
          { type: r.type, evidence: r.evidence, confidence: r.confidence, verified: r.verified },
        ],
        visited,
        level + 1,
      );
      visited.delete(next.id);
    }
    if (!extended && relations.length > 0) {
      paths.push({ depth: relations.length, entities: [...entities], relations: [...relations] });
    }
  };

  walk(
    origin.id,
    [{ id: origin.id, name: origin.name, type: origin.type }],
    [],
    new Set([origin.id]),
    1,
  );

  // کوتاه‌ترین و متنوع‌ترین‌ها اول، محدود به ۵۰ مسیر
  return paths.sort((a, b) => a.depth - b.depth).slice(0, 50);
}

// ───────────────────────── استخراج با LLM ─────────────────────────

const LlmGraphSchema = z.object({
  entities: z
    .array(
      z.object({
        type: z.enum(GRAPH_ENTITY_TYPES),
        name: z.string().min(1).max(120),
        description: z.string().max(600).optional().nullable(),
      }),
    )
    .max(60),
  relationships: z
    .array(
      z.object({
        source: z.string().min(1),
        target: z.string().min(1),
        type: z.enum(GRAPH_RELATION_TYPES),
        evidence: z.string().max(400).optional().nullable(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    )
    .max(80),
});

/** استخراج موجودیت/رابطه از سند — خروجی همیشه با برچسب «نیازمند راستی‌آزمایی» */
export async function extractGraphFromDocument(
  documentId: string,
): Promise<{ entities: number; relationships: number }> {
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { chunks: { orderBy: { seq: "asc" }, take: ENV.graphExtractMaxChunks } },
  });
  if (!doc) throw new ServiceError("NOT_FOUND", "سند یافت نشد.", 404);
  if (doc.status !== "ready") {
    throw new ServiceError("DOC_NOT_READY", "سند هنوز آماده نیست یا نیازمند OCR است.", 409);
  }

  const corpus = doc.chunks
    .map((c) => `[قطعهٔ ${c.seq + 1}${c.page ? ` — صفحهٔ ${c.page}` : ""}${c.heading ? ` — ${c.heading}` : ""}]\n${c.content}`)
    .join("\n\n")
    .slice(0, 24000);

  const raw = await llmComplete([
    { role: "assistant", content: GRAPH_EXTRACT_SYSTEM_PROMPT },
    { role: "user", content: `متن سند «${doc.title}»:\n\n${corpus}` },
  ]);

  const parsed = extractJson<unknown>(raw);
  if (!parsed) {
    throw new ServiceError("GRAPH_PARSE_FAILED", "خروجی مدل قابل تفسیر نبود؛ دوباره تلاش کنید.", 502);
  }
  const validated = LlmGraphSchema.safeParse(parsed);
  if (!validated.success) {
    throw new ServiceError("GRAPH_SCHEMA_FAILED", "ساختار خروجی مدل معتبر نبود.", 502, {
      issues: validated.error.issues.slice(0, 5),
    });
  }

  // ایجاد موجودیت‌ها با نگاشت نام → id
  const nameToId = new Map<string, string>();
  let entityCount = 0;
  for (const e of validated.data.entities) {
    const dto = await upsertEntity({
      type: e.type,
      name: e.name,
      description: e.description ?? null,
      confidence: 0.85,
      verified: false,
      sourceDocumentId: documentId,
    });
    nameToId.set(normalizeName(e.name), dto.id);
    entityCount++;
  }

  // روابط — فقط اگر دو سر شناخته‌شده باشند؛ در غیر این صورت موجودیت مقصد ساخته می‌شود
  let relCount = 0;
  for (const r of validated.data.relationships) {
    let sourceId = nameToId.get(normalizeName(r.source));
    let targetId = nameToId.get(normalizeName(r.target));
    try {
      if (!sourceId) {
        const created = await upsertEntity({
          type: "Ingredient",
          name: r.source,
          confidence: 0.7,
          verified: false,
          sourceDocumentId: documentId,
        });
        sourceId = created.id;
        nameToId.set(normalizeName(r.source), created.id);
      }
      if (!targetId) {
        const created = await upsertEntity({
          type: "Ingredient",
          name: r.target,
          confidence: 0.7,
          verified: false,
          sourceDocumentId: documentId,
        });
        targetId = created.id;
        nameToId.set(normalizeName(r.target), created.id);
      }
      const res = await upsertRelationship({
        sourceEntityId: sourceId,
        targetEntityId: targetId,
        type: r.type,
        evidence: r.evidence ?? null,
        confidence: r.confidence ?? 0.7,
        verified: false,
        sourceDocumentId: documentId,
      });
      if (res.created) relCount++;
    } catch {
      // رابطهٔ بدشکل — نادیده (در گزارش شمرده نمی‌شود)
    }
  }

  await audit("extract_graph", "document", documentId, { entities: entityCount, relationships: relCount });
  return { entities: entityCount, relationships: relCount };
}

/** یافتن موجودیت‌های مرتبط با پرسش برای تزریق به پاسخ (بخش گراف) */
export async function findGraphFactsForQuery(
  query: string,
  limit = 3,
): Promise<{ text: string; source: string; confidence: number; verified: boolean }[]> {
  const tokens = normalizeForContains(query).split(" ").filter((t) => t.length >= 3);
  if (tokens.length === 0) return [];

  // حالت نمایشی: گراف درون‌حافظهٔ دادهٔ نمونه
  if (!(await isDbAvailable())) {
    return demoGraphFactForQuery(query, limit);
  }

  let entities;
  try {
    entities = await db.graphEntity.findMany({
      take: 120,
      orderBy: { createdAt: "desc" },
      include: {
        sourceDocument: { select: { title: true } },
        outgoing: { take: 4, include: { targetEntity: { select: { name: true, type: true } } } },
        incoming: { take: 4, include: { sourceEntity: { select: { name: true, type: true } } } },
      },
    });
  } catch (err) {
    console.error("[graph] facts query failed, falling back to demo:", err);
    return demoGraphFactForQuery(query, limit);
  }

  const matched = entities.filter((e) => {
    const n = normalizeForContains(e.name);
    return tokens.some((t) => n.includes(t) || t.includes(n));
  });
  if (matched.length === 0) return [];

  const facts: { text: string; source: string; confidence: number; verified: boolean }[] = [];
  for (const e of matched.slice(0, limit)) {
    const docTitle = e.sourceDocument?.title;
    for (const r of e.outgoing) {
      facts.push({
        text: `${e.name} ← ${r.type} → ${r.targetEntity.name}`,
        source: r.sourceDocumentId && docTitle ? `سند «${docTitle}»` : "گراف دانش",
        confidence: r.confidence,
        verified: r.verified,
      });
    }
    for (const r of e.incoming) {
      facts.push({
        text: `${r.sourceEntity.name} ← ${r.type} → ${e.name}`,
        source: r.sourceDocumentId && docTitle ? `سند «${docTitle}»` : "گراف دانش",
        confidence: r.confidence,
        verified: r.verified,
      });
    }
    if (facts.length >= limit * 3) break;
  }
  return facts.slice(0, 8);
}
