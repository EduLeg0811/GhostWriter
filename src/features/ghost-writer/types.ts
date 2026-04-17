import type { BookCode } from "@/lib/bookCatalog";

export type MacroActionId = "macro1" | "macro2";
export type AppActionId = "app1" | "app2" | "app3" | "app4" | "app5" | "app6" | "app7" | "app8" | "app9" | "app10" | "app11" | "app12" | "app13";
export type AppPanelScope = "bibliografia" | "busca_termos" | "semantic_search" | "verbetografia";
export type AiPanelScope = "actions" | "rewriting" | "translation" | "customized_prompts";
export type AiActionId = "synonyms" | "antonyms" | "etymology" | "dictionary" | "epigraph" | "rewrite" | "summarize" | "cognatos" | "translate" | "dict_lookup" | "ai_command" | "analogies" | "comparisons" | "examples" | "counterpoints" | "neoparadigma";
export type ParameterPanelSection = "document" | "sources" | "actions" | "rewriting" | "translation" | "customized_prompts" | "apps" | "applications";
export type ParameterPanelTargetId = MacroActionId | AiActionId | AppActionId | null;
export type ParameterPanelTarget = { section: ParameterPanelSection; id: ParameterPanelTargetId } | null;
export type MobilePanelId = "left" | "center" | "right" | "editor" | "json";
export type LogPanelTabId = "search" | "llm";
export type ConfigPanelTabId = "sources" | "ia";
export type SourcesPanelView = "books" | "vector-store" | "upload" | null;
export type BackendStatus = "checking" | "ready" | "missing_openai_key" | "unavailable";
export type ParameterPanelHeaderMeta = { title: string; description: string };
export type SelectOption = { id: string; label: string };
export type LlmConfigPanelId = "chat" | "ai_actions" | "biblio_externa";
export type Macro2SpacingMode = "normal_single" | "normal_double" | "nbsp_single" | "nbsp_double";
export type RefBookMode = "bee" | "simples";
export type SemanticIndexOption = {
  id: string;
  label: string;
  sourceFile: string;
  sourceRows: number;
  model: string;
  dimensions: number;
  embeddingDtype: string;
  suggestedMinScore: number;
};
export type SemanticSearchRagDefinition = {
  term: string;
  meaning: string;
};
export type SemanticSearchRagContext = {
  usedRagContext: boolean;
  sourceQuery?: string;
  error?: string;
  vectorStoreIds: string[];
  keyTerms: string[];
  definitions: SemanticSearchRagDefinition[];
  relatedTerms: string[];
  disambiguatedQuery: string;
  references: string[];
};
export type LlmLogEntry = {
  id: string;
  at: string;
  request: unknown;
  response?: unknown;
  error?: string;
};
export type GhostWriterActionState = {
  selectedRefBook: BookCode;
};

export interface LexicalHistoryMatch {
  book: string;
  row: number;
  number: number | null;
  title: string;
  text: string;
  pagina: string;
  data: Record<string, string>;
}

export interface LexicalOverviewHistoryGroup {
  bookCode: string;
  bookLabel: string;
  fileStem: string;
  totalFound: number;
  shownCount: number;
  matches: LexicalHistoryMatch[];
}

export interface LexicalOverviewHistoryPayload {
  kind: "lexical_overview";
  term: string;
  limit: number;
  totalBooks: number;
  totalFound: number;
  groups: LexicalOverviewHistoryGroup[];
}

export interface SemanticOverviewHistoryMatch {
  book: string;
  index_id: string;
  index_label: string;
  row: number;
  text: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface SemanticOverviewHistoryGroup {
  indexId: string;
  indexLabel: string;
  totalFound: number;
  shownCount: number;
  matches: SemanticOverviewHistoryMatch[];
}

export interface SemanticOverviewHistoryPayload {
  kind: "semantic_overview";
  term: string;
  limit: number;
  minScore: number;
  recommendedMinScoreMin: number;
  recommendedMinScoreMax: number;
  usesCalibratedMinScores: boolean;
  totalIndexes: number;
  totalFound: number;
  lexicalFilteredCount: number;
  groups: SemanticOverviewHistoryGroup[];
}

export type AIResponsePayload = LexicalOverviewHistoryPayload | SemanticOverviewHistoryPayload;

export interface AIResponse {
  id: string;
  type:
    | "synonyms"
    | "antonyms"
    | "etymology"
    | "dictionary"
    | "epigraph"
    | "rewrite"
    | "summarize"
    | "translate"
    | "dict_lookup"
    | "ai_command"
    | "analogies"
    | "comparisons"
    | "examples"
    | "counterpoints"
    | "neoparadigma"
    | "chat"
    | "cognatos"
    | "app_ref_book"
    | "app_ref_verbete_list"
    | "app_ref_verbete_biblio"
    | "app_biblio_geral"
    | "app_biblio_externa"
    | "app_random_pensata"
    | "app_book_search"
    | "app_lexical_overview"
    | "app_semantic_search"
    | "app_semantic_overview"
    | "app_verbete_search"
    | "app_verbete_definologia"
    | "app_verbete_frase_enfatica"
    | "app_verbete_sinonimologia"
    | "app_verbete_fatologia";
  query: string;
  content: string;
  payload?: AIResponsePayload;
  isConscienciografia?: boolean;
  timestamp: Date;
}
