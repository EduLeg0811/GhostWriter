import type { BookCode } from "@/lib/bookCatalog";

export type MacroActionId = "macro1" | "macro2";
export type AppActionId = "app1" | "app2" | "app3" | "app4" | "app5" | "app6" | "app7" | "app8" | "app9" | "app10" | "app11" | "app12";
export type AppPanelScope = "bibliografia" | "busca_termos" | "semantic_search" | "verbetografia";
export type AiPanelScope = "actions" | "rewriting" | "translation" | "customized_prompts";
export type AiActionId = "define" | "synonyms" | "etymology" | "dictionary" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "translate" | "dict_lookup" | "ai_command" | "analogies" | "comparisons" | "examples" | "counterpoints" | "neoparadigma";
export type ParameterPanelSection = "document" | "sources" | "actions" | "rewriting" | "translation" | "customized_prompts" | "apps" | "applications";
export type ParameterPanelTarget =
  | { section: "document"; id: MacroActionId | null }
  | { section: "sources"; id: null }
  | { section: "actions"; id: AiActionId | null }
  | { section: "rewriting"; id: AiActionId | null }
  | { section: "translation"; id: AiActionId | null }
  | { section: "customized_prompts"; id: AiActionId | null }
  | { section: "apps"; id: AppActionId | null }
  | { section: "applications"; id: null }
  | null;
export type MobilePanelId = "left" | "center" | "right" | "editor" | "json";
export type SourcesPanelView = "books" | "vector-store" | "upload" | null;
export type BackendStatus = "checking" | "ready" | "missing_openai_key" | "unavailable";
export type ParameterPanelHeaderMeta = { title: string; description: string };
export type SelectOption = { id: string; label: string };
export type LlmConfigPanelId = "chat" | "ai_actions" | "biblio_externa";
export type Macro2SpacingMode = "normal_single" | "normal_double" | "nbsp_single" | "nbsp_double";
export type SemanticIndexOption = {
  id: string;
  label: string;
  sourceFile: string;
  sourceRows: number;
  model: string;
  dimensions: number;
  embeddingDtype: string;
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
export interface AIResponse {
  id: string;
  type:
    | "define"
    | "synonyms"
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
    | "pensatas"
    | "app_ref_book"
    | "app_ref_verbete_list"
    | "app_ref_verbete_biblio"
    | "app_biblio_geral"
    | "app_biblio_externa"
    | "app_random_pensata"
    | "app_book_search"
    | "app_semantic_search"
    | "app_verbete_search"
    | "app_verbete_definologia"
    | "app_verbete_frase_enfatica"
    | "app_verbete_sinonimologia"
    | "app_verbete_fatologia";
  query: string;
  content: string;
  timestamp: Date;
}
