import { useCallback, useEffect, useRef, useState } from "react";
import { AlignLeft, BookOpen, FileText, Hash, Languages, ListOrdered, Loader2, Menu, PenLine, RefreshCw, Repeat2, RotateCcw, Search, Settings, Sparkles, Trash2, Type, Upload, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import LeftPanel from "@/components/LeftPanel";
import RightPanel, { AIResponse } from "@/components/RightPanel";
import HtmlEditor from "@/components/HtmlEditor";
import InsertRefBookPanel from "@/components/InsertRefBookPanel";
import InsertRefVerbetePanel from "@/components/InsertRefVerbetePanel";
import BiblioGeralPanel from "@/components/BiblioGeralPanel";
import BiblioExternaPanel from "@/components/BiblioExternaPanel";
import BookSearchPanel, { BOOK_OPTION_LABELS } from "@/components/BookSearchPanel";
import SemanticSearchPanel from "@/components/SemanticSearchPanel";
import VerbeteSearchPanel from "@/components/VerbeteSearchPanel";
import VerbetografiaPanel from "@/components/VerbetografiaPanel";
import Macro1HighlightPanel from "@/components/Macro1HighlightPanel";
import Macro2ManualNumberingPanel from "@/components/Macro2ManualNumberingPanel";
import type { Macro2SpacingMode } from "@/components/Macro2ManualNumberingPanel";
import AiActionParametersPanel from "@/components/AiActionParametersPanel";
import SourcesPanel from "@/components/SourcesPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTextStats } from "@/hooks/useTextStats";
import {
  createBlankDocOnServer,
  biblioExternaApp,
  biblioGeralApp,
  fetchFileContentBuffer,
  fetchFileText,
  healthCheck,
  insertRefBookMacro,
  insertRefVerbeteApp,
  listSemanticIndexesApp,
  listLexicalBooksApp,
  openVerbetografiaTableApp,
  randomPensataApp,
  saveFileText,
  semanticSearchPensatasApp,
  searchLexicalBookApp,
  searchVerbeteApp,
  UploadedFileMeta,
  uploadFileToServer,
} from "@/lib/backend-api";
import { HtmlEditorControlApi } from "@/lib/html-editor-control";
import { buildDocxBlobFromHtml } from "@/lib/docx-export";
import { cleanupConvertedPdfHeaderHtml, parseDocxArrayBuffer, warmupDocxParser } from "@/lib/file-parser";
import { buildHistorySearchCardsMarkdown, type HistorySearchCardMetadata } from "@/lib/historySearchCards";
import { buttonsPrimaryBgClass, cardsBgClass, panelsBgClass, panelsTopMenuBarBgClass, uploadDocBgClass } from "@/styles/backgroundColors";
import { markdownToEditorHtml, normalizeHistoryContentToMarkdown, plainTextToEditorHtml } from "@/lib/markdown";
import {
  executeLLM,
  ChatMessage,
  CHAT_MODEL,
  CHAT_TEMPERATURE,
  CHAT_GPT5_VERBOSITY,
  CHAT_GPT5_EFFORT,
  CHAT_MAX_OUTPUT_TOKENS,
  CHAT_MAX_NUM_RESULTS,
  CHAT_SYSTEM_PROMPT,
  LLM_VECTOR_STORE_LO,
  LLM_VECTOR_STORE_TRANSLATE_RAG,
  buildDefinePrompt,
  buildSynonymsPrompt,
  buildEpigraphPrompt,
  buildRewritePrompt,
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildAiCommandPrompt,
  buildChatPrompt,
  buildVerbeteDefinologiaPrompt,
  buildVerbeteFraseEnfaticaPrompt,
  buildVerbeteSinonimologiaPrompt,
  buildVerbeteFatologiaPrompt,
  buildPensataAnalysisPrompt,
  uploadLlmSourceFiles,
  type UploadedLlmFile,
} from "@/lib/openai";
import { sectionActionButtonClass } from "@/styles/buttonStyles";
import { BOOK_LABELS, type BookCode } from "@/lib/bookCatalog";

type MacroActionId = "macro1" | "macro2";
type AppActionId = "app1" | "app2" | "app3" | "app4" | "app5" | "app6" | "app7" | "app8" | "app9" | "app10" | "app11" | "app12";
type AppPanelScope = "bibliografia" | "busca_termos" | "semantic_search" | "verbetografia";
type AiPanelScope = "actions" | "rewriting" | "translation";
type SemanticIndexOption = {
  id: string;
  label: string;
  sourceFile: string;
  sourceRows: number;
  model: string;
  dimensions: number;
  embeddingDtype: string;
};
type AiActionId = "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "translate" | "ai_command";
type ParameterPanelSection = "document" | "sources" | "actions" | "rewriting" | "translation" | "apps" | "settings";
type SettingsPanelId = "llm" | "general";
type ParameterPanelTarget =
  | { section: "document"; id: MacroActionId | null }
  | { section: "sources"; id: null }
  | { section: "actions"; id: AiActionId | null }
  | { section: "rewriting"; id: AiActionId | null }
  | { section: "translation"; id: AiActionId | null }
  | { section: "apps"; id: AppActionId | null }
  | { section: "settings"; id: SettingsPanelId }
  | null;
type MobilePanelId = "left" | "center" | "right" | "editor" | "json";
type SourcesPanelView = "books" | "vector-store" | "upload" | null;
type BackendStatus = "checking" | "ready" | "missing_openai_key" | "unavailable";
type ParameterPanelHeaderMeta = { title: string; description: string };
type SelectOption = { id: string; label: string };
const SEMANTIC_TITLE_METADATA_KEYS = ["title", "titulo", "verbete", "tema", "cabecalho", "heading"];
const SEMANTIC_NUMBER_METADATA_KEYS = ["number", "numero", "paragraph_number", "index", "ordem", "id"];

const BOOK_SOURCE = [

  // ------------------------------------------------------------------------------
  // Livros & Tratados
  // ------------------------------------------------------------------------------
  { label: "Básicos: Nossa Evolução, O que é a Conscienciologia", id: "vs_69bb0db9d3548191adb0eeb435c95f54" },
  { label: "Conscienciograma", id: "vs_69bb10fdfa208191bdad6c97ecc48c57" },

  { label: "Manuais: Tenepes, Proéxis, Dupla", id: "vs_69bb0cf2a1b881918932390d13f8d6da" },
  { label: "700 Experimentos da Conscienciologia", id: "vs_69bb0d959ffc819189a3c24f2ebb2d1c" },
 
  { label: "Projeciologia", id: "vs_69bb0e0c6404819198424a86b887358f" },
  { label: "Homo sapiens: HSR, HSP", id: "vs_69bb0e57ec1c8191bb9da3760410d225" },
 
  { label: "Dicionário de Argumentos da Conscienciologia (DAC)", id: "vs_69bb116a458c8191bb52fad036476e8a" },
  { label: "Léxico de Ortopensatas (LO)", id: "vs_69bb11928ff08191b24e3e35a93b4d5b" },

  // ------------------------------------------------------------------------------
] as const;

const VECTOR_STORES_SOURCE = [
  { label: "WVBooks", id: "vs_6912908250e4819197e23fe725e04fae" },
  { label: "Verbetes Waldo Vieira", id: "vs_699d09de9ca48191b63fbbd4d195a696" },

  { label: "Blog Tert", id: "vs_6928989410dc8191bd9a838eb38876b7" },
  { label: "Mini", id: "vs_692890daa4248191afd3cf04a0c51ad5" },
  { label: "EduNotes", id: "vs_68f195fdeda08191815ec795ba1f57ba" },
  
  { label: "Revistas", id: "vs_69289c64b8308191806dcdd5856426d9" },
  { label: "Autores", id: "vs_692894b455188191a900282a80e16a44" },
] as const;

const DEFAULT_BOOK_SOURCE_ID = VECTOR_STORES_SOURCE.find((item) => item.label.toUpperCase() === "WVBOOKS")?.id ?? "";

const ACTION_PANEL_BUTTONS_BY_SCOPE: Record<AiPanelScope, AiActionId[]> = {
  actions: ["define", "synonyms", "pensatas"],
  rewriting: ["epigraph", "rewrite", "summarize"],
  translation: ["translate"],
};
const APP_PANEL_BUTTONS_BY_SCOPE: Record<AppPanelScope, AppActionId[]> = {
  bibliografia: ["app1", "app2", "app3", "app6"],
  busca_termos: ["app4", "app5"],
  semantic_search: ["app12"],
  verbetografia: ["app8", "app9", "app10", "app11"],
};
const MACRO_PANEL_BUTTONS: MacroActionId[] = ["macro1", "macro2"];
const ACTION_PANEL_ICONS: Record<AiActionId, typeof BookOpen> = {
  define: BookOpen,
  synonyms: Repeat2,
  epigraph: Search,
  pensatas: Search,
  rewrite: PenLine,
  summarize: FileText,
  translate: Languages,
  ai_command: PenLine,
};
const APP_PANEL_ICONS: Record<AppActionId, typeof BookOpen> = {
  app1: BookOpen,
  app2: Repeat2,
  app3: Search,
  app4: Search,
  app5: Search,
  app6: Search,
  app12: Search,
  app7: FileText,
  app8: BookOpen,
  app11: PenLine,
  app9: Repeat2,
  app10: ListOrdered,
};
const MACRO_PANEL_ICONS: Record<MacroActionId, typeof BookOpen> = {
  macro1: BookOpen,
  macro2: ListOrdered,
};


// Defaults visuais do painel de LOGS LLM.
const LLM_LOG_FONT_MIN = 0.5;
const LLM_LOG_FONT_MAX = 1.0;
const LLM_LOG_FONT_STEP = 0.05;
const LLM_SETTINGS_STORAGE_KEY = "llm_settings_v1";
const AI_ACTIONS_LLM_SETTINGS_STORAGE_KEY = "ai_actions_llm_settings_v1";
const BIBLIO_EXTERNA_LLM_SETTINGS_STORAGE_KEY = "biblio_externa_llm_settings_v1";
const GENERAL_SETTINGS_STORAGE_KEY = "general_settings_v1";
const BIBLIO_EXTERNA_DEFAULT_SYSTEM_PROMPT = `Você é um assistente especializado em reconstrução de referências bibliográficas acadêmicas.
Sua função é identificar e reconstruir referências completas a partir de uma string bibliográfica livre fornecida pelo usuário.

A string de entrada pode conter:
- apenas parte do título
- nome parcial do autor
- sobrenome incompleto
- ano aproximado
- erros de digitação
- ordem aleatória de elementos

Identificação da obra:
- Utilize raciocínio bibliográfico para identificar a obra mais provável.

Caso existam múltiplas correspondências plausíveis:
- retorne no máximo 3 referências
- ordenadas da maior para a menor probabilidade de correspondência.

Normalização da saída
A saída deve sempre seguir EXATAMENTE o formato:
- **Sobrenome**, Nome; ***Título da obra***; informações adicionais separadas por ";"; ano.
- Não inclua explicações, comentários ou texto adicional.
- Retorne apenas as referências formatadas.

Exemplo
Entrada:
Tocci Digital Systems Principles 2011
Saída:
**Tocci**, Ronald J.; ***Digital Systems: Principles and Applications***; livro; brochura; 912 p.; 11ª ed.; Pearson; Upper Saddle River, NJ; 2011.`;
const DEFAULT_LOG_FONT_SIZE_PX = 9;
const DEFAULT_LOG_LINE_HEIGHT_RATIO = 1.1;
// Câmbio base (USD -> BRL) para estimativa de custo.
const DEFAULT_DOLLAR_TOKEN = 5.5;

const parameterAppMeta: Record<AppActionId, { title: string; description: string }> = {
  app1: { title: "Bibliografia de Livros", description: "Monta Bibliografia das obras de Waldo Vieira." },
  app2: { title: "Bibliografia de Verbetes", description: "Monta Bibliografia de verbetes." },
  app3: { title: "Bibliografia Autores", description: "Monta bibliografia de autores diversos." },
  app4: { title: "Busca em Livros", description: "Busca termos nos livros de Waldo Vieira." },
  app5: { title: "Busca em Verbetes", description: "Busca termos nos verbetes em geral." },
  app6: { title: "Bibliografia Externa", description: "Busca referências externas na internet." },
  app12: { title: "Semantic Search", description: "Busca semântica nas bases vetoriais disponíveis." },
  app7: { title: "Tabela Automatizada", description: "Abre tabela Word e editor HTML." },
  app8: { title: "Definologia", description: "Gera Definologia do verbete." },
  app9: { title: "Sinonimologia", description: "Gera Sinonimologia do verbete." },
  app10: { title: "Fatologia", description: "Gera Fatologia do verbete." },
  app11: { title: "Frase Enfática", description: "Gera Frase Enfática do verbete." },
};
const parameterMacroMeta: Record<MacroActionId, { title: string; description: string }> = {
  macro1: { title: "Highlight", description: "Destaca termos no documento." },
  macro2: { title: "Numerar lista", description: "Aplica numeração manual à lista de itens." },
};
const parameterActionMeta: Record<AiActionId, { title: string; description: string }> = {
  define: { title: "Definir", description: "Definologia conscienciológica." },
  synonyms: { title: "Sinonímia", description: "Sinonimologia." },
  epigraph: { title: "Epígrafe", description: "Sugere epígrafe." },
  rewrite: { title: "Reescrever", description: "Melhora clareza e fluidez." },
  summarize: { title: "Resumir", description: "Síntese concisa." },
  pensatas: { title: "Pensatas LO", description: "Pensatas afins." },
  translate: { title: "Traduzir", description: "Traduz para o idioma selecionado." },
  ai_command: { title: "Comando IA", description: "Envia uma query livre para a LLM." },
};
const getAiPanelScopeByAction = (id: AiActionId): AiPanelScope =>
  ACTION_PANEL_BUTTONS_BY_SCOPE.rewriting.includes(id)
    ? "rewriting"
    : ACTION_PANEL_BUTTONS_BY_SCOPE.translation.includes(id)
      ? "translation"
      : "actions";

const getParameterPanelHeaderMeta = (
  target: ParameterPanelTarget,
  appScope: AppPanelScope | null,
): ParameterPanelHeaderMeta => {
  if (!target) return { title: "Parameters", description: "" };

  switch (target.section) {
    case "document":
      return { title: "Documento", description: "Novo, abrir e editar documento" };
    case "sources":
      return { title: "Fontes", description: "Livros, vector store e arquivos" };
    case "actions":
      if (target.id === "ai_command") return { title: "Comando IA", description: "Envia uma query livre para a LLM" };
      return { title: "Termos & Conceitos", description: "Definir e listar sinonimos" };
    case "rewriting":
      return { title: "Paragrafos & Trechos", description: "Reescrever, resumir e criar epigrafe" };
    case "translation":
      return { title: "Traducao & Dicionario", description: "Traduzir texto e consultar termos" };
    case "settings":
      return target.id === "general"
        ? { title: "Geral", description: "Preferencias da interface" }
        : { title: "LLM", description: "Modelo e parametros" };
    case "apps":
      if (target.id === "app12") return { title: "Semantic Search", description: "Busca por afinidade semantica" };
      if (target.id === "app7") return { title: "Tabela Automatizada", description: "Abre tabela Word e editor HTML" };
      if (appScope === "busca_termos") return { title: "Lexical Search", description: "Busca lexica nos livros e verbetes" };
      if (appScope === "verbetografia") return { title: "Verbetografia IA", description: "Tabela automatizada de verbete" };
      return { title: "Bibliografia", description: "Busca as referencias bibliograficas" };
    default:
      return { title: "Parameters", description: "" };
  }
};

const normalizeIdList = (values: string[] | undefined): string[] =>
  [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];

const sidePanelClass = panelsBgClass;
const PANEL_SIZES = {
  left: { default: 10, min: 10, max: 20 },
  parameter: { default: 12, min: 12, max: 20 },
  editor: { default: 50, min: 20, max: 70 },
  right: { default: 50, min: 20, max: 70 },
} as const;
const MACRO1_HIGHLIGHT_COLORS = [
  { id: "yellow", label: "Amarelo", swatch: "#fef08a" },
  { id: "green", label: "Verde", swatch: "#86efac" },
  { id: "cyan", label: "Ciano", swatch: "#a5f3fc" },
  { id: "magenta", label: "Magenta", swatch: "#f5d0fe" },
  { id: "blue", label: "Azul", swatch: "#bfdbfe" },
  { id: "red", label: "Vermelho", swatch: "#fecaca" },
] as const;
const TRANSLATE_LANGUAGE_OPTIONS = [
  { value: "Ingles", label: "Ingles" },
  { value: "Espanhol", label: "Espanhol" },
  { value: "Frances", label: "Frances" },
  { value: "Alemao", label: "Alemao" },
  { value: "Italiano", label: "Italiano" },
  { value: "Portugues", label: "Portugues" },
  { value: "Mandarim", label: "Mandarim" },
  { value: "Japones", label: "Japones" },
  { value: "Arabe", label: "Arabe" },
  { value: "Russo", label: "Russo" },
] as const;

// Valor padrão para o campo "Máximo de resultados" da Pesquisa em Livros.
// Ajuste aqui para alterar facilmente o default no frontend.
const DEFAULT_BOOK_SEARCH_MAX_RESULTS = 10;

const PDF_HEADER_SIGNATURE_RE = /enciclop(?:é|e)dia\s+da\s+conscienciologia/i;

const CHAT_EDITOR_CONTEXT_MAX_CHARS = 10000;


const Index = () => {
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionText, setActionText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [documentText, setDocumentText] = useState("");
  const [currentFileName, setCurrentFileName] = useState("");
  const [currentFileConvertedFromPdf, setCurrentFileConvertedFromPdf] = useState(false);
  const [documentPageCount, setDocumentPageCount] = useState<number | null>(null);
  const [documentParagraphCount, setDocumentParagraphCount] = useState<number | null>(null);
  const [documentWordCount, setDocumentWordCount] = useState<number | null>(null);
  const [documentSymbolCount, setDocumentSymbolCount] = useState<number | null>(null);
  const [documentSymbolWithSpacesCount, setDocumentSymbolWithSpacesCount] = useState<number | null>(null);
  const [currentFileId, setCurrentFileId] = useState("");
  const [statsKey, setStatsKey] = useState(0);
  const [openedDocumentVersion, setOpenedDocumentVersion] = useState(0);
  const [editorContentHtml, setEditorContentHtml] = useState("<p></p>");
  const [isOpeningDocument, setIsOpeningDocument] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [htmlEditorControlApi, setHtmlEditorControlApi] = useState<HtmlEditorControlApi | null>(null);
  const [parameterPanelTarget, setParameterPanelTarget] = useState<ParameterPanelTarget>(null);
  const [selectedRefBook, setSelectedRefBook] = useState<BookCode>("LO");
  const [refBookPages, setRefBookPages] = useState("");
  const [isRunningInsertRefBook, setIsRunningInsertRefBook] = useState(false);
  const [verbeteInput, setVerbeteInput] = useState("");
  const [isRunningInsertRefVerbete, setIsRunningInsertRefVerbete] = useState(false);
  const [biblioGeralAuthor, setBiblioGeralAuthor] = useState("");
  const [biblioGeralTitle, setBiblioGeralTitle] = useState("");
  const [biblioGeralYear, setBiblioGeralYear] = useState("");
  const [biblioGeralExtra, setBiblioGeralExtra] = useState("");
  const [isRunningBiblioGeral, setIsRunningBiblioGeral] = useState(false);
  const [biblioExternaAuthor, setBiblioExternaAuthor] = useState("");
  const [biblioExternaTitle, setBiblioExternaTitle] = useState("");
  const [biblioExternaYear, setBiblioExternaYear] = useState("");
  const [biblioExternaJournal, setBiblioExternaJournal] = useState("");
  const [biblioExternaPublisher, setBiblioExternaPublisher] = useState("");
  const [biblioExternaIdentifier, setBiblioExternaIdentifier] = useState("");
  const [biblioExternaExtra, setBiblioExternaExtra] = useState("");
  const [biblioExternaFreeText, setBiblioExternaFreeText] = useState("");
  const [isRunningBiblioExterna, setIsRunningBiblioExterna] = useState(false);
  const [lexicalBooks, setLexicalBooks] = useState<string[]>([]);
  const [selectedLexicalBook, setSelectedLexicalBook] = useState<string>("LO");
  const [lexicalTerm, setLexicalTerm] = useState("");
  const [lexicalMaxResults, setLexicalMaxResults] = useState(DEFAULT_BOOK_SEARCH_MAX_RESULTS);
  const [isRunningLexicalSearch, setIsRunningLexicalSearch] = useState(false);
  const [semanticSearchQuery, setSemanticSearchQuery] = useState("");
  const [semanticSearchMaxResults, setSemanticSearchMaxResults] = useState(DEFAULT_BOOK_SEARCH_MAX_RESULTS);
  const [semanticSearchIndexes, setSemanticSearchIndexes] = useState<SemanticIndexOption[]>([]);
  const [selectedSemanticSearchIndexId, setSelectedSemanticSearchIndexId] = useState("");
  const [isLoadingSemanticSearchIndexes, setIsLoadingSemanticSearchIndexes] = useState(false);
  const [isRunningSemanticSearch, setIsRunningSemanticSearch] = useState(false);
  const [verbeteSearchAuthor, setVerbeteSearchAuthor] = useState("");
  const [verbeteSearchTitle, setVerbeteSearchTitle] = useState("");
  const [verbeteSearchArea, setVerbeteSearchArea] = useState("");
  const [verbeteSearchText, setVerbeteSearchText] = useState("");
  const [verbeteSearchMaxResults, setVerbeteSearchMaxResults] = useState(DEFAULT_BOOK_SEARCH_MAX_RESULTS);
  const [isRunningVerbeteSearch, setIsRunningVerbeteSearch] = useState(false);
  const [verbetografiaTitle, setVerbetografiaTitle] = useState("");
  const [verbetografiaSpecialty, setVerbetografiaSpecialty] = useState("");
  const [isRunningVerbetografiaOpenTable, setIsRunningVerbetografiaOpenTable] = useState(false);
  const [isRunningVerbeteDefinologia, setIsRunningVerbeteDefinologia] = useState(false);
  const [isRunningVerbeteFraseEnfatica, setIsRunningVerbeteFraseEnfatica] = useState(false);
  const [isRunningVerbeteSinonimologia, setIsRunningVerbeteSinonimologia] = useState(false);
  const [isRunningVerbeteFatologia, setIsRunningVerbeteFatologia] = useState(false);
  const [appPanelScope, setAppPanelScope] = useState<AppPanelScope | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [translateLanguage, setTranslateLanguage] = useState<(typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"]>("Ingles");
  const [aiCommandQuery, setAiCommandQuery] = useState("");
  const [macro1Term, setMacro1Term] = useState("");
  const [macro1ColorId, setMacro1ColorId] = useState<(typeof MACRO1_HIGHLIGHT_COLORS)[number]["id"]>("yellow");
  const [macro1PredictedMatches, setMacro1PredictedMatches] = useState<number | null>(null);
  const [isCountingMacro1Matches, setIsCountingMacro1Matches] = useState(false);
  const [macro2SpacingMode, setMacro2SpacingMode] = useState<Macro2SpacingMode>("nbsp_double");
  const [llmModel, setLlmModel] = useState(CHAT_MODEL);
  const [llmTemperature, setLlmTemperature] = useState(CHAT_TEMPERATURE);
  const [llmMaxOutputTokens, setLlmMaxOutputTokens] = useState<number>(CHAT_MAX_OUTPUT_TOKENS ?? 500);
  const [llmMaxNumResults, setLlmMaxNumResults] = useState<number>(CHAT_MAX_NUM_RESULTS);
  const [llmEditorContextMaxChars, setLlmEditorContextMaxChars] = useState<number>(CHAT_EDITOR_CONTEXT_MAX_CHARS);
  const [llmVerbosity, setLlmVerbosity] = useState(CHAT_GPT5_VERBOSITY ?? "");
  const [llmEffort, setLlmEffort] = useState(CHAT_GPT5_EFFORT ?? "");
  const [llmSystemPrompt, setLlmSystemPrompt] = useState(CHAT_SYSTEM_PROMPT ?? "");
  const [activeLlmConfigPanel, setActiveLlmConfigPanel] = useState<"chat" | "ai_actions" | "biblio_externa" | null>(null);
  const [aiActionsLlmModel, setAiActionsLlmModel] = useState(CHAT_MODEL);
  const [aiActionsLlmTemperature, setAiActionsLlmTemperature] = useState(CHAT_TEMPERATURE);
  const [aiActionsLlmMaxOutputTokens, setAiActionsLlmMaxOutputTokens] = useState<number>(CHAT_MAX_OUTPUT_TOKENS ?? 500);
  const [aiActionsLlmVerbosity, setAiActionsLlmVerbosity] = useState(CHAT_GPT5_VERBOSITY ?? "");
  const [aiActionsLlmEffort, setAiActionsLlmEffort] = useState(CHAT_GPT5_EFFORT ?? "");
  const [aiActionsLlmSystemPrompt, setAiActionsLlmSystemPrompt] = useState(CHAT_SYSTEM_PROMPT ?? "");
  const [aiActionsSelectedVectorStoreIds, setAiActionsSelectedVectorStoreIds] = useState<string[]>([]);
  const [aiActionsSelectedInputFileIds, setAiActionsSelectedInputFileIds] = useState<string[]>([]);
  const [biblioExternaLlmModel, setBiblioExternaLlmModel] = useState("gpt-5.4");
  const [biblioExternaLlmTemperature, setBiblioExternaLlmTemperature] = useState<number>(0);
  const [biblioExternaLlmMaxOutputTokens, setBiblioExternaLlmMaxOutputTokens] = useState<number>(500);
  const [biblioExternaLlmVerbosity, setBiblioExternaLlmVerbosity] = useState("low");
  const [biblioExternaLlmEffort, setBiblioExternaLlmEffort] = useState("none");
  const [biblioExternaLlmSystemPrompt, setBiblioExternaLlmSystemPrompt] = useState(BIBLIO_EXTERNA_DEFAULT_SYSTEM_PROMPT);
  const [chatPreviousResponseId, setChatPreviousResponseId] = useState<string | null>(null);
  const [isJsonLogPanelOpen, setIsJsonLogPanelOpen] = useState(false);
  const [llmLogs, setLlmLogs] = useState<Array<{ id: string; at: string; request: unknown; response?: unknown; error?: string }>>([]);
  const [llmSessionLogs, setLlmSessionLogs] = useState<Array<{ id: string; at: string; request: unknown; response?: unknown; error?: string }>>([]);
  const LLM_LOG_FONT_DEFAULT = Number((DEFAULT_LOG_FONT_SIZE_PX / 11).toFixed(2));
  const [llmLogFontScale, setLlmLogFontScale] = useState(LLM_LOG_FONT_DEFAULT);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanelId>("left");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);
  const [enableHistoryNumbering, setEnableHistoryNumbering] = useState(true);
  const [enableHistoryReferences, setEnableHistoryReferences] = useState(true);
  const [isImportingDocument, setIsImportingDocument] = useState(false);
  const [selectedImportFileName, setSelectedImportFileName] = useState("");
  const [sourcesPanelView, setSourcesPanelView] = useState<SourcesPanelView>(null);
  const [selectedBookSourceIds, setSelectedBookSourceIds] = useState<string[]>(() => (DEFAULT_BOOK_SOURCE_ID ? [DEFAULT_BOOK_SOURCE_ID] : []));
  const [uploadedChatFiles, setUploadedChatFiles] = useState<UploadedLlmFile[]>([]);
  const [isUploadingChatFiles, setIsUploadingChatFiles] = useState(false);
  const [includeEditorContextInLlm, setIncludeEditorContextInLlm] = useState(true);
  const saveTimerRef = useRef<number | null>(null);
  const historyNoticeTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiActionsUploadInputRef = useRef<HTMLInputElement>(null);
  const htmlEditorControlApiRef = useRef<HtmlEditorControlApi | null>(null);
  const llmConfigRef = useRef({
    model: CHAT_MODEL,
    temperature: CHAT_TEMPERATURE,
    maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS as number | undefined,
    maxNumResults: CHAT_MAX_NUM_RESULTS,
    editorContextMaxChars: CHAT_EDITOR_CONTEXT_MAX_CHARS,
    gpt5Verbosity: CHAT_GPT5_VERBOSITY as string | undefined,
    gpt5Effort: CHAT_GPT5_EFFORT as string | undefined,
    systemPrompt: CHAT_SYSTEM_PROMPT as string | undefined,
  });
  const aiActionsLlmConfigRef = useRef({
    model: CHAT_MODEL,
    temperature: CHAT_TEMPERATURE,
    maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS as number | undefined,
    gpt5Verbosity: CHAT_GPT5_VERBOSITY as string | undefined,
    gpt5Effort: CHAT_GPT5_EFFORT as string | undefined,
    systemPrompt: CHAT_SYSTEM_PROMPT as string | undefined,
    vectorStoreIds: [] as string[],
    inputFileIds: [] as string[],
  });
  const currentFileIdRef = useRef("");
  const macro1CountRequestIdRef = useRef(0);
  const previousHasEditorPanelRef = useRef(false);
  const showHistoryNotice = useCallback((message: string) => {
    const trimmed = (message || "").trim();
    if (!trimmed) return;
    setHistoryNotice(trimmed);
    if (historyNoticeTimeoutRef.current !== null) {
      window.clearTimeout(historyNoticeTimeoutRef.current);
    }
    historyNoticeTimeoutRef.current = window.setTimeout(() => {
      setHistoryNotice(null);
      historyNoticeTimeoutRef.current = null;
    }, 4500);
  }, []);
  const toast = useRef({
    error: (message: string) => showHistoryNotice(message),
    info: (message: string) => showHistoryNotice(message),
    success: (message: string) => showHistoryNotice(message),
    warning: (message: string) => showHistoryNotice(message),
  }).current;

  useEffect(() => {
    return () => {
      if (historyNoticeTimeoutRef.current !== null) {
        window.clearTimeout(historyNoticeTimeoutRef.current);
      }
    };
  }, []);
  

  const stats = useTextStats(
    documentText || actionText,
    statsKey,
    documentPageCount,
    documentParagraphCount,
    documentWordCount,
    documentSymbolCount,
    documentSymbolWithSpacesCount,
  );

  const refreshHealth = useCallback(() => {
    healthCheck()
      .then((h) => setBackendStatus(h.openaiConfigured ? "ready" : "missing_openai_key"))
      .catch(() => setBackendStatus("unavailable"));
  }, []);

  const openAiReady = backendStatus === "ready";

  const backendNotReadyMessage = useCallback(() => {
    if (backendStatus === "missing_openai_key") {
      return "Backend sem OPENAI_API_KEY. Configure no servidor.";
    }
    if (backendStatus === "unavailable") {
      return "Backend indisponivel em http://localhost:8787. Inicie o servidor.";
    }
    return "Backend ainda verificando disponibilidade.";
  }, [backendStatus]);

  const isChatConfigOpen = activeLlmConfigPanel === "chat";
  const isAiActionsConfigOpen = activeLlmConfigPanel === "ai_actions";
  const isBiblioExternaConfigOpen = activeLlmConfigPanel === "biblio_externa";
  const toggleLlmConfigPanel = useCallback((panel: "chat" | "ai_actions" | "biblio_externa") => {
    setActiveLlmConfigPanel((prev) => (prev === panel ? null : panel));
  }, []);

  const aiActionVectorStoreOptions: SelectOption[] = (() => {
    const items: SelectOption[] = [...BOOK_SOURCE, ...VECTOR_STORES_SOURCE].map((item) => ({ id: item.id, label: item.label }));
    if (LLM_VECTOR_STORE_TRANSLATE_RAG?.trim()) {
      items.push({ id: LLM_VECTOR_STORE_TRANSLATE_RAG.trim(), label: "Translate RAG" });
    }
    const seen = new Set<string>();
    return items.filter((item) => {
      const id = item.id.trim();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  })();

  const getGlobalVectorStoreIds = useCallback(() => {
    return [...new Set(selectedBookSourceIds.map((id) => id.trim()).filter(Boolean))];
  }, [selectedBookSourceIds]);

  useEffect(() => {
    currentFileIdRef.current = currentFileId;
  }, [currentFileId]);

  useEffect(() => {
    llmConfigRef.current = {
      model: llmModel,
      temperature: llmTemperature,
      maxOutputTokens: llmMaxOutputTokens,
      maxNumResults: llmMaxNumResults,
      editorContextMaxChars: llmEditorContextMaxChars,
      gpt5Verbosity: llmVerbosity || undefined,
      gpt5Effort: llmEffort || undefined,
      systemPrompt: llmSystemPrompt.trim() || CHAT_SYSTEM_PROMPT,
    };
  }, [llmEditorContextMaxChars, llmEffort, llmMaxNumResults, llmMaxOutputTokens, llmModel, llmSystemPrompt, llmTemperature, llmVerbosity]);

  useEffect(() => {
    aiActionsLlmConfigRef.current = {
      model: aiActionsLlmModel,
      temperature: aiActionsLlmTemperature,
      maxOutputTokens: aiActionsLlmMaxOutputTokens,
      gpt5Verbosity: aiActionsLlmVerbosity || undefined,
      gpt5Effort: aiActionsLlmEffort || undefined,
      systemPrompt: aiActionsLlmSystemPrompt.trim() || CHAT_SYSTEM_PROMPT,
      vectorStoreIds: normalizeIdList(aiActionsSelectedVectorStoreIds),
      inputFileIds: normalizeIdList(aiActionsSelectedInputFileIds),
    };
  }, [aiActionsLlmEffort, aiActionsLlmMaxOutputTokens, aiActionsLlmModel, aiActionsLlmSystemPrompt, aiActionsLlmTemperature, aiActionsLlmVerbosity, aiActionsSelectedInputFileIds, aiActionsSelectedVectorStoreIds]);

  useEffect(() => {
    setAiActionsSelectedInputFileIds(normalizeIdList(uploadedChatFiles.map((file) => file.id)));
  }, [uploadedChatFiles]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LLM_SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        model: string;
        temperature: number;
        maxOutputTokens: number;
        maxNumResults: number;
        editorContextMaxChars: number;
        gpt5Verbosity: string;
        gpt5Effort: string;
        systemPrompt: string;
      }>;
      if (typeof parsed.model === "string" && parsed.model.trim()) setLlmModel(parsed.model.trim());
      if (typeof parsed.temperature === "number" && Number.isFinite(parsed.temperature)) setLlmTemperature(Math.max(0, Math.min(parsed.temperature, 2)));
      if (typeof parsed.maxOutputTokens === "number" && Number.isFinite(parsed.maxOutputTokens)) setLlmMaxOutputTokens(Math.max(1, Math.floor(parsed.maxOutputTokens)));
      if (typeof parsed.maxNumResults === "number" && Number.isFinite(parsed.maxNumResults)) setLlmMaxNumResults(Math.max(1, Math.min(Math.floor(parsed.maxNumResults), 20)));
      if (typeof parsed.editorContextMaxChars === "number" && Number.isFinite(parsed.editorContextMaxChars)) setLlmEditorContextMaxChars(Math.max(500, Math.floor(parsed.editorContextMaxChars)));
      if (typeof parsed.gpt5Verbosity === "string") setLlmVerbosity(parsed.gpt5Verbosity);
      if (typeof parsed.gpt5Effort === "string") setLlmEffort(parsed.gpt5Effort);
      if (typeof parsed.systemPrompt === "string") setLlmSystemPrompt(parsed.systemPrompt);
    } catch {
      // Ignora storage inválido e mantém defaults.
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AI_ACTIONS_LLM_SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        model: string;
        temperature: number;
        maxOutputTokens: number;
        gpt5Verbosity: string;
        gpt5Effort: string;
        systemPrompt: string;
        vectorStoreIds: string[];
        inputFileIds: string[];
      }>;
      if (typeof parsed.model === "string" && parsed.model.trim()) setAiActionsLlmModel(parsed.model.trim());
      if (typeof parsed.temperature === "number" && Number.isFinite(parsed.temperature)) setAiActionsLlmTemperature(Math.max(0, Math.min(parsed.temperature, 2)));
      if (typeof parsed.maxOutputTokens === "number" && Number.isFinite(parsed.maxOutputTokens)) setAiActionsLlmMaxOutputTokens(Math.max(1, Math.floor(parsed.maxOutputTokens)));
      if (typeof parsed.gpt5Verbosity === "string") setAiActionsLlmVerbosity(parsed.gpt5Verbosity);
      if (typeof parsed.gpt5Effort === "string") setAiActionsLlmEffort(parsed.gpt5Effort);
      if (typeof parsed.systemPrompt === "string") setAiActionsLlmSystemPrompt(parsed.systemPrompt);
      if (Array.isArray(parsed.vectorStoreIds)) setAiActionsSelectedVectorStoreIds(normalizeIdList(parsed.vectorStoreIds.filter((value): value is string => typeof value === "string")));
      if (Array.isArray(parsed.inputFileIds)) setAiActionsSelectedInputFileIds(normalizeIdList(parsed.inputFileIds.filter((value): value is string => typeof value === "string")));
    } catch {
      // Ignora storage inválido e mantém defaults.
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GENERAL_SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{ enableHistoryNumbering: boolean; enableHistoryReferences: boolean }>;
      if (typeof parsed.enableHistoryNumbering === "boolean") setEnableHistoryNumbering(parsed.enableHistoryNumbering);
      if (typeof parsed.enableHistoryReferences === "boolean") setEnableHistoryReferences(parsed.enableHistoryReferences);
    } catch {
      // Ignora storage invalido e mantem defaults.
    }
  }, []);

  useEffect(() => {
    const safeTemperature = Number.isFinite(llmTemperature) ? Math.max(0, Math.min(llmTemperature, 2)) : CHAT_TEMPERATURE;
    const safeMaxOutputTokens = Number.isFinite(llmMaxOutputTokens) ? Math.max(1, Math.floor(llmMaxOutputTokens)) : (CHAT_MAX_OUTPUT_TOKENS ?? 500);
    const safeMaxNumResults = Number.isFinite(llmMaxNumResults) ? Math.max(1, Math.min(Math.floor(llmMaxNumResults), 20)) : CHAT_MAX_NUM_RESULTS;
    const safeEditorContextMaxChars = Number.isFinite(llmEditorContextMaxChars) ? Math.max(500, Math.floor(llmEditorContextMaxChars)) : CHAT_EDITOR_CONTEXT_MAX_CHARS;
    const payload = {
      model: llmModel,
      temperature: safeTemperature,
      maxOutputTokens: safeMaxOutputTokens,
      maxNumResults: safeMaxNumResults,
      editorContextMaxChars: safeEditorContextMaxChars,
      gpt5Verbosity: llmVerbosity,
      gpt5Effort: llmEffort,
      systemPrompt: llmSystemPrompt,
    };
    window.localStorage.setItem(LLM_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  }, [llmEditorContextMaxChars, llmEffort, llmMaxNumResults, llmMaxOutputTokens, llmModel, llmSystemPrompt, llmTemperature, llmVerbosity]);

  useEffect(() => {
    const payload = {
      model: aiActionsLlmModel,
      temperature: Number.isFinite(aiActionsLlmTemperature) ? Math.max(0, Math.min(aiActionsLlmTemperature, 2)) : CHAT_TEMPERATURE,
      maxOutputTokens: Number.isFinite(aiActionsLlmMaxOutputTokens) ? Math.max(1, Math.floor(aiActionsLlmMaxOutputTokens)) : (CHAT_MAX_OUTPUT_TOKENS ?? 500),
      gpt5Verbosity: aiActionsLlmVerbosity,
      gpt5Effort: aiActionsLlmEffort,
      systemPrompt: aiActionsLlmSystemPrompt,
      vectorStoreIds: normalizeIdList(aiActionsSelectedVectorStoreIds),
      inputFileIds: normalizeIdList(aiActionsSelectedInputFileIds),
    };
    window.localStorage.setItem(AI_ACTIONS_LLM_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  }, [aiActionsLlmEffort, aiActionsLlmMaxOutputTokens, aiActionsLlmModel, aiActionsLlmSystemPrompt, aiActionsLlmTemperature, aiActionsLlmVerbosity, aiActionsSelectedInputFileIds, aiActionsSelectedVectorStoreIds]);

  useEffect(() => {
    window.localStorage.setItem(GENERAL_SETTINGS_STORAGE_KEY, JSON.stringify({ enableHistoryNumbering, enableHistoryReferences }));
  }, [enableHistoryNumbering, enableHistoryReferences]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BIBLIO_EXTERNA_LLM_SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        model: string;
        temperature: number;
        maxOutputTokens: number;
        gpt5Verbosity: string;
        gpt5Effort: string;
        systemPrompt: string;
      }>;
      if (typeof parsed.model === "string" && parsed.model.trim()) setBiblioExternaLlmModel(parsed.model.trim());
      if (typeof parsed.temperature === "number" && Number.isFinite(parsed.temperature)) setBiblioExternaLlmTemperature(Math.max(0, Math.min(parsed.temperature, 2)));
      if (typeof parsed.maxOutputTokens === "number" && Number.isFinite(parsed.maxOutputTokens)) setBiblioExternaLlmMaxOutputTokens(Math.max(1, Math.floor(parsed.maxOutputTokens)));
      if (typeof parsed.gpt5Verbosity === "string") setBiblioExternaLlmVerbosity(parsed.gpt5Verbosity);
      if (typeof parsed.gpt5Effort === "string") setBiblioExternaLlmEffort(parsed.gpt5Effort);
      if (typeof parsed.systemPrompt === "string" && parsed.systemPrompt.trim()) {
        setBiblioExternaLlmSystemPrompt(parsed.systemPrompt);
      } else {
        setBiblioExternaLlmSystemPrompt(BIBLIO_EXTERNA_DEFAULT_SYSTEM_PROMPT);
      }
    } catch {
      // Ignora storage inválido.
    }
  }, []);

  useEffect(() => {
    const payload = {
      model: biblioExternaLlmModel,
      temperature: Number.isFinite(biblioExternaLlmTemperature) ? Math.max(0, Math.min(biblioExternaLlmTemperature, 2)) : 0,
      maxOutputTokens: Number.isFinite(biblioExternaLlmMaxOutputTokens) ? Math.max(1, Math.floor(biblioExternaLlmMaxOutputTokens)) : 500,
      gpt5Verbosity: biblioExternaLlmVerbosity,
      gpt5Effort: biblioExternaLlmEffort,
      systemPrompt: biblioExternaLlmSystemPrompt,
    };
    window.localStorage.setItem(BIBLIO_EXTERNA_LLM_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  }, [biblioExternaLlmEffort, biblioExternaLlmMaxOutputTokens, biblioExternaLlmModel, biblioExternaLlmSystemPrompt, biblioExternaLlmTemperature, biblioExternaLlmVerbosity]);

  useEffect(() => {
    refreshHealth();
    const intervalId = window.setInterval(refreshHealth, 15000);
    window.addEventListener("focus", refreshHealth);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshHealth);
    };
  }, [refreshHealth]);

  useEffect(() => {
    void warmupDocxParser();
  }, []);

  const refreshDocumentText = useCallback(async (fileId: string) => {
    if (!fileId) {
      setDocumentText("");
      setEditorContentHtml("<p></p>");
      setDocumentPageCount(null);
      setDocumentParagraphCount(null);
      setDocumentWordCount(null);
      setDocumentSymbolCount(null);
      setDocumentSymbolWithSpacesCount(null);
      return;
    }
    try {
      const data = await fetchFileText(fileId);
      const baseText = data.text || "";
      const savedHtml = (data.html || "").trim();
      setDocumentText(baseText);

      if (savedHtml) {
        const shouldCleanupSavedHtml = currentFileConvertedFromPdf || PDF_HEADER_SIGNATURE_RE.test(savedHtml);
        const cleanedSavedHtml = shouldCleanupSavedHtml
          ? cleanupConvertedPdfHeaderHtml(savedHtml).trim()
          : savedHtml;
        setEditorContentHtml(cleanedSavedHtml);
        if (shouldCleanupSavedHtml && cleanedSavedHtml !== savedHtml) {
          void saveFileText(fileId, { text: baseText, html: cleanedSavedHtml });
        }
        return;
      }

      if ((data.ext || "").toLowerCase() === "docx") {
        try {
          const buffer = await fetchFileContentBuffer(fileId);
          const parsedHtml = (await parseDocxArrayBuffer(buffer)).trim();
          const shouldCleanupParsedHtml = currentFileConvertedFromPdf || PDF_HEADER_SIGNATURE_RE.test(parsedHtml);
          const convertedHtml = shouldCleanupParsedHtml
            ? cleanupConvertedPdfHeaderHtml(parsedHtml).trim()
            : parsedHtml;
          if (convertedHtml) {
            setEditorContentHtml(convertedHtml);
            void saveFileText(fileId, { text: baseText, html: convertedHtml });
            return;
          }
        } catch (_err) {
          // fallback abaixo
        }
      }

      setEditorContentHtml(plainTextToEditorHtml(baseText));
    } catch (_err) {
      setDocumentText("");
      setEditorContentHtml("<p></p>");
    } finally {
      setOpenedDocumentVersion((v) => v + 1);
    }
  }, [currentFileConvertedFromPdf]);
  const refreshDocumentPageCount = useCallback(async () => {
    const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
    if (!editorApi || !currentFileId) {
      setDocumentPageCount(null);
      setDocumentParagraphCount(null);
      setDocumentWordCount(null);
      setDocumentSymbolCount(null);
      setDocumentSymbolWithSpacesCount(null);
      return;
    }
    try {
      const statsData = await editorApi.getDocumentStats();
      setDocumentPageCount(statsData.pages);
      setDocumentParagraphCount(statsData.paragraphs);
      setDocumentWordCount(statsData.words);
      setDocumentSymbolCount(statsData.symbols);
      setDocumentSymbolWithSpacesCount(statsData.symbolsWithSpaces);
    } catch (_err) {
      setDocumentPageCount(null);
      setDocumentParagraphCount(null);
      setDocumentWordCount(null);
      setDocumentSymbolCount(null);
      setDocumentSymbolWithSpacesCount(null);
    }
  }, [currentFileId, htmlEditorControlApi]);
  useEffect(() => {
    void refreshDocumentText(currentFileId);
  }, [currentFileId, refreshDocumentText]);

  useEffect(() => {
    void refreshDocumentPageCount();
  }, [refreshDocumentPageCount]);

  useEffect(() => {
    if (!currentFileId) return;
    const timerId = window.setTimeout(() => {
      void refreshDocumentPageCount();
      setStatsKey((k) => k + 1);
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [currentFileId, openedDocumentVersion, refreshDocumentPageCount]);

  const handleWordFileUpload = useCallback(async (file: File): Promise<UploadedFileMeta> => {
    setIsOpeningDocument(true);
    try {
      const uploaded = await uploadFileToServer(file);
      if (uploaded.ext !== "docx") {
        const reason = uploaded.conversionError ? ` ${uploaded.conversionError}` : "";
        throw new Error(`Nao foi possivel abrir no editor. Use DOCX ou PDF convertido para DOCX.${reason}`);
      }

      setActionText("");
      setCurrentFileId(uploaded.id);
      setCurrentFileName(uploaded.originalName || uploaded.storedName || "documento.docx");
      setCurrentFileConvertedFromPdf(Boolean(uploaded.convertedFromPdf));
      return uploaded;
    } finally {
      setIsOpeningDocument(false);
    }
  }, []);

  const handleDocumentPanelFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setIsImportingDocument(true);
    setSelectedImportFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!["docx", "pdf"].includes(ext)) {
        throw new Error("Formato nao suportado. Use DOCX ou PDF.");
      }
      await handleWordFileUpload(file);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar arquivo.");
      setSelectedImportFileName("");
    } finally {
      setIsImportingDocument(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [handleWordFileUpload]);

  const handleDocumentPanelDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    void handleDocumentPanelFile(e.dataTransfer.files?.[0]);
  };

  const handleCreateBlankDocument = useCallback(async (): Promise<void> => {
    setIsOpeningDocument(true);
    try {
      const created = await createBlankDocOnServer("novo-documento.docx");
      setActionText("");
      setCurrentFileId(created.id);
      setCurrentFileName(created.originalName || created.storedName || "novo-documento.docx");
      setCurrentFileConvertedFromPdf(false);
    } finally {
      setIsOpeningDocument(false);
    }
  }, []);

  const handleRefreshStats = useCallback(async () => {
    if (!currentFileId) {
      toast.error("Nenhum documento aberto no editor.");
      return;
    }
    await refreshDocumentPageCount();
    setStatsKey((k) => k + 1);
  }, [currentFileId, refreshDocumentPageCount]);

  const handleRetrieveSelectedText = useCallback(async () => {
    const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
    if (!editorApi) {
      toast.error("API do editor indisponivel no momento.");
      return;
    }

    try {
      const selected = (await editorApi.getSelectedText()).trim();
      if (!selected) throw new Error("Nenhum texto selecionado no editor.");
      setActionText(selected);
      //toast.success("Trecho selecionado aplicado na caixa de texto.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao obter selecao.");
    }
  }, [htmlEditorControlApi]);

  const handleImportSelectedTextToActions = useCallback(async () => {
    setParameterPanelTarget({ section: "actions", id: null });
    await handleRetrieveSelectedText();
  }, [handleRetrieveSelectedText]);

  const handleSelectAllContent = useCallback(async () => {
    const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
    if (!editorApi) {
      toast.error("Controle do editor indisponivel.");
      return;
    }

    try {
      await editorApi.selectAllContent();
      //toast.success("Documento inteiro selecionado.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao selecionar todo o documento.");
    }
  }, [htmlEditorControlApi]);

  const handleTriggerSave = useCallback(async () => {
    const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
    if (!editorApi) {
      toast.error("API do editor indisponivel no momento.");
      return;
    }
    if (responses.length === 0) {
      toast.error("Ainda nao ha resposta no historico para aplicar.");
      return;
    }

    const latestResponse = responses[0]?.content?.trim() || "";
    if (!latestResponse) {
      toast.error("A ultima resposta do historico esta vazia.");
      return;
    }

    try {
      const markdownContent = normalizeHistoryContentToMarkdown(latestResponse);
      const html = markdownToEditorHtml(markdownContent);
      await editorApi.replaceSelectionRich(markdownContent, html);
      //toast.success("Ultima resposta aplicada no cursor/selecao do editor.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao aplicar resposta no editor.");
    }
  }, [htmlEditorControlApi, responses]);

  const addResponse = (type: AIResponse["type"], query: string, content: string) => {
    setResponses((prev) => [{
      id: crypto.randomUUID(),
      type,
      query,
      content,
      timestamp: new Date(),
    }, ...prev]);
  };

  const normalizeHistorySearchMetadataValue = (value: unknown): string =>
    value == null ? "" : String(value).replace(/\u00a0/g, " ").trim();

  const getFirstHistorySearchMetadataValue = (metadata: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const value = normalizeHistorySearchMetadataValue(metadata[key]);
      if (value) return value;
    }
    return "";
  };

  const assignHistorySearchMetadata = (
    target: HistorySearchCardMetadata,
    key: string,
    value: unknown,
    options?: { preserveCollision?: boolean },
  ) => {
    const normalizedValue = normalizeHistorySearchMetadataValue(value);
    if (!normalizedValue) return;

    if (!(key in target)) {
      target[key] = normalizedValue;
      return;
    }

    if (target[key] === normalizedValue) return;
    if (!options?.preserveCollision) return;

    let collisionKey = `raw_${key}`;
    let suffix = 2;
    while (collisionKey in target) {
      if (target[collisionKey] === normalizedValue) return;
      collisionKey = `raw_${key}_${suffix}`;
      suffix += 1;
    }
    target[collisionKey] = normalizedValue;
  };

  const buildLexicalHistorySearchMetadata = (
    item: {
      book: string;
      row: number;
      number: number | null;
      title: string;
      data: Record<string, string>;
    },
    fallbackBook: string,
  ): HistorySearchCardMetadata => {
    const metadata: HistorySearchCardMetadata = {};
    const sourceBookCode = normalizeHistorySearchMetadataValue(item.book) || normalizeHistorySearchMetadataValue(fallbackBook);
    const sourcebook = sourceBookCode ? BOOK_OPTION_LABELS[sourceBookCode] ?? sourceBookCode : "";
    const title = normalizeHistorySearchMetadataValue(item.title) || "s/titulo";
    const number = item.number == null ? "" : normalizeHistorySearchMetadataValue(item.number);

    assignHistorySearchMetadata(metadata, "sourcebook", sourcebook);
    assignHistorySearchMetadata(metadata, "title", title);
    assignHistorySearchMetadata(metadata, "number", number);
    assignHistorySearchMetadata(metadata, "book", sourceBookCode);
    assignHistorySearchMetadata(metadata, "row", item.row);

    for (const [key, value] of Object.entries(item.data || {})) {
      assignHistorySearchMetadata(metadata, key, value, { preserveCollision: true });
    }

    return metadata;
  };

  const buildSemanticHistorySearchMetadata = (
    item: {
      book: string;
      index_id: string;
      index_label: string;
      row: number;
      metadata: Record<string, unknown>;
      score: number;
    },
    fallbackIndexLabel: string,
  ): HistorySearchCardMetadata => {
    const rawMetadata = item.metadata && typeof item.metadata === "object" ? item.metadata : {};
    const metadata: HistorySearchCardMetadata = {};
    const sourcebook =
      normalizeHistorySearchMetadataValue(item.index_label) ||
      normalizeHistorySearchMetadataValue(fallbackIndexLabel) ||
      normalizeHistorySearchMetadataValue(item.book);
    const title = getFirstHistorySearchMetadataValue(rawMetadata, SEMANTIC_TITLE_METADATA_KEYS) || "s/titulo";
    const number = getFirstHistorySearchMetadataValue(rawMetadata, SEMANTIC_NUMBER_METADATA_KEYS);

    assignHistorySearchMetadata(metadata, "sourcebook", sourcebook);
    assignHistorySearchMetadata(metadata, "title", title);
    assignHistorySearchMetadata(metadata, "number", number);
    assignHistorySearchMetadata(metadata, "book", item.book);
    assignHistorySearchMetadata(metadata, "index_id", item.index_id);
    assignHistorySearchMetadata(metadata, "index_label", item.index_label || fallbackIndexLabel);
    assignHistorySearchMetadata(metadata, "row", item.row);
    assignHistorySearchMetadata(metadata, "score", item.score);

    for (const [key, value] of Object.entries(rawMetadata)) {
      assignHistorySearchMetadata(metadata, key, value, { preserveCollision: true });
    }

    return metadata;
  };

  const executeLLMWithLog = useCallback(async (payload: Parameters<typeof executeLLM>[0]) => {
    const currentConfig = llmConfigRef.current;
    const normalizeVerbosity = (value: string | undefined): "low" | "medium" | "high" | undefined => {
      if (!value) return undefined;
      const normalized = value.trim().toLowerCase();
      if (normalized === "low" || normalized === "medium" || normalized === "high") return normalized;
      return undefined;
    };
    const normalizeEffort = (value: string | undefined): "none" | "low" | "medium" | "high" | undefined => {
      if (!value) return undefined;
      const normalized = value.trim().toLowerCase();
      if (normalized === "none" || normalized === "low" || normalized === "medium" || normalized === "high") return normalized;
      return undefined;
    };
    const mergedPayload: Parameters<typeof executeLLM>[0] = {
      ...payload,
      model: currentConfig.model,
      temperature: currentConfig.temperature,
      maxOutputTokens: currentConfig.maxOutputTokens,
      vectorMaxResults: payload.vectorMaxResults ?? currentConfig.maxNumResults,
      gpt5Verbosity: normalizeVerbosity(currentConfig.gpt5Verbosity),
      gpt5Effort: normalizeEffort(currentConfig.gpt5Effort),
      systemPrompt: currentConfig.systemPrompt,
    };
    const id = crypto.randomUUID();
    const at = new Date().toISOString();
    setLlmLogs([{ id, at, request: mergedPayload }]);
    setLlmSessionLogs((prev) => [...prev, { id, at, request: mergedPayload }]);
    try {
      const response = await executeLLM(mergedPayload);
      setLlmLogs((prev) => (prev[0]?.id === id ? [{ ...prev[0], response }] : prev));
      setLlmSessionLogs((prev) => prev.map((entry) => (entry.id === id ? { ...entry, response } : entry)));
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLlmLogs((prev) => (prev[0]?.id === id ? [{ ...prev[0], error: message }] : prev));
      setLlmSessionLogs((prev) => prev.map((entry) => (entry.id === id ? { ...entry, error: message } : entry)));
      throw err;
    }
  }, []);

  const executeAiActionsLLMWithLog = useCallback(async (payload: Parameters<typeof executeLLM>[0]) => {
    const currentConfig = aiActionsLlmConfigRef.current;
    const normalizeVerbosity = (value: string | undefined): "low" | "medium" | "high" | undefined => {
      if (!value) return undefined;
      const normalized = value.trim().toLowerCase();
      if (normalized === "low" || normalized === "medium" || normalized === "high") return normalized;
      return undefined;
    };
    const normalizeEffort = (value: string | undefined): "none" | "low" | "medium" | "high" | undefined => {
      if (!value) return undefined;
      const normalized = value.trim().toLowerCase();
      if (normalized === "none" || normalized === "low" || normalized === "medium" || normalized === "high") return normalized;
      return undefined;
    };
    const mergedPayload: Parameters<typeof executeLLM>[0] = {
      ...payload,
      model: currentConfig.model,
      temperature: currentConfig.temperature,
      maxOutputTokens: currentConfig.maxOutputTokens,
      gpt5Verbosity: normalizeVerbosity(currentConfig.gpt5Verbosity),
      gpt5Effort: normalizeEffort(currentConfig.gpt5Effort),
    };
    const id = crypto.randomUUID();
    const at = new Date().toISOString();
    setLlmLogs([{ id, at, request: mergedPayload }]);
    setLlmSessionLogs((prev) => [...prev, { id, at, request: mergedPayload }]);
    try {
      const response = await executeLLM(mergedPayload);
      setLlmLogs((prev) => (prev[0]?.id === id ? [{ ...prev[0], response }] : prev));
      setLlmSessionLogs((prev) => prev.map((entry) => (entry.id === id ? { ...entry, response } : entry)));
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLlmLogs((prev) => (prev[0]?.id === id ? [{ ...prev[0], error: message }] : prev));
      setLlmSessionLogs((prev) => prev.map((entry) => (entry.id === id ? { ...entry, error: message } : entry)));
      throw err;
    }
  }, []);

  const handleCleanLlmConversation = useCallback(() => {
    setChatHistory([]);
    setChatPreviousResponseId(null);
    toast.success("Nova conversa iniciada sem contexto anterior.");
  }, []);

  const insertRefBook = useCallback(async (book: string) => {
    const data = await insertRefBookMacro(book);
    return data.result;
  }, []);

  const handleOpenParameterSection = useCallback((section: ParameterPanelSection) => {
    setAppPanelScope(section === "apps" ? "bibliografia" : null);
    if (section === "sources") setSourcesPanelView("books");
    else setSourcesPanelView(null);
    setParameterPanelTarget(section === "settings" ? { section, id: "llm" } : { section, id: null });
  }, []);

  const handleOpenGeneralSettings = useCallback(() => {
    setAppPanelScope(null);
    setSourcesPanelView(null);
    setParameterPanelTarget({ section: "settings", id: "general" });
  }, []);

  const handleToggleBookSource = useCallback((id: string, checked: boolean) => {
    setSelectedBookSourceIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  }, []);

  const handleUploadSourceFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploadingChatFiles(true);
    try {
      const uploaded = await uploadLlmSourceFiles(files);
      setUploadedChatFiles((prev) => {
        const next = [...prev];
        for (const file of uploaded) {
          if (next.some((item) => item.id === file.id)) continue;
          next.push(file);
        }
        return next;
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar arquivos para a OpenAI.");
    } finally {
      setIsUploadingChatFiles(false);
    }
  }, []);

  const handleRemoveUploadedChatFile = useCallback((id: string) => {
    setUploadedChatFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const handleActionMacros = useCallback(async (type: MacroActionId) => {
    setParameterPanelTarget((prev) => {
      if (prev?.section === "document" && prev.id === type) {
        return { section: "document", id: null };
      }
      return { section: "document", id: type };
    });
    if (type === "macro1") {
      const input = actionText.trim();
      if (!macro1Term.trim() && input) setMacro1Term(input);
    }
  }, [actionText, macro1Term]);

  const getEditorApi = useCallback(async (): Promise<HtmlEditorControlApi | null> => {
    const immediate = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
    if (immediate) return immediate;

    // O controle do editor pode demorar alguns ciclos para ficar disponivel
    // apos re-render/layout. Fazemos retry curto para evitar falso negativo.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      const api = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      if (api) return api;
    }
    return null;
  }, [htmlEditorControlApi]);

  const handleAppendHistoryToEditor = useCallback(async (html: string) => {
    const editorApi = await getEditorApi();
    if (!editorApi) {
      toast.error("Abra o editor antes de inserir no documento.");
      return;
    }

    try {
      await editorApi.appendRichWithBlankLine(html);
      //toast.success("Conteudo do historico inserido no final do editor.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao inserir conteudo no editor.");
    }
  }, [getEditorApi]);

  const handleRunMacro2ManualNumbering = useCallback(async () => {
    const editorApi = await getEditorApi();
    if (!editorApi) {
      toast.error("Abra o editor antes de executar Macro2.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await editorApi.runMacro2ManualNumberingSelection(macro2SpacingMode);
      //toast.success(`Macro2 aplicada: ${result.converted} item(ns) convertidos para numeracao manual.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao executar Macro2.");
    } finally {
      setIsLoading(false);
    }
  }, [getEditorApi, macro2SpacingMode]);

  const handleEditorControlApiReady = useCallback((api: HtmlEditorControlApi | null) => {
    if (api) {
      htmlEditorControlApiRef.current = api;
      setHtmlEditorControlApi(api);
      return;
    }

    // Evita perder a API por eventos transitorios de foco/re-render quando o editor ainda esta aberto.
    if (currentFileIdRef.current) return;

    htmlEditorControlApiRef.current = null;
    setHtmlEditorControlApi(null);
  }, []);

  useEffect(() => {
    const input = macro1Term.trim();
    const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
    const hasDocumentOpen = Boolean(currentFileId);

    if (!input) {
      setIsCountingMacro1Matches(false);
      setMacro1PredictedMatches(null);
      return;
    }
    if (!editorApi || !hasDocumentOpen) {
      setIsCountingMacro1Matches(false);
      setMacro1PredictedMatches(null);
      return;
    }

    const requestId = macro1CountRequestIdRef.current + 1;
    macro1CountRequestIdRef.current = requestId;
    setIsCountingMacro1Matches(true);

    void editorApi
      .countOccurrencesInDocument(input)
      .then((count) => {
        if (macro1CountRequestIdRef.current !== requestId) return;
        setMacro1PredictedMatches(count);
      })
      .catch(() => {
        if (macro1CountRequestIdRef.current !== requestId) return;
        setMacro1PredictedMatches(0);
      })
      .finally(() => {
        if (macro1CountRequestIdRef.current !== requestId) return;
        setIsCountingMacro1Matches(false);
      });
  }, [macro1Term, htmlEditorControlApi, currentFileId, editorContentHtml]);

  const handleRunMacro1Highlight = useCallback(async () => {
    const editorApi = await getEditorApi();
    if (!editorApi) {
      toast.error("Abra o editor antes de executar Highlight.");
      return;
    }

    const input = macro1Term.trim();
    if (!input) {
      toast.error("Informe o termo no painel Parameters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await editorApi.runMacro1HighlightDocument(input, macro1ColorId);
      if (result.matches <= 0) {
        toast.info("Highlight executado. Nenhuma ocorr\u00eancia encontrada.");
        return;
      }
      //toast.success(
        //`Highlight executado: ${result.matches} ocorr\u00eancia(s) encontradas e ${result.highlighted} destacada(s).`,
      //);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao executar Highlight.");
    } finally {
      setIsLoading(false);
    }
  }, [getEditorApi, macro1ColorId, macro1Term]);

  const handleClearMacro1Highlight = useCallback(async () => {
    const editorApi = await getEditorApi();
    if (!editorApi) {
      toast.error("Abra o editor antes de limpar marca\u00e7\u00e3o.");
      return;
    }

    const input = macro1Term.trim();
    if (!input) {
      toast.error("Informe o termo no painel Parameters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await editorApi.clearMacro1HighlightDocument(input);
      if (result.matches <= 0 || result.cleared <= 0) {
        toast.info("Nenhuma marca\u00e7\u00e3o encontrada para limpar.");
        return;
      }
      //toast.success(`Marca\u00e7\u00e3o limpa em ${result.cleared} ocorr\u00eancia(s).`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao limpar marca\u00e7\u00e3o.");
    } finally {
      setIsLoading(false);
    }
  }, [getEditorApi, macro1Term]);

  const handleSelectRefBook = useCallback((book: BookCode) => {
    setSelectedRefBook(book);
  }, []);

  const normalizeRefPages = useCallback((pages: string) => {
    return pages
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }, []);

  const handleRunInsertRefBook = useCallback(async () => {
    setIsRunningInsertRefBook(true);
    try {
      const rawResult = (await insertRefBook(selectedRefBook)).trim();
      const pages = normalizeRefPages(refBookPages);
      const result = pages ? `${rawResult}; p. ${pages}.` : rawResult;
      if (result) {
        addResponse("app_ref_book", `Livro: ${BOOK_LABELS[selectedRefBook] ?? selectedRefBook}${pages ? ` | p. ${pages}` : ""}`, result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Insert Ref Book.";
      toast.error(msg);
    } finally {
      setIsRunningInsertRefBook(false);
    }
  }, [insertRefBook, normalizeRefPages, refBookPages, selectedRefBook]);

  const handleRunInsertRefVerbete = useCallback(async () => {
    const raw = verbeteInput.trim();
    if (!raw) {
      toast.error("Informe ao menos um verbete.");
      return;
    }

    setIsRunningInsertRefVerbete(true);
    try {
      const data = await insertRefVerbeteApp(raw);
      const refList = (data.result.ref_list || "").trim();
      const refBiblio = (data.result.ref_biblio || "").trim();

      if (refList) addResponse("app_ref_verbete_list", `Verbetes: ${raw}`, refList);
      if (refBiblio) addResponse("app_ref_verbete_biblio", `Verbetes: ${raw}`, refBiblio);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Insert Ref Verbete.";
      toast.error(msg);
    } finally {
      setIsRunningInsertRefVerbete(false);
    }
  }, [verbeteInput]);

  const handleRunBiblioGeral = useCallback(async () => {
    const author = biblioGeralAuthor.trim();
    const title = biblioGeralTitle.trim();
    const year = biblioGeralYear.trim();
    const extra = biblioGeralExtra.trim();
    if (!author && !title && !year && !extra) {
      toast.error("Informe ao menos um campo para buscar bibliografias.");
      return;
    }

    setIsRunningBiblioGeral(true);
    try {
      const data = await biblioGeralApp({ author, title, year, extra, topK: 10 });
      const markdown = (data.result.markdown || "").trim();
      if (markdown) {
        const queryParts = [
          author && `autor: ${author}`,
          title && `titulo: ${title}`,
          year && `ano: ${year}`,
          extra && `extra: ${extra}`,
        ].filter(Boolean);
        addResponse("app_biblio_geral", queryParts.join(" | "), markdown);
      }
      if (!data.result.matches?.length) {
        toast.info("Nenhuma bibliografia encontrada.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Bibliografia Autores.";
      toast.error(msg);
    } finally {
      setIsRunningBiblioGeral(false);
    }
  }, [biblioGeralAuthor, biblioGeralExtra, biblioGeralTitle, biblioGeralYear]);

  const handleRunBiblioExterna = useCallback(async () => {
    const author = biblioExternaAuthor.trim();
    const title = biblioExternaTitle.trim();
    const year = biblioExternaYear.trim();
    const journal = biblioExternaJournal.trim();
    const publisher = biblioExternaPublisher.trim();
    const identifier = biblioExternaIdentifier.trim();
    const extra = biblioExternaExtra.trim();
    const freeText = biblioExternaFreeText.trim();
    if (!author && !title && !year && !journal && !publisher && !identifier && !extra && !freeText) {
      toast.error("Informe ao menos um campo para Bibliografia Externa.");
      return;
    }

    setIsRunningBiblioExterna(true);
    try {
      const data = freeText
        ? await biblioExternaApp({
            freeText,
            llmModel: biblioExternaLlmModel,
            llmTemperature: biblioExternaLlmTemperature,
            llmMaxOutputTokens: biblioExternaLlmMaxOutputTokens,
            llmGpt5Verbosity: biblioExternaLlmVerbosity,
            llmGpt5Effort: biblioExternaLlmEffort,
            llmSystemPrompt: biblioExternaLlmSystemPrompt.trim() || undefined,
          })
        : await biblioExternaApp({
            author,
            title,
            year,
            journal,
            publisher,
            identifier,
            extra,
            llmModel: biblioExternaLlmModel,
            llmTemperature: biblioExternaLlmTemperature,
            llmMaxOutputTokens: biblioExternaLlmMaxOutputTokens,
            llmGpt5Verbosity: biblioExternaLlmVerbosity,
            llmGpt5Effort: biblioExternaLlmEffort,
            llmSystemPrompt: biblioExternaLlmSystemPrompt.trim() || undefined,
          });
      const incomingLogs: Array<{ request?: unknown; response?: unknown; error?: unknown }> = Array.isArray(data.result.llmLogs)
        ? data.result.llmLogs
        : (data.result.llmLog ? [data.result.llmLog] : []);
      if (incomingLogs.length > 0) {
        const latestEntry = incomingLogs[incomingLogs.length - 1];
        const nextLog = {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          request: latestEntry?.request ?? {},
          response: latestEntry?.response ?? {},
          error: typeof latestEntry?.error === "string" ? latestEntry.error : undefined,
        };
        setLlmLogs([nextLog]);
        setLlmSessionLogs((prev) => [...prev, nextLog]);
      }
      const markdown = (data.result.markdown || "").trim();
      const scorePercentual = Number(data.result.score?.score_percentual ?? NaN);
      const classificacao = (data.result.score?.classificacao || "").trim();
      const scoreLine = Number.isFinite(scorePercentual)
        ? `Confiabilidade: **${scorePercentual.toFixed(2)}%**${classificacao ? ` (${classificacao})` : ""}`
        : "";
      const content = [scoreLine, markdown].filter(Boolean).join("\n\n");
      if (content) {
        const queryParts = freeText
          ? [`texto livre: ${freeText}`]
          : [
              author && `autor: ${author}`,
              title && `titulo: ${title}`,
              year && `ano: ${year}`,
              journal && `revista: ${journal}`,
              publisher && `editora: ${publisher}`,
              identifier && `doi/isbn: ${identifier}`,
              extra && `extra: ${extra}`,
            ].filter(Boolean);
        addResponse("app_biblio_externa", queryParts.join(" | "), content);
      }
      if (!data.result.matches?.length) {
        toast.info("Nenhuma bibliografia externa encontrada.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Bibliografia Externa.";
      toast.error(msg);
    } finally {
      setIsRunningBiblioExterna(false);
    }
  }, [biblioExternaAuthor, biblioExternaExtra, biblioExternaFreeText, biblioExternaIdentifier, biblioExternaJournal, biblioExternaLlmEffort, biblioExternaLlmMaxOutputTokens, biblioExternaLlmModel, biblioExternaLlmSystemPrompt, biblioExternaLlmTemperature, biblioExternaLlmVerbosity, biblioExternaPublisher, biblioExternaTitle, biblioExternaYear]);

  const ensureLexicalBooksLoaded = useCallback(async () => {
    if (lexicalBooks.length > 0) return lexicalBooks;
    try {
      const data = await listLexicalBooksApp();
      const books = data.result.books?.length ? data.result.books : [];
      setLexicalBooks(books);
      if (!books.includes(selectedLexicalBook)) {
        setSelectedLexicalBook(books.includes("LO") ? "LO" : (books[0] || ""));
      }
      return books;
    } catch (err: unknown) {
      setLexicalBooks([]);
      setSelectedLexicalBook("LO");
      const msg = err instanceof Error ? err.message : "Falha ao carregar livros para Book Search.";
      toast.error(msg);
      return [];
    }
  }, [lexicalBooks, selectedLexicalBook]);

  const ensureSemanticIndexesLoaded = useCallback(async () => {
    if (semanticSearchIndexes.length > 0) return semanticSearchIndexes;
    setIsLoadingSemanticSearchIndexes(true);
    try {
      const data = await listSemanticIndexesApp();
      const indexes = data.result.indexes?.length ? data.result.indexes : [];
      setSemanticSearchIndexes(indexes);
      setSelectedSemanticSearchIndexId((prev) => {
        if (prev && indexes.some((item) => item.id === prev)) return prev;
        const preferred = indexes.find((item) => item.id.toUpperCase() === "LO");
        return preferred?.id ?? indexes[0]?.id ?? "";
      });
      return indexes;
    } catch (err: unknown) {
      setSemanticSearchIndexes([]);
      setSelectedSemanticSearchIndexId("");
      const msg = err instanceof Error ? err.message : "Falha ao carregar indices para Semantic Search.";
      toast.error(msg);
      return [];
    } finally {
      setIsLoadingSemanticSearchIndexes(false);
    }
  }, [semanticSearchIndexes]);

  const handleActionApps = useCallback((type: AppActionId) => {
    if (type === "app4" || type === "app5") {
      setAppPanelScope("busca_termos");
    } else if (type === "app12") {
      setAppPanelScope("semantic_search");
    } else if (type === "app7" || type === "app8" || type === "app11" || type === "app9" || type === "app10") {
      setAppPanelScope("verbetografia");
    } else {
      setAppPanelScope("bibliografia");
    }
    setParameterPanelTarget({ section: "apps", id: type });
    if (type === "app1") {
      setRefBookPages("");
    }
    if (type === "app3") {
      if (!biblioGeralTitle.trim() && actionText.trim()) setBiblioGeralTitle(actionText.trim());
    }
    if (type === "app6") {
      if (!biblioExternaTitle.trim() && actionText.trim()) setBiblioExternaTitle(actionText.trim());
    }
    if (type === "app4") {
      void ensureLexicalBooksLoaded();
    }
    if (type === "app5") {
      // Sem pre-load; usa base fixa EC.xlsx
    }
    if (type === "app12") {
      void ensureSemanticIndexesLoaded();
    }
    if (type === "app7" || type === "app8" || type === "app11" || type === "app9" || type === "app10") {
      if (!verbetografiaTitle.trim() && actionText.trim()) setVerbetografiaTitle(actionText.trim());
    }
  }, [actionText, biblioExternaTitle, biblioGeralTitle, ensureLexicalBooksLoaded, ensureSemanticIndexesLoaded, verbetografiaTitle]);

  const handleOpenBookSearchFromLeft = useCallback(() => {
    setAppPanelScope("busca_termos");
    setParameterPanelTarget({ section: "apps", id: null });
    void ensureLexicalBooksLoaded();
  }, [ensureLexicalBooksLoaded]);

  const handleOpenSemanticSearchFromLeft = useCallback(() => {
    setAppPanelScope("semantic_search");
    setParameterPanelTarget({ section: "apps", id: "app12" });
    void ensureSemanticIndexesLoaded();
  }, [ensureSemanticIndexesLoaded]);

  const handleOpenVerbetografiaFromLeft = useCallback(() => {
    setAppPanelScope("verbetografia");
    setParameterPanelTarget({ section: "apps", id: null });
  }, []);

  const handleOpenVerbetografiaTableFromLeft = useCallback(() => {
    setAppPanelScope("verbetografia");
    setParameterPanelTarget({ section: "apps", id: "app7" });
  }, []);

  const handleOpenVerbetografiaTable = useCallback(async () => {
    setIsRunningVerbetografiaOpenTable(true);
    setIsOpeningDocument(true);
    try {
      const uploaded = await openVerbetografiaTableApp({
        title: verbetografiaTitle.trim(),
        specialty: verbetografiaSpecialty.trim(),
      });
      setActionText("");
      setCurrentFileId(uploaded.id);
      setCurrentFileName(uploaded.originalName || uploaded.storedName || "Tab_Verbete.docx");
      setCurrentFileConvertedFromPdf(false);
      //toast.success("Tabela aberta no editor HTML.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao abrir tabela de verbetografia.");
    } finally {
      setIsOpeningDocument(false);
      setIsRunningVerbetografiaOpenTable(false);
    }
  }, [verbetografiaSpecialty, verbetografiaTitle]);

  const handleRunVerbeteDefinologia = useCallback(async () => {
    if (!openAiReady) {
      toast.error(backendNotReadyMessage());
      return;
    }
    const title = verbetografiaTitle.trim();
    const specialty = verbetografiaSpecialty.trim();
    if (!title) {
      toast.error("Informe o título do verbete.");
      return;
    }
    if (!specialty) {
      toast.error("Informe a especialidade do verbete.");
      return;
    }

    setIsRunningVerbeteDefinologia(true);
    try {
      const currentConfig = aiActionsLlmConfigRef.current;
      const vectorStoreIds = normalizeIdList(currentConfig.vectorStoreIds);
      const inputFileIds = normalizeIdList(currentConfig.inputFileIds);
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
      const normalizedEditorText = (latestEditorText || "").trim();
      const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
      const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      const query = `Escreva uma Definologia do tema do verbete com título: ${title} e especialidade: ${specialty}.`;
      const messages = buildVerbeteDefinologiaPrompt(query, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm);
      const result = (
        await executeAiActionsLLMWithLog({
          messages,
          systemPrompt: "",
          vectorStoreIds,
          inputFileIds,
        })
      ).content.trim();
      const finalContent = result || "Sem conteudo retornado pela IA.";
      addResponse("app_verbete_definologia", `Título: ${title} | Especialidade: ${specialty}`, finalContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Definologia.";
      toast.error(msg);
      addResponse("app_verbete_definologia", `Título: ${verbetografiaTitle.trim()} | Especialidade: ${verbetografiaSpecialty.trim()}`, `Erro na Definologia: ${msg}`);
    } finally {
      setIsRunningVerbeteDefinologia(false);
    }
  }, [backendNotReadyMessage, documentText, executeAiActionsLLMWithLog, htmlEditorControlApi, includeEditorContextInLlm, llmEditorContextMaxChars, openAiReady, verbetografiaSpecialty, verbetografiaTitle]);

  const handleRunVerbeteFraseEnfatica = useCallback(async () => {
    if (!openAiReady) {
      toast.error(backendNotReadyMessage());
      return;
    }
    const title = verbetografiaTitle.trim();
    const specialty = verbetografiaSpecialty.trim();
    if (!title) {
      toast.error("Informe o título do verbete.");
      return;
    }
    if (!specialty) {
      toast.error("Informe a especialidade do verbete.");
      return;
    }

    setIsRunningVerbeteFraseEnfatica(true);
    try {
      const currentConfig = aiActionsLlmConfigRef.current;
      const vectorStoreIds = normalizeIdList(currentConfig.vectorStoreIds);
      const inputFileIds = normalizeIdList(currentConfig.inputFileIds);
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
      const normalizedEditorText = (latestEditorText || "").trim();
      const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
      const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      const query = `Escreva uma Frase Enfática do tema do verbete com título: ${title} e especialidade: ${specialty}.`;
      const messages = buildVerbeteFraseEnfaticaPrompt(query, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm);
      const result = (
        await executeAiActionsLLMWithLog({
          messages,
          systemPrompt: "",
          vectorStoreIds,
          inputFileIds,
        })
      ).content.trim();
      const finalContent = result || "Sem conteudo retornado pela IA.";
      addResponse("app_verbete_frase_enfatica", `Título: ${title} | Especialidade: ${specialty}`, finalContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Frase Enfática.";
      toast.error(msg);
      addResponse("app_verbete_frase_enfatica", `Título: ${verbetografiaTitle.trim()} | Especialidade: ${verbetografiaSpecialty.trim()}`, `Erro na Frase Enfática: ${msg}`);
    } finally {
      setIsRunningVerbeteFraseEnfatica(false);
    }
  }, [backendNotReadyMessage, documentText, executeAiActionsLLMWithLog, htmlEditorControlApi, includeEditorContextInLlm, llmEditorContextMaxChars, openAiReady, verbetografiaSpecialty, verbetografiaTitle]);

  const handleRunVerbeteSinonimologia = useCallback(async () => {
    if (!openAiReady) {
      toast.error(backendNotReadyMessage());
      return;
    }
    const title = verbetografiaTitle.trim();
    const specialty = verbetografiaSpecialty.trim();
    if (!title) {
      toast.error("Informe o título do verbete.");
      return;
    }
    if (!specialty) {
      toast.error("Informe a especialidade do verbete.");
      return;
    }

    setIsRunningVerbeteSinonimologia(true);
    try {
      const currentConfig = aiActionsLlmConfigRef.current;
      const vectorStoreIds = normalizeIdList(currentConfig.vectorStoreIds);
      const inputFileIds = normalizeIdList(currentConfig.inputFileIds);
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
      const normalizedEditorText = (latestEditorText || "").trim();
      const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
      const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      const query = `Escreva uma Sinonimologia do tema do verbete com título: ${title} e especialidade: ${specialty}.`;
      const messages = buildVerbeteSinonimologiaPrompt(query, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm);
      const result = (
        await executeAiActionsLLMWithLog({
          messages,
          systemPrompt: "",
          vectorStoreIds,
          inputFileIds,
        })
      ).content.trim();
      const finalContent = result || "Sem conteudo retornado pela IA.";
      addResponse("app_verbete_sinonimologia", `Título: ${title} | Especialidade: ${specialty}`, finalContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Sinonimologia.";
      toast.error(msg);
      addResponse("app_verbete_sinonimologia", `Título: ${verbetografiaTitle.trim()} | Especialidade: ${verbetografiaSpecialty.trim()}`, `Erro na Sinonimologia: ${msg}`);
    } finally {
      setIsRunningVerbeteSinonimologia(false);
    }
  }, [backendNotReadyMessage, documentText, executeAiActionsLLMWithLog, htmlEditorControlApi, includeEditorContextInLlm, llmEditorContextMaxChars, openAiReady, verbetografiaSpecialty, verbetografiaTitle]);

  const handleRunVerbeteFatologia = useCallback(async () => {
    if (!openAiReady) {
      toast.error(backendNotReadyMessage());
      return;
    }
    const title = verbetografiaTitle.trim();
    const specialty = verbetografiaSpecialty.trim();
    if (!title) {
      toast.error("Informe o título do verbete.");
      return;
    }
    if (!specialty) {
      toast.error("Informe a especialidade do verbete.");
      return;
    }

    setIsRunningVerbeteFatologia(true);
    try {
      const currentConfig = aiActionsLlmConfigRef.current;
      const vectorStoreIds = normalizeIdList(currentConfig.vectorStoreIds);
      const inputFileIds = normalizeIdList(currentConfig.inputFileIds);
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
      const normalizedEditorText = (latestEditorText || "").trim();
      const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
      const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      const query = `Escreva uma Fatologia do tema do verbete com título: ${title} e especialidade: ${specialty}.`;
      const messages = buildVerbeteFatologiaPrompt(query, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm);
      const result = (
        await executeAiActionsLLMWithLog({
          messages,
          systemPrompt: "",
          vectorStoreIds,
          inputFileIds,
        })
      ).content.trim();
      const finalContent = result || "Sem conteudo retornado pela IA.";
      addResponse("app_verbete_fatologia", `Título: ${title} | Especialidade: ${specialty}`, finalContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Fatologia.";
      toast.error(msg);
      addResponse("app_verbete_fatologia", `Título: ${verbetografiaTitle.trim()} | Especialidade: ${verbetografiaSpecialty.trim()}`, `Erro na Fatologia: ${msg}`);
    } finally {
      setIsRunningVerbeteFatologia(false);
    }
  }, [backendNotReadyMessage, documentText, executeAiActionsLLMWithLog, htmlEditorControlApi, includeEditorContextInLlm, llmEditorContextMaxChars, openAiReady, verbetografiaSpecialty, verbetografiaTitle]);

  const handleRunLexicalSearch = useCallback(async () => {
    const book = selectedLexicalBook.trim();
    const term = lexicalTerm.trim();
    const maxResults = Math.max(1, Math.min(200, lexicalMaxResults || 1));
    if (!book) {
      toast.error("Selecione um livro para a busca.");
      return;
    }
    if (!term) {
      toast.error("Informe um termo para busca.");
      return;
    }

    setIsRunningLexicalSearch(true);
    try {
      const data = await searchLexicalBookApp({ book, term, limit: maxResults });
      const totalFound = Number(data.result.total || 0);
      const matches = (data.result.matches || []).slice(0, maxResults);
      if (matches.length <= 0) {
        toast.info("Nenhuma ocorrencia encontrada.");
        return;
      }
      const searchCards = matches
        .map((item) => {
          const text = (item.text || "").trim();
          const body = text || Object.values(item.data || {}).filter(Boolean).join(" | ");
          return {
            textParagraphs: [body],
            metadata: buildLexicalHistorySearchMetadata(item, book),
          };
        })
        .filter((item) => item.textParagraphs.some((paragraph) => paragraph.trim()));
      const markdown = buildHistorySearchCardsMarkdown(searchCards);
      const shownInfo = totalFound > maxResults ? ` | Exibidos: ${maxResults}` : "";
      addResponse(
        "app_book_search",
        `Livro: ${BOOK_OPTION_LABELS[book] ?? book} | Termo: ${term} | Total: ${totalFound}${shownInfo}`,
        markdown,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Book Search.";
      toast.error(msg);
    } finally {
      setIsRunningLexicalSearch(false);
    }
  }, [lexicalMaxResults, lexicalTerm, selectedLexicalBook]);

  const handleRunSemanticSearch = useCallback(async () => {
    const indexId = selectedSemanticSearchIndexId.trim();
    const query = semanticSearchQuery.trim();
    const maxResults = Math.max(1, Math.min(50, semanticSearchMaxResults || 1));
    if (!indexId) {
      toast.error("Selecione uma base vetorial para o Semantic Search.");
      return;
    }
    if (!query) {
      toast.error("Informe uma query para o Semantic Search.");
      return;
    }

    setIsRunningSemanticSearch(true);
    try {
      const data = await semanticSearchPensatasApp({ indexId, query, limit: maxResults });
      const matches = (data.result.matches || []).slice(0, maxResults);
      if (matches.length <= 0) {
        toast.info("Nenhuma pensata semanticamente afim encontrada.");
        return;
      }

      const indexLabel = matches[0]?.index_label?.trim() || semanticSearchIndexes.find((item) => item.id === indexId)?.label || indexId;
      const searchCards = matches
        .map((item) => {
          const text = (item.text || "").trim();
          return {
            textParagraphs: [text],
            metadata: buildSemanticHistorySearchMetadata(item, indexLabel),
          };
        })
        .filter((item) => item.textParagraphs.some((paragraph) => paragraph.trim()));
      const markdown = buildHistorySearchCardsMarkdown(searchCards);

      const trimmedQuery = query.length > 120 ? `${query.slice(0, 117)}...` : query;
      addResponse(
        "app_semantic_search",
        `Base: ${indexLabel} | Consulta: ${trimmedQuery} | Total: ${matches.length}`,
        markdown,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Semantic Search.";
      toast.error(msg);
    } finally {
      setIsRunningSemanticSearch(false);
    }
  }, [selectedSemanticSearchIndexId, semanticSearchIndexes, semanticSearchMaxResults, semanticSearchQuery]);

  const handleRunVerbeteSearch = useCallback(async () => {
    const author = verbeteSearchAuthor.trim();
    const title = verbeteSearchTitle.trim();
    const area = verbeteSearchArea.trim();
    const text = verbeteSearchText.trim();
    const maxResults = Math.max(1, Math.min(200, verbeteSearchMaxResults || 1));
    if (!author && !title && !area && !text) {
      toast.error("Preencha ao menos um campo para buscar em verbetes.");
      return;
    }

    setIsRunningVerbeteSearch(true);
    try {
      const data = await searchVerbeteApp({ author, title, area, text, limit: maxResults });
      const totalFound = Number(data.result.total || 0);
      const matches = (data.result.matches || []).slice(0, maxResults);
      if (matches.length <= 0) {
        toast.info("Nenhum verbete encontrado.");
        return;
      }

      const markdown = matches
        .map((item) => {

          const row = item.data || {};
          const rowTitle = String(row.title || item.title || "").trim();
          const rowText = String(row.text || item.text || "").trim();
          const rowArea = String(row.area || "").trim();
          const rowAuthor = String(row.author || "").trim();
          const rowNumber = item.number != null ? String(item.number).trim() : "";
          const rowDate = String(row.date || "").trim();
          const rawRowLink = String(item.link || row.link || row.Link || "").trim();
          const rowLink = /^https?:\/\/\S+$/i.test(rawRowLink) ? rawRowLink : "";

          const titlePart = `${rowTitle || "s/titulo"}`;
          const areaPart = `${rowArea || "s/area"}`;
          const authorPart = `${rowAuthor || "s/autor"}`;
          const numberPart = `# ${rowNumber || "?"}`;
          const datePart = rowDate || "s/data";
          const definologiaPart = `**Definologia.** ${rowText || ""}`.trim();
          const linkPart = rowLink ? `[PDF](${rowLink})` : "";
          const headerLine = `**${titlePart}** (*${areaPart}*) - *${authorPart}* - ${numberPart} - ${datePart}`;
          return `${headerLine}\n${definologiaPart}\n${linkPart}`;
        })
        .join("\n\n");

      const queryParts = [
        author && `Author: ${author}`,
        title && `Title: ${title}`,
        area && `Area: ${area}`,
        text && `Text: ${text}`,
      ].filter(Boolean);
      addResponse(
        "app_verbete_search",
        `${queryParts.join(" | ")} | Total: ${totalFound}${totalFound > maxResults ? ` | Exibidos: ${maxResults}` : ""}`,
        markdown,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Busca em Verbetes.";
      toast.error(msg);
    } finally {
      setIsRunningVerbeteSearch(false);
    }
  }, [verbeteSearchArea, verbeteSearchAuthor, verbeteSearchMaxResults, verbeteSearchText, verbeteSearchTitle]);

  const handleRunRandomPensata = useCallback(async () => {
    if (isLoading) return;
    if (!openAiReady) {
      toast.error(backendNotReadyMessage());
      return;
    }
    setIsLoading(true);
    try {
      const data = await randomPensataApp();
      const result = data.result;
      const source = (result.source || "LO").trim();
      const number = Number(result.paragraph_number || 0);
      const total = Number(result.total_paragraphs || 0);
      const paragraph = (result.paragraph || "").trim();
      const header = `Livro: ${source} | Paragrafo: ${number}${total > 0 ? `/${total}` : ""}`;
      const pensata = paragraph || "Paragrafo nao encontrado.";
      const analysisMessages = buildPensataAnalysisPrompt(pensata);
      const analysis = (
        await executeLLMWithLog({
          messages: analysisMessages,
          vectorStoreIds: ["vs_6912908250e4819197e23fe725e04fae"],
        })
      ).content.trim();
      const content = analysis ? `${pensata}\n\n**Análise IA:** ${analysis}` : pensata;
      addResponse("app_random_pensata", header, content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Pensata do Dia.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [backendNotReadyMessage, executeLLMWithLog, isLoading, openAiReady]);

  const handleAction = useCallback(async (type: AiActionId) => {
    const text = actionText.trim();
    const query = aiCommandQuery.trim();
    const currentConfig = aiActionsLlmConfigRef.current;
    const inputFileIds = normalizeIdList(currentConfig.inputFileIds);
    const vectorStoreIds = normalizeIdList(currentConfig.vectorStoreIds);

    if (!text) {
      toast.error("Selecione um trecho no documento ou escreva na caixa de texto.");
      return;
    }

    if (type === "ai_command" && !query) {
      toast.error("Informe a Query do Comando IA.");
      return;
    }

    if (!openAiReady) {
      toast.error(backendNotReadyMessage());
      return;
    }

    if (type === "pensatas") {
      if (vectorStoreIds.length === 0) {
        toast.error("Selecione ao menos 1 Vector Store na configuracao de Acoes IA.");
        return;
      }

      setIsLoading(true);
      try {
        const content = (
          await executeAiActionsLLMWithLog({
            messages: [
              {
                role: "system",
                content:
                  "Voce e um pesquisador de pensatas da Conscienciologia. Use exclusivamente o material recuperado pela busca nos arquivos. Retorne ate 10 pensatas, paragrafos ou trechos curtos realmente relacionados ao tema pedido. Se nao houver material suficiente, diga exatamente: Nenhuma correspondencia encontrada na Vector Store LO.",
              },
              {
                role: "user",
                content:
                  `Localize pensatas afins ao termo abaixo e devolva apenas a lista final em Markdown numerado.\n\n` +
                  `Termo de busca: ${text}`,
              },
            ],
            vectorStoreIds,
            inputFileIds,
          })
        ).content.trim();
        if (!content || content === "Nenhuma correspondencia encontrada na Vector Store LO.") {
          toast.info("Nenhuma correspond\u00eancia encontrada na Vector Store LO.");
        } else {
          addResponse("pensatas", text.slice(0, 80), content);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erro ao buscar Pensatas LO.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      let editorPlainTextContext = "";
      let editorContextTruncated = false;
      if (type === "ai_command" && currentFileId) {
        const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
        const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
        const normalizedEditorText = (latestEditorText || "").trim();
        editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
        editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      }
      const promptMap = {
        define: (t: string) => buildDefinePrompt(t),
        synonyms: (t: string) => buildSynonymsPrompt(t),
        epigraph: (t: string) => buildEpigraphPrompt(t),
        rewrite: buildRewritePrompt,
        summarize: buildSummarizePrompt,
        translate: (t: string) => buildTranslatePrompt(t, translateLanguage),
        ai_command: (t: string) => buildAiCommandPrompt(t, query),
      };

      const messages = promptMap[type](text);
      if (type === "ai_command" && includeEditorContextInLlm && editorPlainTextContext.trim()) {
        const truncTag = editorContextTruncated ? " [TRUNCADO]" : "";
        messages.splice(1, 0, {
          role: "user",
          content:
            `Contexto adicional do documento aberto no editor HTML (texto plano)${truncTag}:\n\n` +
            `<<<EDITOR_HTML_TEXT>>>\n${editorPlainTextContext}\n<<<END_EDITOR_HTML_TEXT>>>`,
        });
      }
      if (type === "translate" && vectorStoreIds.length === 0) {
        throw new Error("Selecione ao menos 1 Vector Store na configuracao de Acoes IA.");
      }
      const result = (await executeAiActionsLLMWithLog({ messages, vectorStoreIds, inputFileIds })).content;
      const historyQuery = type === "ai_command" ? query : text.slice(0, 80);
      addResponse(type, historyQuery, result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro na chamada a IA.");
    } finally {
      setIsLoading(false);
    }
  }, [actionText, aiCommandQuery, backendNotReadyMessage, currentFileId, documentText, executeAiActionsLLMWithLog, htmlEditorControlApi, includeEditorContextInLlm, llmEditorContextMaxChars, openAiReady, translateLanguage]);

  const handleOpenAiActionParameters = useCallback((type: AiActionId) => {
    setParameterPanelTarget({ section: getAiPanelScopeByAction(type), id: type });
    if (type !== "translate" && type !== "ai_command") {
      void handleAction(type);
    }
  }, [handleAction]);

  const handleOpenAiCommandPanel = useCallback(() => {
    setParameterPanelTarget({ section: "actions", id: "ai_command" });
  }, []);

  const handleChat = useCallback(async (message: string) => {
    if (!openAiReady) {
      toast.error(backendNotReadyMessage());
      return;
    }
    setIsLoading(true);
    try {
      let editorPlainTextContext = "";
      let editorContextTruncated = false;
      if (currentFileId) {
        const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
        const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
        const normalizedEditorText = (latestEditorText || "").trim();
        editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
        editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      }
      const messages = buildChatPrompt(message, chatHistory, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm);
      const chatStoreIds = getGlobalVectorStoreIds();
      const chatFileIds = uploadedChatFiles.map((file) => file.id).filter(Boolean);
      const llmResponse = await executeLLMWithLog({
        messages,
        previousResponseId: chatPreviousResponseId ?? undefined,
        vectorStoreIds: chatStoreIds,
        inputFileIds: chatFileIds,
      });
      const result = llmResponse.content.trim();
      const nextResponseId = llmResponse.meta?.id;
      if (nextResponseId) setChatPreviousResponseId(nextResponseId);
      const finalContent = result || "Sem conteudo retornado pela IA.";
      setChatHistory((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: finalContent }]);
      addResponse("chat", message, finalContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar chat.";
      toast.error(msg);
      addResponse("chat", message, `Erro no chat: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [backendNotReadyMessage, chatHistory, chatPreviousResponseId, currentFileId, documentText, executeLLMWithLog, getGlobalVectorStoreIds, htmlEditorControlApi, includeEditorContextInLlm, llmEditorContextMaxChars, openAiReady, uploadedChatFiles]);

  const handleEditorContentChange = useCallback(({ html, text }: { html: string; text: string }) => {
    setEditorContentHtml(html);
    setDocumentText(text);
    if (!currentFileId) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void saveFileText(currentFileId, { text, html }).catch(() => {
        // silencioso para evitar toasts em cada tecla
      });
    }, 600);
  }, [currentFileId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const applyMobileState = (isMobile: boolean) => {
      setIsMobileView(isMobile);
      setIsMobileMenuOpen(false);
    };
    applyMobileState(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => applyMobileState(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleExportDocx = useCallback(async () => {
    if (!currentFileId) {
      toast.error("Nenhum documento aberto para exportar.");
      return;
    }

    setIsExportingDocx(true);
    try {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      let latestText = documentText;
      let latestHtml = editorContentHtml;
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      if (editorApi) {
        latestText = await editorApi.getDocumentText();
        latestHtml = await editorApi.getDocumentHtml();
      }
      await saveFileText(currentFileId, { text: latestText, html: latestHtml });
      const blob = await buildDocxBlobFromHtml(latestHtml || "<p></p>");
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = (currentFileName || "documento").trim();
      const fileName = baseName.toLowerCase().endsWith(".docx") ? baseName : `${baseName}.docx`;
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      //toast.success("Documento DOCX exportado.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao exportar DOCX.");
    } finally {
      setIsExportingDocx(false);
    }
  }, [currentFileId, currentFileName, documentText, editorContentHtml, htmlEditorControlApi]);

  const handleCloseEditorWithPrompt = useCallback(async () => {
    const shouldDownload = window.confirm("Deseja baixar o arquivo antes de fechar o editor?");
    if (shouldDownload) {
      await handleExportDocx();
    }
    setCurrentFileId("");
    setCurrentFileName("");
    setCurrentFileConvertedFromPdf(false);
  }, [handleExportDocx]);

  const isHistoryProcessing =
    isLoading || isRunningInsertRefBook || isRunningInsertRefVerbete || isRunningBiblioGeral || isRunningBiblioExterna || isRunningLexicalSearch || isRunningSemanticSearch || isRunningVerbeteSearch || isRunningVerbetografiaOpenTable || isRunningVerbeteDefinologia || isRunningVerbeteFraseEnfatica || isRunningVerbeteSinonimologia || isRunningVerbeteFatologia;
  const hasEditorPanel = Boolean(currentFileId) || isOpeningDocument;
  const hasCenterPanel = Boolean(parameterPanelTarget);
  const parameterPanelHeaderMeta = parameterPanelTarget
    ? getParameterPanelHeaderMeta(parameterPanelTarget, appPanelScope)
    : null;
  const hasJsonPanel = isJsonLogPanelOpen;
  const layoutResetKey = hasEditorPanel ? "layout-with-editor" : "layout-without-editor";
  const mobilePanelOptions: Array<{ id: MobilePanelId; label: string; disabled?: boolean }> = [
    { id: "json", label: "Json", disabled: !hasJsonPanel },
    { id: "left", label: "Painel" },
    { id: "center", label: "Parametros", disabled: !hasCenterPanel },
    { id: "right", label: "Chat" },
    { id: "editor", label: "Editor", disabled: !hasEditorPanel },
  ];
  const showJsonPanel = hasJsonPanel && (!isMobileView || activeMobilePanel === "json");
  const showLeftPanel = !isMobileView || activeMobilePanel === "left";
  const showCenterPanel = hasCenterPanel && (!isMobileView || activeMobilePanel === "center");
  const showRightPanel = !isMobileView || activeMobilePanel === "right";
  const showEditorPanel = hasEditorPanel && (!isMobileView || activeMobilePanel === "editor");
  const showHandleAfterLeft = showLeftPanel && (showCenterPanel || showRightPanel || showEditorPanel);
  const showHandleAfterCenter = showCenterPanel && (showRightPanel || showEditorPanel);
  const showHandleAfterRight = showRightPanel && (showJsonPanel || showEditorPanel);
  const showHandleAfterJson = showJsonPanel && showEditorPanel;
  const llmLogFontStyle = { fontSize: `${llmLogFontScale}em`, lineHeight: DEFAULT_LOG_LINE_HEIGHT_RATIO };
  const latestLlmLog = llmLogs[0];
  const latestLlmMeta = (latestLlmLog?.response && typeof latestLlmLog.response === "object" && "meta" in (latestLlmLog.response as Record<string, unknown>))
    ? ((latestLlmLog.response as { meta?: Record<string, unknown> }).meta ?? {})
    : {};
  const usageFromMeta = (meta: Record<string, unknown>) => (
    meta.usage && typeof meta.usage === "object"
      ? (meta.usage as Record<string, unknown>)
      : {}
  );
  const inputTokensFromUsage = (usage: Record<string, unknown>) => Number(usage.input_tokens ?? usage.prompt_tokens ?? 0) || 0;
  const cachedInputTokensFromUsage = (usage: Record<string, unknown>) => Number((usage.input_token_details as { cached_tokens?: number } | undefined)?.cached_tokens ?? 0) || 0;
  const outputTokensFromUsage = (usage: Record<string, unknown>) => Number(usage.output_tokens ?? usage.completion_tokens ?? 0) || 0;
  const totalTokensFromUsage = (usage: Record<string, unknown>) => {
    const input = inputTokensFromUsage(usage);
    const output = outputTokensFromUsage(usage);
    return Number(usage.total_tokens ?? input + output) || 0;
  };
  const reasoningTokensFromUsage = (usage: Record<string, unknown>) => Number((usage.output_token_details as { reasoning_tokens?: number } | undefined)?.reasoning_tokens ?? 0) || 0;
  const latestUsage = usageFromMeta(latestLlmMeta);
  const latestInputTokens = inputTokensFromUsage(latestUsage);
  const latestCachedInputTokens = cachedInputTokensFromUsage(latestUsage);
  const latestOutputTokens = outputTokensFromUsage(latestUsage);
  const latestTotalTokens = totalTokensFromUsage(latestUsage);
  const latestReasoningTokens = reasoningTokensFromUsage(latestUsage);
  const latestRagReferences = Array.isArray(latestLlmMeta.rag_references)
    ? (latestLlmMeta.rag_references as unknown[]).map((ref) => String(ref || "").trim()).filter(Boolean)
    : [];

  let inputTokens = 0;
  let cachedInputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let reasoningTokens = 0;
  const ragReferenceSet = new Set<string>();
  let successfulCallsCount = 0;
  let errorCallsCount = 0;

  for (const log of llmSessionLogs) {
    if (log.error) errorCallsCount += 1;
    if (!log.response || typeof log.response !== "object" || !("meta" in (log.response as Record<string, unknown>))) continue;
    successfulCallsCount += 1;
    const meta = ((log.response as { meta?: Record<string, unknown> }).meta ?? {});
    const usage = usageFromMeta(meta);
    inputTokens += inputTokensFromUsage(usage);
    cachedInputTokens += cachedInputTokensFromUsage(usage);
    outputTokens += outputTokensFromUsage(usage);
    totalTokens += totalTokensFromUsage(usage);
    reasoningTokens += reasoningTokensFromUsage(usage);
    if (Array.isArray(meta.rag_references)) {
      for (const ref of meta.rag_references) {
        const normalized = String(ref || "").trim();
        if (normalized) ragReferenceSet.add(normalized);
      }
    }
  }
  const latestRagReferencesAllCalls = Array.from(ragReferenceSet);
  const usdToBrl = DEFAULT_DOLLAR_TOKEN;
  const effectiveModel = String(latestLlmMeta.model ?? llmModel ?? "");
  const modelPricingUsdPer1M: Record<string, { input: number; cached_input: number; output: number }> = {
    "gpt-5.4-under-272k": { input: 2.5, cached_input: 0.25, output: 15.0 },
    "gpt-5.4-over-272k": { input: 5.0, cached_input: 0.5, output: 22.5 },
    "gpt-5.2": { input: 1.75, cached_input: 0.175, output: 14.0 },
    "gpt-5-mini": { input: 0.25, cached_input: 0.025, output: 2.0 },
    "gpt-4.1-mini": { input: 0.4, cached_input: 0.1, output: 1.6 },
  };
  const pricingForModelAndInput = (model: string, modelInputTokens: number) => {
    const normalizedModel = model.toLowerCase();
    const isGpt54 = normalizedModel.startsWith("gpt-5.4");
    const matchedPricingKey = isGpt54
      ? (modelInputTokens > 272_000 ? "gpt-5.4-over-272k" : "gpt-5.4-under-272k")
      : (Object.keys(modelPricingUsdPer1M).find((key) => normalizedModel.startsWith(key)) ?? "");
    return matchedPricingKey ? modelPricingUsdPer1M[matchedPricingKey] : null;
  };

  const estimateUsdFromMeta = (meta: Record<string, unknown>) => {
    const usage = usageFromMeta(meta);
    const model = String(meta.model ?? "").trim();
    if (!model) return null;
    const localInput = inputTokensFromUsage(usage);
    const localCachedInput = cachedInputTokensFromUsage(usage);
    const localOutput = outputTokensFromUsage(usage);
    const localNonCachedInput = Math.max(0, localInput - localCachedInput);
    const pricing = pricingForModelAndInput(model, localInput);
    if (!pricing) return null;
    return (
      (localNonCachedInput * pricing.input) +
      (localCachedInput * pricing.cached_input) +
      (localOutput * pricing.output)
    ) / 1_000_000;
  };

  let estimatedUsdAccumulator = 0;
  let estimatedUsdAvailableCount = 0;
  for (const log of llmSessionLogs) {
    if (!log.response || typeof log.response !== "object" || !("meta" in (log.response as Record<string, unknown>))) continue;
    const meta = ((log.response as { meta?: Record<string, unknown> }).meta ?? {});
    const estimated = estimateUsdFromMeta(meta);
    if (estimated == null) continue;
    estimatedUsdAccumulator += estimated;
    estimatedUsdAvailableCount += 1;
  }
  const estimatedUsd = estimatedUsdAvailableCount > 0 ? estimatedUsdAccumulator : null;
  const estimatedBrl = estimatedUsd != null ? estimatedUsd * usdToBrl : null;
  const latestEstimatedUsd = estimateUsdFromMeta(latestLlmMeta);
  const latestEstimatedBrl = latestEstimatedUsd != null ? latestEstimatedUsd * usdToBrl : null;

  useEffect(() => {
    if (!isMobileView) return;
    if (activeMobilePanel === "json" && !hasJsonPanel) {
      setActiveMobilePanel("left");
      return;
    }
    if (activeMobilePanel === "center" && !hasCenterPanel) {
      setActiveMobilePanel(hasEditorPanel ? "editor" : "left");
      return;
    }
    if (activeMobilePanel === "editor" && !hasEditorPanel) {
      setActiveMobilePanel("left");
    }
  }, [activeMobilePanel, hasCenterPanel, hasEditorPanel, hasJsonPanel, isMobileView]);

  useEffect(() => {
    if (!isMobileView) {
      previousHasEditorPanelRef.current = hasEditorPanel;
      return;
    }
    if (!previousHasEditorPanelRef.current && hasEditorPanel) {
      setActiveMobilePanel("editor");
    }
    previousHasEditorPanelRef.current = hasEditorPanel;
  }, [hasEditorPanel, isMobileView]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {isMobileView && (
        <div className="relative flex h-14 items-center justify-between border-b border-border bg-card px-3">
          <span className="text-sm font-semibold text-foreground">
            {mobilePanelOptions.find((option) => option.id === activeMobilePanel)?.label ?? "Painel"}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label="Abrir menu de paineis"
          >
            <Menu className="h-4 w-4" />
          </Button>
          {isMobileMenuOpen && (
            <div className="absolute right-3 top-12 z-20 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
              {mobilePanelOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) return;
                    setActiveMobilePanel(option.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded px-3 py-2 text-left text-sm ${
                    option.id === activeMobilePanel ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <ResizablePanelGroup key={layoutResetKey} direction="horizontal" className={isMobileView ? "h-[calc(100vh-3.5rem)]" : ""}>
        {showLeftPanel && (
          <ResizablePanel
            id="left-panel"
            order={1}
            defaultSize={PANEL_SIZES.left.default}
            minSize={PANEL_SIZES.left.min}
            maxSize={PANEL_SIZES.left.max}
            className="border-r border-border bg-card"
          >
            <LeftPanel
              onOpenParameterSection={handleOpenParameterSection}
              onOpenGeneralSettings={handleOpenGeneralSettings}
              onOpenAiCommand={handleOpenAiCommandPanel}
              onOpenVerbetografiaTable={handleOpenVerbetografiaTableFromLeft}
              onRunRandomPensata={handleRunRandomPensata}
              onOpenBookSearch={handleOpenBookSearchFromLeft}
              onOpenSemanticSearch={handleOpenSemanticSearchFromLeft}
              onOpenVerbetografia={handleOpenVerbetografiaFromLeft}
              onToggleJsonPanel={() => {
                setIsJsonLogPanelOpen((prev) => !prev);
                if (isMobileView) setActiveMobilePanel("json");
              }}
              isJsonPanelOpen={isJsonLogPanelOpen}
              isLoading={isLoading}
            />
          </ResizablePanel>
        )}

        {showHandleAfterLeft && <ResizableHandle withHandle />}

        {showCenterPanel && (
          <>
            <ResizablePanel
              id="parameter-panel"
              order={2}
              defaultSize={PANEL_SIZES.parameter.default}
              minSize={PANEL_SIZES.parameter.min}
              maxSize={PANEL_SIZES.parameter.max}
              className={`border-r border-border ${sidePanelClass}`}
            >
                  <div className="flex h-full flex-col">
                    <div className={`flex items-start justify-between border-b border-border ${panelsTopMenuBarBgClass} px-4 py-3`}>
                      <div className="space-y-1">
                        <h2 className="text-sm font-semibold text-foreground">{parameterPanelHeaderMeta?.title ?? "Parameters"}</h2>
                        {parameterPanelHeaderMeta?.description ? (
                          <p className="text-xs text-muted-foreground">{parameterPanelHeaderMeta.description}</p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setParameterPanelTarget(null)}
                        title={`Fechar ${parameterPanelHeaderMeta?.title ?? "Parameters"}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {parameterPanelTarget.section !== "document"
                      && parameterPanelTarget.section !== "sources"
                      && parameterPanelTarget.section !== "settings"
                      && !(parameterPanelTarget.section === "actions" && parameterPanelTarget.id === "ai_command")
                      && !(parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app7")
                      && !(parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app12") && (
                      <div className="border-b border-border p-3">
                        <div className="grid grid-cols-1 gap-2">
                        {(parameterPanelTarget.section === "actions" || parameterPanelTarget.section === "rewriting" || parameterPanelTarget.section === "translation") && (
                          <>
                            {(parameterPanelTarget.section === "actions" || parameterPanelTarget.section === "rewriting" || parameterPanelTarget.section === "translation") ? (
                              <div className="mb-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => toggleLlmConfigPanel("ai_actions")}
                                  title={isAiActionsConfigOpen ? "Ocultar configuracoes de Acoes IA" : "Mostrar configuracoes de Acoes IA"}
                                  aria-label={isAiActionsConfigOpen ? "Ocultar configuracoes de Acoes IA" : "Mostrar configuracoes de Acoes IA"}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground shadow-sm transition hover:bg-zinc-50 hover:text-foreground"
                                >
                                  <Settings className="h-4 w-4" />
                                </button>
                              </div>
                            ) : null}
                          {ACTION_PANEL_BUTTONS_BY_SCOPE[parameterPanelTarget.section].map((id) => (
                          (() => {
                            const Icon = ACTION_PANEL_ICONS[id];
                            return (
                          <Button
                            key={id}
                            variant="ghost"
                            className={sectionActionButtonClass}
                            onClick={() => handleOpenAiActionParameters(id)}
                            disabled={isLoading || (id === "pensatas" && !LLM_VECTOR_STORE_LO)}
                          >
                            <Icon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block break-words text-sm font-medium text-foreground">{parameterActionMeta[id].title}</span>
                              <span className="block break-words text-xs text-muted-foreground">{parameterActionMeta[id].description}</span>
                            </span>
                          </Button>
                            );
                          })()
                        ))}
                          </>
                        )}


                      
                        {parameterPanelTarget.section === "apps" &&
                          APP_PANEL_BUTTONS_BY_SCOPE[appPanelScope ?? "bibliografia"].map((id) => (
                          (() => {
                            const Icon = APP_PANEL_ICONS[id];
                            return (


                              
                          <div key={id} className="space-y-2">
{appPanelScope === "verbetografia" && id === "app8" ? (
                              <>
                                <div className="mb-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => toggleLlmConfigPanel("ai_actions")}
                                    title={isAiActionsConfigOpen ? "Ocultar configuracoes de Acoes IA" : "Mostrar configuracoes de Acoes IA"}
                                    aria-label={isAiActionsConfigOpen ? "Ocultar configuracoes de Acoes IA" : "Mostrar configuracoes de Acoes IA"}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground shadow-sm transition hover:bg-zinc-50 hover:text-foreground"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </button>
                                </div>
                                <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Seções do Verbete
                                </p>
                              </>
                            ) : null}
                          <Button
                            variant="ghost"
                            className={sectionActionButtonClass}
                            onClick={() => handleActionApps(id)}
                            disabled={isLoading}
                          >
                            <Icon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block break-words text-sm font-medium text-foreground">{parameterAppMeta[id].title}</span>
                              <span className="block break-words text-xs text-muted-foreground">{parameterAppMeta[id].description}</span>
                            </span>
                          </Button>
                          </div>
                            );
                          })()
                        ))}
                        </div>
                      </div>
                    )}

                    <div className="min-h-0 flex-1">
                      {parameterPanelTarget.section === "document" ? (
                        <div className="h-full overflow-y-auto p-3">
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parâmetros Documento</Label>

                            <Button
                              variant="secondary"
                              size="sm"
                              className={`${sectionActionButtonClass} ${uploadDocBgClass} hover:bg-muted/30`}
                              onClick={() => void handleCreateBlankDocument()}
                              disabled={isLoading || isOpeningDocument || isImportingDocument}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Novo Documento em Branco</span>
                            </Button>

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".docx,.pdf"
                              className="hidden"
                              onChange={(e) => void handleDocumentPanelFile(e.target.files?.[0])}
                            />

                            {!selectedImportFileName ? (
                              <div
                                onDrop={handleDocumentPanelDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className={`cursor-pointer rounded-lg border-2 border-dashed border-border ${uploadDocBgClass} p-3 text-center hover:bg-muted/30`}
                              >
                                {isImportingDocument ? (
                                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-muted-foreground" />
                                ) : (
                                  <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                                )}
                                <span className="text-sm text-foreground">Arraste ou selecione</span>
                                <span className="mt-1 block text-xs text-muted-foreground">DOCX ou PDF</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                                <FileText className="h-4 w-4 shrink-0 text-primary" />
                                <span className="truncate text-sm text-foreground">{selectedImportFileName}</span>
                                <button
                                  type="button"
                                  className="ml-auto text-muted-foreground hover:text-destructive"
                                  onClick={() => setSelectedImportFileName("")}
                                  aria-label="Remover arquivo"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}

                            <Separator className="my-1" />

                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estatísticas</Label>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => void handleRefreshStats()} title="Atualizar">
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { icon: FileText, label: "Páginas", value: stats.pages },
                                  { icon: AlignLeft, label: "Parágrafos", value: stats.paragraphs },
                                  { icon: Type, label: "Palavras", value: stats.words },
                                  { icon: Hash, label: "Caracteres", value: stats.characters },
                                  { icon: Sparkles, label: "Logias", value: stats.logiaWords },
                                  { icon: BookOpen, label: "Sesquipedais", value: stats.sesquipedal },
                                ].map(({ icon: Icon, label, value }) => (
                                  <div key={label} className="rounded-md bg-muted/50 px-2.5 py-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <Icon className="h-3.5 w-3.5" />
                                      {label}
                                    </div>
                                    <div className="text-sm font-semibold text-[hsl(var(--stat-value))]">{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <Separator className="my-1" />

                            <div className="space-y-2">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Editor de Texto</Label>
                              <Button
                                variant="ghost"
                                className={sectionActionButtonClass}
                                onClick={() => void handleActionMacros("macro1")}
                                disabled={isLoading || !currentFileId}
                              >
                                <BookOpen className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                                <span className="min-w-0 flex-1 text-left">
                                  <span className="block break-words text-sm font-medium text-foreground">{parameterMacroMeta.macro1.title}</span>
                                  <span className="block break-words text-xs text-muted-foreground">{parameterMacroMeta.macro1.description}</span>
                                </span>
                              </Button>

                              <Button
                                variant="ghost"
                                className={sectionActionButtonClass}
                                onClick={() => void handleActionMacros("macro2")}
                                disabled={isLoading || !currentFileId}
                              >
                                <ListOrdered className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                                <span className="min-w-0 flex-1 text-left">
                                  <span className="block break-words text-sm font-medium text-foreground">{parameterMacroMeta.macro2.title}</span>
                                  <span className="block break-words text-xs text-muted-foreground">{parameterMacroMeta.macro2.description}</span>
                                </span>
                              </Button>
                            </div>

                            {parameterPanelTarget.id && <Separator className="my-1" />}

                            {parameterPanelTarget.id === "macro1" ? (
                              <Macro1HighlightPanel
                                title={parameterMacroMeta.macro1.title}
                                description={parameterMacroMeta.macro1.description}
                                term={macro1Term}
                                onTermChange={setMacro1Term}
                                colorOptions={MACRO1_HIGHLIGHT_COLORS.map((item) => ({ ...item }))}
                                selectedColorId={macro1ColorId}
                                onSelectColor={(value) => setMacro1ColorId(value as (typeof MACRO1_HIGHLIGHT_COLORS)[number]["id"])}
                                onRunHighlight={() => void handleRunMacro1Highlight()}
                                onRunClear={() => void handleClearMacro1Highlight()}
                                isRunning={isLoading}
                                predictedMatches={macro1PredictedMatches}
                                isCountingMatches={isCountingMacro1Matches}
                                hasDocumentOpen={Boolean(currentFileId)}
                                showPanelChrome={false}
                              />
                            ) : null}

                            {parameterPanelTarget.id === "macro2" ? (
                              <Macro2ManualNumberingPanel
                                title={parameterMacroMeta.macro2.title}
                                description={parameterMacroMeta.macro2.description}
                                spacingMode={macro2SpacingMode}
                                onSpacingModeChange={setMacro2SpacingMode}
                                isRunning={isLoading}
                                onRun={() => void handleRunMacro2ManualNumbering()}
                                showPanelChrome={false}
                              />
                            ) : null}
                          </div>
                        </div>
                      ) : parameterPanelTarget.section === "sources" ? (
                        <SourcesPanel
                          onUploadFiles={(files) => void handleUploadSourceFiles(files)}
                          bookSources={BOOK_SOURCE.map((item) => ({ ...item }))}
                          vectorStoreSources={VECTOR_STORES_SOURCE.map((item) => ({ ...item }))}
                          selectedBookSourceIds={selectedBookSourceIds}
                          onToggleBookSource={handleToggleBookSource}
                          uploadedFiles={uploadedChatFiles}
                          onRemoveUploadedFile={handleRemoveUploadedChatFile}
                          isUploadingFiles={isUploadingChatFiles}
                        />
                      ) : parameterPanelTarget.section === "settings" ? (
                        <div className="h-full overflow-y-auto p-3">
                          <div className="space-y-3">
                            {parameterPanelTarget.id === "general" ? (
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico</Label>
                                  <p className="text-xs text-muted-foreground">Os controles de numeração e referências foram movidos para a barra superior do painel Histórico.</p>
                                </div>
                              </div>
                            ) : (
                              <>

                                                                                    {activeLlmConfigPanel ? (
                              <>
                                <Separator className="my-4" />
                                <div className="h-3" />
                                <div className="space-y-3">
                                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {activeLlmConfigPanel === "chat"
                                      ? "Configurações LLM Chat"
                                      : activeLlmConfigPanel === "ai_actions"
                                        ? "Configurações LLM Ações"
                                        : "Configurações LLM Biblio"}
                                  </Label>

                                  {activeLlmConfigPanel === "chat" ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Modelo</Label>
                                        <select value={llmModel} onChange={(e) => setLlmModel(e.target.value)} className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none">
                                          <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                                          <option value="gpt-5-mini">gpt-5-mini</option>
                                          <option value="gpt-5.2">gpt-5.2</option>
                                          <option value="gpt-5.4">gpt-5.4</option>
                                        </select>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Temperatura</Label>
                                        <Input type="number" step="0.1" min="0" max="2" value={llmTemperature} onChange={(e) => setLlmTemperature(Number(e.target.value))} className="h-8 text-[11px]" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Output Tokens</Label>
                                        <Input type="number" min="1" value={llmMaxOutputTokens} onChange={(e) => setLlmMaxOutputTokens(e.target.value ? Number(e.target.value) : 500)} className="h-8 text-[11px]" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Num Results</Label>
                                        <Input type="number" min="1" max="20" value={llmMaxNumResults} onChange={(e) => setLlmMaxNumResults(e.target.value ? Number(e.target.value) : 5)} className="h-8 text-[11px]" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Context Max Chars</Label>
                                        <Input type="number" min="500" value={llmEditorContextMaxChars} onChange={(e) => setLlmEditorContextMaxChars(e.target.value ? Number(e.target.value) : CHAT_EDITOR_CONTEXT_MAX_CHARS)} className="h-8 text-[11px]" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Verbosity</Label>
                                        <Input value={llmVerbosity} onChange={(e) => setLlmVerbosity(e.target.value)} placeholder="low | medium | high" className="h-8 text-[11px]" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Effort</Label>
                                        <Input value={llmEffort} onChange={(e) => setLlmEffort(e.target.value)} placeholder="minimal | low | medium | high" className="h-8 text-[11px]" />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="w-36 shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">System Prompt</Label>
                                        <textarea value={llmSystemPrompt} onChange={(e) => setLlmSystemPrompt(e.target.value)} rows={10} className="w-full rounded-md border border-input bg-white px-3 py-2 text-[11px] text-foreground outline-none resize-none overflow-y-auto" />
                                      </div>
                                    </>
                                  ) : null}

                                </div>
                              </>
                            ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      ) : parameterPanelTarget.section === "actions" || parameterPanelTarget.section === "rewriting" || parameterPanelTarget.section === "translation" ? (
                        <div className="flex h-full flex-col">
                          <div className="min-h-0 flex-1">
                            <AiActionParametersPanel
                              title={parameterPanelTarget.id ? parameterActionMeta[parameterPanelTarget.id].title : parameterPanelTarget.section === "rewriting" ? "Reescrita" : parameterPanelTarget.section === "translation" ? "Traducao & Dicionario" : "Termos & Conceitos"}
                              description={
                                parameterPanelTarget.id
                                  ? parameterActionMeta[parameterPanelTarget.id].description
                                  : "Definir e listar sinônimos."
                              }
                              actionText={actionText}
                              onActionTextChange={setActionText}
                              queryText={parameterPanelTarget.id === "ai_command" ? aiCommandQuery : undefined}
                              onQueryTextChange={parameterPanelTarget.id === "ai_command" ? setAiCommandQuery : undefined}
                              onRetrieveSelectedText={() => void handleRetrieveSelectedText()}
                              onApply={() => {
                                if (!parameterPanelTarget.id) return;
                                void handleAction(parameterPanelTarget.id as AiActionId);
                              }}
                              isLoading={isLoading}
                              hasDocumentOpen={Boolean(currentFileId)}
                              showLanguageSelect={parameterPanelTarget.id === "translate"}
                              languageOptions={TRANSLATE_LANGUAGE_OPTIONS.map((option) => ({ ...option }))}
                              selectedLanguage={translateLanguage}
                              onSelectedLanguageChange={(value) => setTranslateLanguage(value as (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"])}
                              showApplyButton={parameterPanelTarget.id === "translate" || parameterPanelTarget.id === "ai_command"}
                              showConfigButton={parameterPanelTarget.id === "ai_command"}
                              onToggleConfig={parameterPanelTarget.id === "ai_command" ? () => toggleLlmConfigPanel("ai_actions") : undefined}
                              isConfigOpen={parameterPanelTarget.id === "ai_command" ? isAiActionsConfigOpen : false}
                              showActionTextArea={parameterPanelTarget.id !== "ai_command"}
                              showPanelChrome={false}
                            />
                          </div>
                          {(parameterPanelTarget.section === "actions" || parameterPanelTarget.section === "rewriting" || parameterPanelTarget.section === "translation") && isAiActionsConfigOpen ? (
                            <div className="border-t border-border p-4">
                              <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Modelo</Label>
                                    <select value={aiActionsLlmModel} onChange={(e) => setAiActionsLlmModel(e.target.value)} className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none">
                                      <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                                      <option value="gpt-5-mini">gpt-5-mini</option>
                                      <option value="gpt-5.2">gpt-5.2</option>
                                      <option value="gpt-5.4">gpt-5.4</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Temperatura</Label>
                                    <Input type="number" step="0.1" min="0" max="2" value={aiActionsLlmTemperature} onChange={(e) => setAiActionsLlmTemperature(Number(e.target.value))} className="h-8 text-[11px]" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Output Tokens</Label>
                                    <Input type="number" min="1" value={aiActionsLlmMaxOutputTokens} onChange={(e) => setAiActionsLlmMaxOutputTokens(e.target.value ? Number(e.target.value) : 500)} className="h-8 text-[11px]" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Verbosity</Label>
                                    <Input value={aiActionsLlmVerbosity} onChange={(e) => setAiActionsLlmVerbosity(e.target.value)} placeholder="low | medium | high" className="h-8 text-[11px]" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Effort</Label>
                                    <Input value={aiActionsLlmEffort} onChange={(e) => setAiActionsLlmEffort(e.target.value)} placeholder="none | low | medium | high" className="h-8 text-[11px]" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vector Store</Label>
                                    <select
                                      value={aiActionsSelectedVectorStoreIds[0] ?? ""}
                                      onChange={(e) => setAiActionsSelectedVectorStoreIds(e.target.value ? [e.target.value] : [])}
                                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none"
                                    >
                                      <option value="">none</option>
                                      {aiActionVectorStoreOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">inputFileIds</Label>
                                    <Button
                                      variant="ghost"
                                      className={sectionActionButtonClass}
                                      onClick={() => {
                                        aiActionsUploadInputRef.current?.click();
                                      }}
                                    >
                                      <Upload className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                                      <span className="min-w-0 flex-1 text-left">
                                        <span className="block break-words text-sm font-medium text-foreground">Upload Arquivos</span>
                                      </span>
                                    </Button>
                                    <input
                                      ref={aiActionsUploadInputRef}
                                      type="file"
                                      multiple
                                      className="hidden"
                                      onClick={(event) => {
                                        event.currentTarget.value = "";
                                      }}
                                      onChange={(event) => {
                                        const files = Array.from(event.target.files ?? []);
                                        if (files.length > 0) void handleUploadSourceFiles(files);
                                      }}
                                    />
                                    {isUploadingChatFiles ? (
                                      <div className="rounded border border-border bg-white px-2 py-2 text-xs text-muted-foreground">
                                        Enviando arquivos para a OpenAI...
                                      </div>
                                    ) : null}
                                    {uploadedChatFiles.length > 0 ? (
                                      <div className="space-y-2">
                                        {uploadedChatFiles.map((file) => (
                                          <div key={file.id} className="rounded border border-border bg-white px-2 py-2">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0 flex-1">
                                                <p className="break-words text-xs font-medium text-foreground">{file.filename}</p>
                                                <p className="text-[11px] text-muted-foreground">{file.bytes} bytes</p>
                                              </div>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[11px]"
                                                onClick={() => handleRemoveUploadedChatFile(file.id)}
                                              >
                                                Remover
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="rounded border border-dashed border-border bg-white px-2 py-2 text-xs text-muted-foreground">
                                        Nenhum arquivo anexado
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app1" ? (
                        <InsertRefBookPanel
                          title={parameterAppMeta.app1.title}
                          description={parameterAppMeta.app1.description}
                          selectedRefBook={selectedRefBook}
                          refBookPages={refBookPages}
                          onSelectRefBook={handleSelectRefBook}
                          onRefBookPagesChange={setRefBookPages}
                          onRunInsertRefBook={() => void handleRunInsertRefBook()}
                          isRunningInsertRefBook={isRunningInsertRefBook}
                          showPanelChrome={false}
                        />
                      ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app2" ? (
                        <InsertRefVerbetePanel
                          title={parameterAppMeta.app2.title}
                          description={parameterAppMeta.app2.description}
                          verbeteInput={verbeteInput}
                          onVerbeteInputChange={setVerbeteInput}
                          onRun={() => void handleRunInsertRefVerbete()}
                          isRunning={isRunningInsertRefVerbete}
                          showPanelChrome={false}
                        />
                      ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app3" ? (
                        <BiblioGeralPanel
                          title={parameterAppMeta.app3.title}
                          description={parameterAppMeta.app3.description}
                          author={biblioGeralAuthor}
                          titleField={biblioGeralTitle}
                          year={biblioGeralYear}
                          extra={biblioGeralExtra}
                          onAuthorChange={setBiblioGeralAuthor}
                          onTitleFieldChange={setBiblioGeralTitle}
                          onYearChange={setBiblioGeralYear}
                          onExtraChange={setBiblioGeralExtra}
                          onRun={() => void handleRunBiblioGeral()}
                          isRunning={isRunningBiblioGeral}
                          showPanelChrome={false}
                        />
                      ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app6" ? (
                        <BiblioExternaPanel
                          title={parameterAppMeta.app6.title}
                          description={parameterAppMeta.app6.description}
                          author={biblioExternaAuthor}
                          titleField={biblioExternaTitle}
                          year={biblioExternaYear}
                          journal={biblioExternaJournal}
                          publisher={biblioExternaPublisher}
                          identifier={biblioExternaIdentifier}
                          extra={biblioExternaExtra}
                          freeText={biblioExternaFreeText}
                          onAuthorChange={setBiblioExternaAuthor}
                          onTitleFieldChange={setBiblioExternaTitle}
                          onYearChange={setBiblioExternaYear}
                          onJournalChange={setBiblioExternaJournal}
                          onPublisherChange={setBiblioExternaPublisher}
                          onIdentifierChange={setBiblioExternaIdentifier}
                          onExtraChange={setBiblioExternaExtra}
                          onFreeTextChange={setBiblioExternaFreeText}
                          onRun={() => void handleRunBiblioExterna()}
                          isRunning={isRunningBiblioExterna}
                          onToggleConfig={() => toggleLlmConfigPanel("biblio_externa")}
                          isConfigOpen={isBiblioExternaConfigOpen}
                          configContent={
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Modelo</Label>
                                <select value={biblioExternaLlmModel} onChange={(e) => setBiblioExternaLlmModel(e.target.value)} className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none">
                                  <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                                  <option value="gpt-5-mini">gpt-5-mini</option>
                                  <option value="gpt-5.2">gpt-5.2</option>
                                  <option value="gpt-5.4">gpt-5.4</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Temperatura</Label>
                                <Input type="number" step="0.1" min="0" max="2" value={biblioExternaLlmTemperature} onChange={(e) => setBiblioExternaLlmTemperature(Number(e.target.value))} className="h-8 text-[11px]" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Output Tokens</Label>
                                <Input type="number" min="1" value={biblioExternaLlmMaxOutputTokens} onChange={(e) => setBiblioExternaLlmMaxOutputTokens(e.target.value ? Number(e.target.value) : 500)} className="h-8 text-[11px]" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Verbosity</Label>
                                <Input value={biblioExternaLlmVerbosity} onChange={(e) => setBiblioExternaLlmVerbosity(e.target.value)} placeholder="low | medium | high" className="h-8 text-[11px]" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Effort</Label>
                                <Input value={biblioExternaLlmEffort} onChange={(e) => setBiblioExternaLlmEffort(e.target.value)} placeholder="none | low | medium | high" className="h-8 text-[11px]" />
                              </div>
                              <div className="space-y-2">
                                <Label className="w-36 shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">System Prompt</Label>
                                <textarea value={biblioExternaLlmSystemPrompt} onChange={(e) => setBiblioExternaLlmSystemPrompt(e.target.value)} rows={10} className="w-full rounded-md border border-input bg-white px-3 py-2 text-[11px] text-foreground outline-none resize-none overflow-y-auto" />
                              </div>
                            </div>
                          }
                          showPanelChrome={false}
                        />
                      ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app4" ? (
                        <BookSearchPanel
                          title={parameterAppMeta.app4.title}
                          description={parameterAppMeta.app4.description}
                          bookOptions={lexicalBooks}
                          selectedBook={selectedLexicalBook}
                          term={lexicalTerm}
                          maxResults={lexicalMaxResults}
                          onSelectBook={setSelectedLexicalBook}
                          onTermChange={setLexicalTerm}
                          onMaxResultsChange={setLexicalMaxResults}
                          onRunSearch={() => void handleRunLexicalSearch()}
                          isRunning={isRunningLexicalSearch}
                          showPanelChrome={false}
                        />
                      ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app12" ? (
                        <SemanticSearchPanel
                          title={parameterAppMeta.app12.title}
                          description={parameterAppMeta.app12.description}
                          selectedIndexId={selectedSemanticSearchIndexId}
                          availableIndexes={semanticSearchIndexes}
                          isLoadingIndexes={isLoadingSemanticSearchIndexes}
                          onSelectedIndexChange={setSelectedSemanticSearchIndexId}
                          query={semanticSearchQuery}
                          maxResults={semanticSearchMaxResults}
                          onQueryChange={setSemanticSearchQuery}
                          onMaxResultsChange={setSemanticSearchMaxResults}
                          onRunSearch={() => void handleRunSemanticSearch()}
                          isRunning={isRunningSemanticSearch}
                          showPanelChrome={false}
                        />
                      ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app5" ? (
                        <VerbeteSearchPanel
                          title={parameterAppMeta.app5.title}
                          description={parameterAppMeta.app5.description}
                          author={verbeteSearchAuthor}
                          titleField={verbeteSearchTitle}
                          area={verbeteSearchArea}
                          text={verbeteSearchText}
                          maxResults={verbeteSearchMaxResults}
                          onAuthorChange={setVerbeteSearchAuthor}
                          onTitleFieldChange={setVerbeteSearchTitle}
                          onAreaChange={setVerbeteSearchArea}
                          onTextChange={setVerbeteSearchText}
                          onMaxResultsChange={setVerbeteSearchMaxResults}
                          onRunSearch={() => void handleRunVerbeteSearch()}
                          isRunning={isRunningVerbeteSearch}
                          showPanelChrome={false}
                        />
                      ) : parameterPanelTarget.section === "apps" && (parameterPanelTarget.id === "app7" || parameterPanelTarget.id === "app8" || parameterPanelTarget.id === "app11" || parameterPanelTarget.id === "app9" || parameterPanelTarget.id === "app10") ? (
                        <>
                        <VerbetografiaPanel
                          title={parameterAppMeta[parameterPanelTarget.id].title}
                          description={parameterAppMeta[parameterPanelTarget.id].description}
                          verbeteTitle={verbetografiaTitle}
                          specialty={verbetografiaSpecialty}
                          onVerbeteTitleChange={setVerbetografiaTitle}
                          onSpecialtyChange={setVerbetografiaSpecialty}
                          onRunAction={
                            parameterPanelTarget.id === "app7"
                              ? () => void handleOpenVerbetografiaTable()
                              : parameterPanelTarget.id === "app8"
                                ? () => void handleRunVerbeteDefinologia()
                                : parameterPanelTarget.id === "app11"
                                  ? () => void handleRunVerbeteFraseEnfatica()
                                  : parameterPanelTarget.id === "app9"
                                  ? () => void handleRunVerbeteSinonimologia()
                                  : () => void handleRunVerbeteFatologia()
                          }
                          actionLabelIdle={
                            parameterPanelTarget.id === "app7"
                              ? "Abrir Tabela"
                              : parameterPanelTarget.id === "app8"
                                ? "Gerar Definologia"
                                : parameterPanelTarget.id === "app11"
                                  ? "Gerar Frase Enfática"
                                : parameterPanelTarget.id === "app9"
                                  ? "Gerar Sinonimologia"
                                  : "Gerar Fatologia"
                          }
                          actionLabelRunning={
                            parameterPanelTarget.id === "app7"
                              ? "Abrindo"
                              : parameterPanelTarget.id === "app8"
                                ? "Gerando Definologia"
                                : parameterPanelTarget.id === "app11"
                                  ? "Gerando Frase Enfática"
                                : parameterPanelTarget.id === "app9"
                                  ? "Gerando Sinonimologia"
                                  : "Gerando Fatologia"
                          }
                          isRunning={
                            parameterPanelTarget.id === "app7"
                              ? isRunningVerbetografiaOpenTable
                              : parameterPanelTarget.id === "app8"
                                ? isRunningVerbeteDefinologia
                                : parameterPanelTarget.id === "app11"
                                  ? isRunningVerbeteFraseEnfatica
                                : parameterPanelTarget.id === "app9"
                                  ? isRunningVerbeteSinonimologia
                                  : isRunningVerbeteFatologia
                          }
                          showPanelChrome={false}
                        />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        
                        </div>
                      )}
                    </div>
                    {parameterPanelTarget.section === "apps" && appPanelScope === "verbetografia" && isAiActionsConfigOpen ? (
                      <div className="border-t border-border p-4">
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Modelo</Label>
                              <select value={aiActionsLlmModel} onChange={(e) => setAiActionsLlmModel(e.target.value)} className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none">
                                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                                <option value="gpt-5-mini">gpt-5-mini</option>
                                <option value="gpt-5.2">gpt-5.2</option>
                                <option value="gpt-5.4">gpt-5.4</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Temperatura</Label>
                              <Input type="number" step="0.1" min="0" max="2" value={aiActionsLlmTemperature} onChange={(e) => setAiActionsLlmTemperature(Number(e.target.value))} className="h-8 text-[11px]" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Output Tokens</Label>
                              <Input type="number" min="1" value={aiActionsLlmMaxOutputTokens} onChange={(e) => setAiActionsLlmMaxOutputTokens(e.target.value ? Number(e.target.value) : 500)} className="h-8 text-[11px]" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Verbosity</Label>
                              <Input value={aiActionsLlmVerbosity} onChange={(e) => setAiActionsLlmVerbosity(e.target.value)} placeholder="low | medium | high" className="h-8 text-[11px]" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Effort</Label>
                              <Input value={aiActionsLlmEffort} onChange={(e) => setAiActionsLlmEffort(e.target.value)} placeholder="none | low | medium | high" className="h-8 text-[11px]" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vector Store</Label>
                              <select
                                value={aiActionsSelectedVectorStoreIds[0] ?? ""}
                                onChange={(e) => setAiActionsSelectedVectorStoreIds(e.target.value ? [e.target.value] : [])}
                                className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none"
                              >
                                <option value="">none</option>
                                {aiActionVectorStoreOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">inputFileIds</Label>
                              <Button
                                variant="ghost"
                                className={sectionActionButtonClass}
                                onClick={() => {
                                  aiActionsUploadInputRef.current?.click();
                                }}
                              >
                                <Upload className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                                <span className="min-w-0 flex-1 text-left">
                                  <span className="block break-words text-sm font-medium text-foreground">Upload Arquivos</span>
                                </span>
                              </Button>
                              <input
                                ref={aiActionsUploadInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onClick={(event) => {
                                  event.currentTarget.value = "";
                                }}
                                onChange={(event) => {
                                  const files = Array.from(event.target.files ?? []);
                                  if (files.length > 0) void handleUploadSourceFiles(files);
                                }}
                              />
                              {isUploadingChatFiles ? (
                                <div className="rounded border border-border bg-white px-2 py-2 text-xs text-muted-foreground">
                                  Enviando arquivos para a OpenAI...
                                </div>
                              ) : null}
                              {uploadedChatFiles.length > 0 ? (
                                <div className="space-y-2">
                                  {uploadedChatFiles.map((file) => (
                                    <div key={file.id} className="rounded border border-border bg-white px-2 py-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <p className="break-words text-xs font-medium text-foreground">{file.filename}</p>
                                          <p className="text-[11px] text-muted-foreground">{file.bytes} bytes</p>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-[11px]"
                                          onClick={() => handleRemoveUploadedChatFile(file.id)}
                                        >
                                          Remover
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="rounded border border-dashed border-border bg-white px-2 py-2 text-xs text-muted-foreground">
                                  Nenhum arquivo anexado
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
            </ResizablePanel>
          </>
        )}

        {showHandleAfterCenter && <ResizableHandle withHandle />}

        {showRightPanel && (
          <ResizablePanel
            id="right-panel"
            order={hasCenterPanel ? 3 : 2}
            defaultSize={
              hasEditorPanel
                ? PANEL_SIZES.right.default
                : hasCenterPanel
                  ? 100 - PANEL_SIZES.left.default - PANEL_SIZES.parameter.default
                  : 100 - PANEL_SIZES.left.default
            }
            minSize={PANEL_SIZES.right.min}
            maxSize={
              hasEditorPanel
                ? PANEL_SIZES.right.max
                : hasCenterPanel
                  ? 100 - PANEL_SIZES.left.min - PANEL_SIZES.parameter.min
                  : 100 - PANEL_SIZES.left.min
            }
            className={`border-l border-border ${sidePanelClass}`}
          >
            <RightPanel
              responses={responses}
              enableHistoryNumbering={enableHistoryNumbering}
              enableHistoryReferences={enableHistoryReferences}
              onToggleHistoryNumbering={() => setEnableHistoryNumbering((prev) => !prev)}
              onToggleHistoryReferences={() => setEnableHistoryReferences((prev) => !prev)}
              onClear={() => setResponses([])}
              onSendMessage={(message) => void handleChat(message)}
              onCleanConversation={handleCleanLlmConversation}
              onToggleChatConfig={() => toggleLlmConfigPanel("chat")}
              isChatConfigOpen={isChatConfigOpen}
              onAppendToEditor={(html) => void handleAppendHistoryToEditor(html)}
              onNotify={showHistoryNotice}
              showAppendToEditor={Boolean(currentFileId)}
              isSending={isHistoryProcessing}
              historyNotice={historyNotice}
              chatDisabled={!openAiReady}
              chatDisabledReason={backendStatus === "unavailable"
                ? "Backend indisponivel em http://localhost:8787."
                : backendStatus === "missing_openai_key"
                  ? "Backend sem OPENAI_API_KEY."
                  : backendStatus === "checking"
                    ? "Verificando backend..."
                    : undefined}
            />
          </ResizablePanel>
        )}

        {showHandleAfterRight && <ResizableHandle withHandle />}

        {showJsonPanel && (
          <>
            <ResizablePanel
              id="json-log-panel"
              order={hasCenterPanel ? 4 : 3}
              defaultSize={PANEL_SIZES.editor.default}
              minSize={PANEL_SIZES.editor.min}
              maxSize={PANEL_SIZES.editor.max}
              className={`border-l border-border ${sidePanelClass}`}
            >
              <div className="flex h-full flex-col bg-muted/40">
                <div className={`flex items-center justify-between border-b border-border ${panelsTopMenuBarBgClass} px-4 py-3`}>
                  <h2 className="text-sm font-semibold text-foreground">LLM Logs</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[11px] font-semibold"
                      onClick={() => setLlmLogFontScale((prev) => Math.max(LLM_LOG_FONT_MIN, Number((prev - LLM_LOG_FONT_STEP).toFixed(2))))}
                      title="Diminuir fonte dos logs"
                      disabled={llmLogFontScale <= LLM_LOG_FONT_MIN}
                    >
                      A-
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[11px] font-semibold"
                      onClick={() => setLlmLogFontScale((prev) => Math.min(LLM_LOG_FONT_MAX, Number((prev + LLM_LOG_FONT_STEP).toFixed(2))))}
                      title="Aumentar fonte dos logs"
                      disabled={llmLogFontScale >= LLM_LOG_FONT_MAX}
                    >
                      A+
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setLlmLogFontScale(LLM_LOG_FONT_DEFAULT)}
                      title="Resetar fonte dos logs"
                      disabled={llmLogFontScale === LLM_LOG_FONT_DEFAULT}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setLlmLogs([]);
                        setLlmSessionLogs([]);
                      }}
                      title="Limpar logs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsJsonLogPanelOpen(false)}
                      title="Fechar logs"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
                  <div className="space-y-3">
                    {llmLogs.length === 0 ? (
                      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                        Sem logs ainda.
                      </div>
                    ) : (
                      llmLogs.map((entry) => (
                        <div key={entry.id} className="space-y-2 rounded-md border border-border bg-muted/30 p-3" style={llmLogFontStyle}>
                          <p className="text-[11px] font-semibold text-muted-foreground" style={llmLogFontStyle}>{entry.at}</p>
                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" style={llmLogFontStyle}>Request</p>
                            <pre className="whitespace-pre-wrap break-words rounded bg-white p-2 text-[11px] text-foreground" style={llmLogFontStyle}>{JSON.stringify(entry.request, null, 2)}</pre>
                          </div>
                          {entry.response ? (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" style={llmLogFontStyle}>Response</p>
                              <pre className="whitespace-pre-wrap break-words rounded bg-white p-2 text-[11px] text-foreground" style={llmLogFontStyle}>{JSON.stringify(entry.response, null, 2)}</pre>
                            </div>
                          ) : null}
                          {entry.error ? (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-destructive" style={llmLogFontStyle}>Error</p>
                              <pre className="whitespace-pre-wrap break-words rounded bg-white p-2 text-[11px] text-destructive" style={llmLogFontStyle}>{entry.error}</pre>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="border-t border-border bg-muted/70 p-2.5">
                  {/*<p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo das chamadas LLM (sessão)</p>*/}
                  <div className="grid gap-1.5 text-[11px] leading-tight md:grid-cols-2">
                    <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ultima chamada</p>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Modelo (ultima):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{effectiveModel || "-"}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Status (ultima):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{String(latestLlmMeta.status ?? "-")}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Temperatura (ultima):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{String(latestLlmMeta.temperature_requested ?? llmTemperature)}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Max tokens (ultima):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{String(latestLlmMeta.max_output_tokens_requested ?? llmMaxOutputTokens)}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Input tokens:</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{latestInputTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Cached input tokens:</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{latestCachedInputTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Output tokens:</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{latestOutputTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Total tokens:</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{latestTotalTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Reasoning tokens:</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{latestReasoningTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Referencias RAG:</span>{" "}
                      {latestRagReferences.length > 0 ? (
                        <span className="text-[10px] font-medium text-foreground">{latestRagReferences.join(" | ")}</span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground">nao informado</span>
                      )}
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-600">Custo estimado:</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">
                        {latestEstimatedBrl != null
                          ? `R$ ${latestEstimatedBrl.toFixed(4)} (≈ US$ ${latestEstimatedUsd?.toFixed(6)})`
                          : "indisponivel (modelo sem tabela local de preco)"}
                      </span>
                    </div>
                    </div>
                    <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">Consolidado da sessao</p>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Chamadas:</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{llmSessionLogs.length}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Sucesso/Erro:</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{successfulCallsCount}/{errorCallsCount}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Input tokens (total):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{inputTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Cached input tokens (total):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{cachedInputTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Output tokens (total):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{outputTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Total tokens (total):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{totalTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Reasoning tokens (total):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">{reasoningTokens}</span>
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Referencias RAG (todas):</span>{" "}
                      {latestRagReferencesAllCalls.length > 0 ? (
                        <span className="text-[10px] font-medium text-foreground">{latestRagReferencesAllCalls.join(" | ")}</span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground">nao informado</span>
                      )}
                    </div>
                    <div className="rounded border border-border bg-white px-1.5 py-0.5">
                      <span className="text-[10px] font-semibold text-blue-700">Custo estimado (total):</span>{" "}
                      <span className="text-[10px] font-medium text-foreground">
                        {estimatedBrl != null
                          ? `R$ ${estimatedBrl.toFixed(4)} (≈ US$ ${estimatedUsd?.toFixed(6)})`
                          : "indisponivel (modelo sem tabela local de preco)"}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
            {showHandleAfterJson && <ResizableHandle withHandle />}
          </>
        )}

        {showEditorPanel && (
          <>
            <ResizablePanel
              id="editor-panel"
              order={hasCenterPanel ? (showJsonPanel ? 5 : 4) : (showJsonPanel ? 4 : 3)}
              minSize={PANEL_SIZES.editor.min}
            >
              <main className={`relative h-full min-w-0 ${panelsBgClass}`}>
                <HtmlEditor
                  contentHtml={editorContentHtml}
                  documentVersion={openedDocumentVersion}
                  onControlApiReady={handleEditorControlApiReady}
                  onContentChange={handleEditorContentChange}
                  onExportDocx={() => void handleExportDocx()}
                  isExportingDocx={isExportingDocx}
                  includeEditorContextInLlm={includeEditorContextInLlm}
                  canToggleIncludeEditorContextInLlm={Boolean(currentFileId)}
                  onToggleIncludeEditorContextInLlm={() => {
                    if (!currentFileId) return;
                    setIncludeEditorContextInLlm((prev) => !prev);
                  }}
                  onImportSelectedText={() => void handleImportSelectedTextToActions()}
                  onCloseEditor={() => void handleCloseEditorWithPrompt()}
                />
                {isOpeningDocument && (
                  <div className={`absolute inset-0 z-10 flex items-center justify-center ${panelsBgClass}`}>
                    <div className={`inline-flex items-center gap-2 rounded-full border border-border ${cardsBgClass} ${buttonsPrimaryBgClass} px-4 py-2 text-sm font-semibold text-foreground shadow-sm`}>
                      <Loader2 className={`h-4 w-4 animate-spin text-primary ${buttonsPrimaryBgClass}`} />
                      <span>Abrindo documento...</span>
                    </div>
                  </div>
                )}
              </main>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

    </div>
  );
};

export default Index;
