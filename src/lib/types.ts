// ─────────────────────────────────────────────────────────────
// قرارداد مشترک API — لایه تایپ مشترک فرانت‌اند و بک‌اند
// AI Formulation Assistant (شیمی‌یار)
// ─────────────────────────────────────────────────────────────

export type DocStatus = "pending" | "processing" | "ready" | "failed" | "needs_ocr";

export interface DocumentDTO {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocStatus;
  needsOcr: boolean;
  error: string | null;
  pageCount: number | null;
  language: string | null;
  chunkCount: number;
  isSeed: boolean;
  createdAt: string;
}

export interface ChunkDTO {
  id: string;
  seq: number;
  page: number | null;
  heading: string | null;
  content: string;
  documentTitle: string;
}

/** ارجاع شواهد — index با شماره‌های [n] داخل پاسخ یکی است (از ۱ شروع می‌شود) */
export interface EvidenceRef {
  index: number;
  documentId: string;
  documentTitle: string;
  page: number | null;
  heading: string | null;
  snippet: string;
  score: number;
}

export interface GraphFactDTO {
  text: string;
  source: string;
  confidence: number;
  verified: boolean;
}

export interface ChatMeta {
  model: string;
  embedding: string;
  keywordEnabled: boolean;
  vectorEnabled: boolean;
  graphEnabled: boolean;
  retrievedChunks: number;
  keywordMs: number;
  vectorMs: number;
  totalMs: number;
  /** منبع ایندکس بازیابی: دیتابیس واقعی یا دادهٔ نمایشی */
  indexSource: "db" | "demo";
  /** نحوهٔ ساخت پاسخ: مدل زبانی یا استخراج از شواهد */
  aiMode: "llm" | "extractive";
}

export interface ChatResponseDTO {
  answer: string;
  evidence: EvidenceRef[];
  graphFacts: GraphFactDTO[];
  followUps: string[];
  meta: ChatMeta;
}

export interface ChatRequestDTO {
  question: string;
  topK?: number;
  useKeyword?: boolean;
  useVector?: boolean;
  useGraph?: boolean;
  documentId?: string | null;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface IngredientDTO {
  id: string;
  name: string;
  inciName: string | null;
  category: string;
  description: string | null;
  casNumber: string | null;
  isSeed: boolean;
  createdAt: string;
}

export interface FormulationIngredientDTO {
  id: string;
  ingredientId: string;
  ingredientName: string;
  percentage: number;
  unit: string;
  phase: string | null;
  note: string | null;
}

export interface MeasurementDTO {
  id: string;
  name: string;
  value: number;
  unit: string;
  method: string | null;
  note: string | null;
  createdAt: string;
}

export interface ExperimentDTO {
  id: string;
  title: string;
  summary: string | null;
  results: string | null;
  status: string;
  createdAt: string;
}

export interface FormulationSummaryDTO {
  id: string;
  name: string;
  version: number;
  productCategory: string;
  description: string | null;
  status: string;
  ingredientCount: number;
  isSeed: boolean;
  createdAt: string;
}

export interface FormulationDetailDTO extends FormulationSummaryDTO {
  ingredients: FormulationIngredientDTO[];
  measurements: MeasurementDTO[];
  experiments: ExperimentDTO[];
}

export interface GraphEntityDTO {
  id: string;
  type: string;
  name: string;
  description: string | null;
  confidence: number;
  verified: boolean;
  sourceDocumentId: string | null;
  sourceDocumentTitle: string | null;
  createdAt: string;
}

export interface GraphRelationshipDTO {
  id: string;
  type: string;
  direction: "outgoing" | "incoming";
  otherEntity: { id: string; name: string; type: string };
  evidence: string | null;
  confidence: number;
  verified: boolean;
  sourceDocumentTitle: string | null;
}

export interface GraphEntityDetailDTO extends GraphEntityDTO {
  relations: GraphRelationshipDTO[];
}

export interface TraversePathDTO {
  depth: number;
  entities: { id: string; name: string; type: string }[];
  relations: {
    type: string;
    evidence: string | null;
    confidence: number;
    verified: boolean;
  }[];
}

export interface ConfidenceLevel {
  level: "کم" | "متوسط" | "زیاد";
}

export interface TroubleshootingFactor {
  factor: string;
  rationale: string;
  evidenceRefs: number[];
  confidence: ConfidenceLevel["level"];
}

export interface TroubleshootingAnalysis {
  summary: string;
  possibleFactors: TroubleshootingFactor[];
  missingInfo: string[];
  suggestedInvestigations: string[];
  evidence: EvidenceRef[];
  disclaimer: string;
}

export interface TroubleshootingCaseDTO {
  id: string;
  title: string;
  productCategory: string;
  symptoms: string;
  manufacturingConditions: string | null;
  measurements: string | null;
  status: string;
  analysis: TroubleshootingAnalysis | null;
  createdAt: string;
}

export interface SettingsDTO {
  mode: "live" | "demo";
  llmProvider: string;
  llmModel: string;
  embeddingProvider: string;
  embeddingDim: number;
  retrieval: {
    topK: number;
    rrfK: number;
    chunkSize: number;
    chunkOverlap: number;
    keywordEnabled: boolean;
    vectorEnabled: boolean;
    graphEnabled: boolean;
  };
  limits: {
    maxUploadMB: number;
    allowedExtensions: string[];
  };
  counts: {
    documents: number;
    chunks: number;
    ingredients: number;
    formulations: number;
    graphEntities: number;
    graphRelationships: number;
    cases: number;
  };
  security: {
    authEnabled: boolean;
    notes: string[];
  };
  disclaimer: string;
}

export interface HealthDTO {
  status: "ok" | "degraded";
  database: boolean;
  llmConfigured: boolean;
  /** live = متصل به دیتابیس؛ demo = دادهٔ نمایشی */
  mode: "live" | "demo";
  time: string;
  version: string;
  model?: string;
  provider?: string;
}

/** شکل استاندارد خطا برای همه endpointها */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ───────────────────────── ثابت‌های دامنه ─────────────────────────

export const GRAPH_ENTITY_TYPES = [
  "Ingredient",
  "Formulation",
  "Product",
  "Property",
  "Supplier",
  "ManufacturingProcess",
  "FailureMode",
  "Document",
] as const;

export const GRAPH_RELATION_TYPES = [
  "CONTAINS",
  "HAS_PROPERTY",
  "USED_IN",
  "SUPPLIED_BY",
  "ASSOCIATED_WITH",
  "CAUSES_OR_CONTRIBUTES_TO",
  "DOCUMENTED_IN",
] as const;

export const ENTITY_TYPE_FA: Record<string, string> = {
  Ingredient: "ماده اولیه",
  Formulation: "فرمولاسیون",
  Product: "محصول",
  Property: "خاصیت",
  Supplier: "تأمین‌کننده",
  ManufacturingProcess: "فرایند تولید",
  FailureMode: "حالت خرابی",
  Document: "سند",
};

export const RELATION_TYPE_FA: Record<string, string> = {
  CONTAINS: "شامل می‌شود",
  HAS_PROPERTY: "دارای خاصیت",
  USED_IN: "به‌کاررفته در",
  SUPPLIED_BY: "تأمین‌شده توسط",
  ASSOCIATED_WITH: "مرتبط با",
  CAUSES_OR_CONTRIBUTES_TO: "علت یا مؤثر بر",
  DOCUMENTED_IN: "مستندشده در",
};

export const INGREDIENT_CATEGORIES_FA = [
  "سورفکتانت",
  "فعال‌کننده و نرم‌کننده",
  "تغلیظ‌کننده",
  "نگهدارنده",
  "عدل‌کننده pH",
  "عطر و رنگ",
  "آب و حلال",
  "فعال دارویی/مراقبتی",
  "دیگر",
] as const;

export const PRODUCT_CATEGORIES_FA = [
  "شامپو",
  "مایع ظرفشویی",
  "مایع دستشویی",
  "شوینده سطح",
  "کرم مرطوب‌کننده",
  "لوسیون بدن",
  "سرم پوستی",
  "ضدآفتاب",
  "دیگر",
] as const;

export const MEASUREMENT_UNITS_FA = ["-", "cP", "mPa·s", "°C", "%", "g/mL", "N"] as const;

export const FORMULATION_STATUS_FA: Record<string, string> = {
  draft: "پیش‌نویس",
  in_review: "در بازبینی",
  approved: "تأییدشده",
  deprecated: "منسوخ",
};

export const CASE_STATUS_FA: Record<string, string> = {
  open: "باز",
  investigating: "در حال بررسی",
  resolved: "حل‌شده",
};

export const DOC_STATUS_FA: Record<DocStatus, string> = {
  pending: "در صف",
  processing: "در حال پردازش",
  ready: "آماده",
  failed: "ناموفق",
  needs_ocr: "نیازمند OCR",
};
