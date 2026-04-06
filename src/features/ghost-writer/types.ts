import type { BookCode } from "@/lib/bookCatalog";

export type MacroActionId = "macro1" | "macro2";
export type AppActionId = "app1" | "app2" | "app3" | "app4" | "app5" | "app6" | "app7" | "app8" | "app9" | "app10" | "app11" | "app12";
export type AppPanelScope = "bibliografia" | "busca_termos" | "semantic_search" | "verbetografia";
export type AiPanelScope = "definitions_cons" | "actions" | "rewriting" | "translation" | "customized_prompts" | "ai_command";
export type AiActionId = "define" | "sinonimologia" | "synonyms" | "antonyms" | "etymology" | "dictionary" | "epigraph" | "rewrite" | "summarize" | "cognatos" | "translate" | "dict_lookup" | "ai_command" | "analogies" | "comparisons" | "examples" | "counterpoints" | "neoparadigma";
export type ParameterPanelSection = "document" | "sources" | "definitions_cons" | "actions" | "rewriting" | "translation" | "customized_prompts" | "ai_command" | "apps" | "applications";
export type ParameterPanelTargetId = MacroActionId | AiActionId | AppActionId | null;
export type ParameterPanelTarget = { section: ParameterPanelSection; id: ParameterPanelTargetId } | null;
export type MobilePanelId = "left" | "center" | "right" | "editor" | "json";
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
    | "sinonimologia"
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
