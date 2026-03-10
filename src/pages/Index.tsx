import { useCallback, useEffect, useRef, useState } from "react";
import { AlignLeft, BookOpen, Braces, FileText, Hash, Languages, ListOrdered, Loader2, Menu, PenLine, RefreshCw, Repeat2, RotateCcw, Search, Sparkles, Type, Upload, X } from "lucide-react";
import { toast } from "sonner";
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
import VerbeteSearchPanel from "@/components/VerbeteSearchPanel";
import VerbetografiaPanel from "@/components/VerbetografiaPanel";
import Macro1HighlightPanel from "@/components/Macro1HighlightPanel";
import Macro2ManualNumberingPanel from "@/components/Macro2ManualNumberingPanel";
import type { Macro2SpacingMode } from "@/components/Macro2ManualNumberingPanel";
import AiActionParametersPanel from "@/components/AiActionParametersPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
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
  listLexicalBooksApp,
  openVerbetografiaTableApp,
  randomPensataApp,
  saveFileText,
  searchLexicalBookApp,
  searchVerbeteApp,
  UploadedFileMeta,
  uploadFileToServer,
} from "@/lib/backend-api";
import { HtmlEditorControlApi } from "@/lib/html-editor-control";
import { buildDocxBlobFromHtml } from "@/lib/docx-export";
import { cleanupConvertedPdfHeaderHtml, parseDocxArrayBuffer, warmupDocxParser } from "@/lib/file-parser";
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
  LLM_VECTOR_STORES,
  LLM_VECTOR_STORE_LO,
  LLM_VECTOR_STORE_TRANSLATE_RAG,
  buildDefinePrompt,
  buildSynonymsPrompt,
  buildEpigraphPrompt,
  buildRewritePrompt,
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildChatPrompt,
  buildVerbeteDefinologiaPrompt,
  buildVerbeteFraseEnfaticaPrompt,
  buildVerbeteSinonimologiaPrompt,
  buildVerbeteFatologiaPrompt,
  buildPensataAnalysisPrompt,
} from "@/lib/openai";
import { sectionActionButtonClass } from "@/styles/buttonStyles";
import { BOOK_LABELS, type BookCode } from "@/lib/bookCatalog";

type MacroActionId = "macro1" | "macro2";
type AppActionId = "app1" | "app2" | "app3" | "app4" | "app5" | "app6" | "app7" | "app8" | "app9" | "app10" | "app11";
type AppPanelScope = "bibliografia" | "busca" | "verbetografia";
type AiActionId = "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "translate";
type ParameterPanelSection = "document" | "actions" | "apps" | "settings";
type ParameterPanelTarget =
  | { section: "document"; id: MacroActionId | null }
  | { section: "actions"; id: AiActionId | null }
  | { section: "apps"; id: AppActionId | null }
  | { section: "settings"; id: null }
  | null;
type MobilePanelId = "left" | "center" | "right" | "editor" | "json";

const ACTION_PANEL_BUTTONS: AiActionId[] = ["define", "synonyms", "epigraph", "pensatas", "rewrite", "summarize", "translate"];
const APP_PANEL_BUTTONS_BY_SCOPE: Record<AppPanelScope, AppActionId[]> = {
  bibliografia: ["app1", "app2", "app3", "app6"],
  busca: ["app4", "app5"],
  verbetografia: ["app7", "app8", "app9", "app10", "app11"],
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
};
const APP_PANEL_ICONS: Record<AppActionId, typeof BookOpen> = {
  app1: BookOpen,
  app2: Repeat2,
  app3: Search,
  app4: Search,
  app5: Search,
  app6: Search,
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
  app7: { title: "Tabela Automatizada", description: "Abre tabela no Word e no editor HTML." },
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
};
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
  const [openAiReady, setOpenAiReady] = useState(false);
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
  const [isRunningBiblioExterna, setIsRunningBiblioExterna] = useState(false);
  const [lexicalBooks, setLexicalBooks] = useState<string[]>([]);
  const [selectedLexicalBook, setSelectedLexicalBook] = useState<string>("LO");
  const [lexicalTerm, setLexicalTerm] = useState("");
  const [lexicalMaxResults, setLexicalMaxResults] = useState(DEFAULT_BOOK_SEARCH_MAX_RESULTS);
  const [isRunningLexicalSearch, setIsRunningLexicalSearch] = useState(false);
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
  const [chatPreviousResponseId, setChatPreviousResponseId] = useState<string | null>(null);
  const [isJsonLogPanelOpen, setIsJsonLogPanelOpen] = useState(false);
  const [llmLogs, setLlmLogs] = useState<Array<{ id: string; at: string; request: unknown; response?: unknown; error?: string }>>([]);
  const LLM_LOG_FONT_DEFAULT = Number((DEFAULT_LOG_FONT_SIZE_PX / 11).toFixed(2));
  const [llmLogFontScale, setLlmLogFontScale] = useState(LLM_LOG_FONT_DEFAULT);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanelId>("left");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImportingDocument, setIsImportingDocument] = useState(false);
  const [selectedImportFileName, setSelectedImportFileName] = useState("");
  const saveTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const currentFileIdRef = useRef("");
  const macro1CountRequestIdRef = useRef(0);
  const previousHasEditorPanelRef = useRef(false);
  

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
    healthCheck().then((h) => setOpenAiReady(h.openaiConfigured)).catch(() => setOpenAiReady(false));
  }, []);

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
  }, []);
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
  }, [refreshDocumentText]);

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
  }, [refreshDocumentText]);

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
    setResponses((prev) => [{ id: crypto.randomUUID(), type, query, content, timestamp: new Date() }, ...prev]);
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
    try {
      const response = await executeLLM(mergedPayload);
      setLlmLogs((prev) => {
        if (!prev[0] || prev[0].id !== id) return prev;
        return [{ ...prev[0], response }];
      });
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLlmLogs((prev) => {
        if (!prev[0] || prev[0].id !== id) return prev;
        return [{ ...prev[0], error: message }];
      });
      throw err;
    }
  }, []);

  const handleCleanLlmConversation = useCallback(() => {
    // A integração atual usa chamadas stateless; limpar o histórico local reinicia o contexto.
    setChatHistory([]);
    setChatPreviousResponseId(null);
    setResponses([]);
    setLlmLogs([]);
    toast.success("Nova sessão iniciada (contexto limpo).");
  }, []);

  const insertRefBook = useCallback(async (book: string) => {
    const data = await insertRefBookMacro(book);
    return data.result;
  }, []);

  const handleOpenParameterSection = useCallback((section: ParameterPanelSection) => {
    setAppPanelScope(section === "apps" ? "bibliografia" : null);
    setParameterPanelTarget({ section, id: null });
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
    if (!author && !title && !year && !journal && !publisher && !identifier && !extra) {
      toast.error("Informe ao menos um campo para Bibliografia Externa.");
      return;
    }

    setIsRunningBiblioExterna(true);
    try {
      const data = await biblioExternaApp({ author, title, year, journal, publisher, identifier, extra });
      const markdown = (data.result.markdown || "").trim();
      const scorePercentual = Number(data.result.score?.score_percentual ?? NaN);
      const classificacao = (data.result.score?.classificacao || "").trim();
      const scoreLine = Number.isFinite(scorePercentual)
        ? `Confiabilidade: **${scorePercentual.toFixed(2)}%**${classificacao ? ` (${classificacao})` : ""}`
        : "";
      const content = [scoreLine, markdown].filter(Boolean).join("\n\n");
      if (content) {
        const queryParts = [
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
  }, [biblioExternaAuthor, biblioExternaExtra, biblioExternaIdentifier, biblioExternaJournal, biblioExternaPublisher, biblioExternaTitle, biblioExternaYear]);

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

  const handleActionApps = useCallback((type: AppActionId) => {
    if (type === "app4" || type === "app5") {
      setAppPanelScope("busca");
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
    if (type === "app7" || type === "app8" || type === "app11" || type === "app9" || type === "app10") {
      if (!verbetografiaTitle.trim() && actionText.trim()) setVerbetografiaTitle(actionText.trim());
    }
  }, [actionText, biblioExternaTitle, biblioGeralTitle, ensureLexicalBooksLoaded, verbetografiaTitle]);

  const handleOpenBookSearchFromLeft = useCallback(() => {
    setAppPanelScope("busca");
    setParameterPanelTarget({ section: "apps", id: null });
    void ensureLexicalBooksLoaded();
  }, [ensureLexicalBooksLoaded]);

  const handleOpenVerbetografiaFromLeft = useCallback(() => {
    setAppPanelScope("verbetografia");
    setParameterPanelTarget({ section: "apps", id: null });
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
      toast.error("Backend sem OPENAI_API_KEY. Configure no servidor.");
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
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
      const normalizedEditorText = (latestEditorText || "").trim();
      const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
      const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      const query = `Escreva uma Definologia do tema do verbete com título: ${title} e especialidade: ${specialty}.`;
      const messages = buildVerbeteDefinologiaPrompt(query, editorPlainTextContext, editorContextTruncated);
      const chatStoreIds = LLM_VECTOR_STORES.split(",").map((s) => s.trim()).filter(Boolean);
      const result = (
        await executeLLMWithLog({
          messages,
          model: CHAT_MODEL,
          temperature: CHAT_TEMPERATURE,
          gpt5Verbosity: CHAT_GPT5_VERBOSITY,
          gpt5Effort: CHAT_GPT5_EFFORT,
          maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
          systemPrompt: "",
          vectorStoreIds: chatStoreIds,
          ragQuery: query,
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
  }, [documentText, htmlEditorControlApi, llmEditorContextMaxChars, openAiReady, verbetografiaSpecialty, verbetografiaTitle]);

  const handleRunVerbeteFraseEnfatica = useCallback(async () => {
    if (!openAiReady) {
      toast.error("Backend sem OPENAI_API_KEY. Configure no servidor.");
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
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
      const normalizedEditorText = (latestEditorText || "").trim();
      const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
      const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      const query = `Escreva uma Frase Enfática do tema do verbete com título: ${title} e especialidade: ${specialty}.`;
      const messages = buildVerbeteFraseEnfaticaPrompt(query, editorPlainTextContext, editorContextTruncated);
      const chatStoreIds = LLM_VECTOR_STORES.split(",").map((s) => s.trim()).filter(Boolean);
      const result = (
        await executeLLMWithLog({
          messages,
          model: CHAT_MODEL,
          temperature: CHAT_TEMPERATURE,
          gpt5Verbosity: CHAT_GPT5_VERBOSITY,
          gpt5Effort: CHAT_GPT5_EFFORT,
          maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
          systemPrompt: "",
          vectorStoreIds: chatStoreIds,
          ragQuery: query,
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
  }, [documentText, htmlEditorControlApi, llmEditorContextMaxChars, openAiReady, verbetografiaSpecialty, verbetografiaTitle]);

  const handleRunVerbeteSinonimologia = useCallback(async () => {
    if (!openAiReady) {
      toast.error("Backend sem OPENAI_API_KEY. Configure no servidor.");
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
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
      const normalizedEditorText = (latestEditorText || "").trim();
      const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
      const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      const query = `Escreva uma Sinonimologia do tema do verbete com título: ${title} e especialidade: ${specialty}.`;
      const messages = buildVerbeteSinonimologiaPrompt(query, editorPlainTextContext, editorContextTruncated);
      const chatStoreIds = LLM_VECTOR_STORES.split(",").map((s) => s.trim()).filter(Boolean);
      const result = (
        await executeLLMWithLog({
          messages,
          model: CHAT_MODEL,
          temperature: CHAT_TEMPERATURE,
          gpt5Verbosity: CHAT_GPT5_VERBOSITY,
          gpt5Effort: CHAT_GPT5_EFFORT,
          maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
          systemPrompt: "",
          vectorStoreIds: chatStoreIds,
          ragQuery: query,
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
  }, [documentText, htmlEditorControlApi, llmEditorContextMaxChars, openAiReady, verbetografiaSpecialty, verbetografiaTitle]);

  const handleRunVerbeteFatologia = useCallback(async () => {
    if (!openAiReady) {
      toast.error("Backend sem OPENAI_API_KEY. Configure no servidor.");
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
      const editorApi = htmlEditorControlApiRef.current ?? htmlEditorControlApi;
      const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
      const normalizedEditorText = (latestEditorText || "").trim();
      const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
      const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
      const query = `Escreva uma Fatologia do tema do verbete com título: ${title} e especialidade: ${specialty}.`;
      const messages = buildVerbeteFatologiaPrompt(query, editorPlainTextContext, editorContextTruncated);
      const chatStoreIds = LLM_VECTOR_STORES.split(",").map((s) => s.trim()).filter(Boolean);
      const result = (
        await executeLLMWithLog({
          messages,
          model: CHAT_MODEL,
          temperature: CHAT_TEMPERATURE,
          gpt5Verbosity: CHAT_GPT5_VERBOSITY,
          gpt5Effort: CHAT_GPT5_EFFORT,
          maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
          systemPrompt: "",
          vectorStoreIds: chatStoreIds,
          ragQuery: query,
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
  }, [documentText, htmlEditorControlApi, llmEditorContextMaxChars, openAiReady, verbetografiaSpecialty, verbetografiaTitle]);

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
      const markdown = matches
        .map((item, idx) => {

          const title = (item.title || "").trim();
          const text = (item.text || "").trim();
          const body = text || Object.values(item.data || {}).filter(Boolean).join(" | ");
          const titlePrefix = title ? `**${title}.** ` : "";
          const sourceBook = (item.book || book || "").trim();
          const sourceBookLabel = BOOK_OPTION_LABELS[sourceBook] ?? sourceBook;
          const sourceTitle = title || "s/titulo";
          const sourceNumber = item.number != null && String(item.number).trim() !== "" ? String(item.number).trim() : "?";
          const folhaRaw = String(item.data?.folha || "").trim();
          const argumentoRaw = String(item.data?.argumento || "").trim();
          const folhaPart = folhaRaw || "s/folha";
          const argumentoPart = argumentoRaw || "s/argumento";
          const sourceRef = sourceBook === "CCG"
            ? `(**${sourceBookLabel}**; *${sourceTitle}*; ${folhaPart})`
            : sourceBook === "DAC"
              ? `(**${sourceBookLabel}**; *${sourceTitle}*; ${argumentoPart})`
              : `(**${sourceBookLabel}**; *${sourceTitle}*)`;
          return `**${idx + 1}.\u00A0\u00A0**${titlePrefix}${body}<br/>${sourceRef}`;
        })
        .join("\n\n");
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
        .map((item, idx) => {

          const row = item.data || {};
          const rowTitle = String(row.title || item.title || "").trim();
          const rowText = String(row.text || item.text || "").trim();
          const rowArea = String(row.area || "").trim();
          const rowAuthor = String(row.author || "").trim();
          const rowNumber = item.number != null ? String(item.number).trim() : "";
          const rowDate = String(row.date || "").trim();
          const rowLink = String(item.link || row.link || "").trim();

          const titlePart = `${rowTitle || "s/titulo"}`;
          const areaPart = `${rowArea || "s/area"}`;
          const authorPart = `${rowAuthor || "s/autor"}`;
          const numberPart = `# ${rowNumber || "?"}`;
          const datePart = rowDate || "s/data";
          const definologiaPart = `**Definologia.** ${rowText || ""}`.trim();
          const linkPart = rowLink ? `[PDF](${rowLink})` : "";
          const headerLine = `**${idx + 1}.\u00A0\u00A0** **${titlePart}** (*${areaPart}*) â— *${authorPart}* â— ${numberPart} â— ${datePart}`;
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
      toast.error("Backend sem OPENAI_API_KEY. Configure no servidor.");
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
      const analysis = (await executeLLMWithLog({ messages: analysisMessages })).content.trim();
      const content = analysis ? `${pensata}\n\n**Análise IA:** ${analysis}` : pensata;
      addResponse("app_random_pensata", header, content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Pensata do Dia.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, openAiReady]);

  const handleAction = useCallback(async (type: AiActionId) => {
    const text = actionText.trim();

    if (!text) {
      toast.error("Selecione um trecho no documento ou escreva na caixa de texto.");
      return;
    }

    if (!openAiReady) {
      toast.error("Backend sem OPENAI_API_KEY. Configure no servidor.");
      return;
    }

    if (type === "pensatas") {
      if (!LLM_VECTOR_STORE_LO) {
        toast.error("Configure VITE_OPENAI_VECTOR_STORE_LO.");
        return;
      }

      setIsLoading(true);
      try {
        const chunks = (
          await executeLLMWithLog({
            messages: [{ role: "user", content: text }],
            vectorStoreIds: [LLM_VECTOR_STORE_LO],
            ragQuery: text,
            returnChunksOnly: true,
          })
        ).chunks;
        if (chunks.length === 0) {
          toast.info("Nenhuma correspond\u00eancia encontrada na Vector Store LO.");
        } else {
          const allParagraphs = chunks.flatMap((c) => c.split(/\n/)).map((p) => p.trim()).filter(Boolean).slice(0, 10);
          const content = allParagraphs.map((p, i) => `**${i + 1}.** ${p}`).join("\n\n");
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
      let ragContext: string | undefined;
      if (type === "define" || type === "synonyms") {
        const storeIds = LLM_VECTOR_STORES.split(",").map((s) => s.trim()).filter(Boolean);
        if (storeIds.length > 0) {
          const allChunks = (
            await executeLLMWithLog({
              messages: [{ role: "user", content: text }],
              vectorStoreIds: storeIds,
              ragQuery: text,
              returnChunksOnly: true,
            })
          ).chunks;
          if (allChunks.length > 0) ragContext = allChunks.join("\n\n---\n\n");
        }
      }
      if (type === "translate") {
        if (!LLM_VECTOR_STORE_TRANSLATE_RAG) {
          throw new Error("Configure VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG.");
        }
        const chunks = (
          await executeLLMWithLog({
            messages: [{ role: "user", content: text }],
            vectorStoreIds: [LLM_VECTOR_STORE_TRANSLATE_RAG],
            ragQuery: text,
            returnChunksOnly: true,
          })
        ).chunks;
        if (chunks.length > 0) ragContext = chunks.join("\n\n---\n\n");
      }

      const promptMap = {
        define: (t: string) => buildDefinePrompt(t, ragContext),
        synonyms: (t: string) => buildSynonymsPrompt(t, ragContext),
        epigraph: (t: string) => buildEpigraphPrompt(t, ragContext),
        rewrite: buildRewritePrompt,
        summarize: buildSummarizePrompt,
        translate: (t: string) => buildTranslatePrompt(t, translateLanguage, ragContext),
      };

      const messages = promptMap[type](text);
      const result = (await executeLLMWithLog({ messages })).content;
      addResponse(type, text.slice(0, 80), result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro na chamada a IA.");
    } finally {
      setIsLoading(false);
    }
  }, [actionText, openAiReady, translateLanguage]);

  const handleOpenAiActionParameters = useCallback((type: AiActionId) => {
    setParameterPanelTarget({ section: "actions", id: type });
  }, []);

  const handleChat = useCallback(async (message: string) => {
    if (!openAiReady) return;
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
      const messages = buildChatPrompt(message, chatHistory, editorPlainTextContext, editorContextTruncated);
      const chatStoreIds = LLM_VECTOR_STORES.split(",").map((s) => s.trim()).filter(Boolean);
      const llmResponse = await executeLLMWithLog({
        messages,
        previousResponseId: chatPreviousResponseId ?? undefined,
        vectorStoreIds: chatStoreIds,
        ragQuery: message,
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
  }, [chatHistory, chatPreviousResponseId, currentFileId, documentText, htmlEditorControlApi, llmEditorContextMaxChars, openAiReady]);

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

  const isHistoryProcessing =
    isLoading || isRunningInsertRefBook || isRunningInsertRefVerbete || isRunningBiblioGeral || isRunningBiblioExterna || isRunningLexicalSearch || isRunningVerbeteSearch || isRunningVerbetografiaOpenTable || isRunningVerbeteDefinologia || isRunningVerbeteFraseEnfatica || isRunningVerbeteSinonimologia || isRunningVerbeteFatologia;
  const hasEditorPanel = Boolean(currentFileId) || isOpeningDocument;
  const hasCenterPanel = Boolean(parameterPanelTarget);
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
  const latestUsage = (latestLlmMeta.usage && typeof latestLlmMeta.usage === "object")
    ? (latestLlmMeta.usage as Record<string, unknown>)
    : {};
  const latestRagReferences = Array.isArray(latestLlmMeta.rag_references)
    ? (latestLlmMeta.rag_references as unknown[]).map((ref) => String(ref || "").trim()).filter(Boolean)
    : [];
  const latestRagChunksCount = Number(latestLlmMeta.rag_chunks_count ?? 0) || 0;
  const inputTokens = Number(latestUsage.input_tokens ?? latestUsage.prompt_tokens ?? 0) || 0;
  const cachedInputTokens = Number((latestUsage.input_token_details as { cached_tokens?: number } | undefined)?.cached_tokens ?? 0) || 0;
  const nonCachedInputTokens = Math.max(0, inputTokens - cachedInputTokens);
  const outputTokens = Number(latestUsage.output_tokens ?? latestUsage.completion_tokens ?? 0) || 0;
  const totalTokens = Number(latestUsage.total_tokens ?? inputTokens + outputTokens) || 0;
  const reasoningTokens = Number((latestUsage.output_token_details as { reasoning_tokens?: number } | undefined)?.reasoning_tokens ?? 0) || 0;
  const usdToBrl = DEFAULT_DOLLAR_TOKEN;
  const effectiveModel = String(latestLlmMeta.model ?? llmModel ?? "");
  const normalizedModel = effectiveModel.toLowerCase();
  const isGpt54 = normalizedModel.startsWith("gpt-5.4");
  const modelPricingUsdPer1M: Record<string, { input: number; cached_input: number; output: number }> = {
    "gpt-5.4-under-272k": { input: 2.5, cached_input: 0.25, output: 15.0 },
    "gpt-5.4-over-272k": { input: 5.0, cached_input: 0.5, output: 22.5 },
    "gpt-5.2": { input: 1.75, cached_input: 0.175, output: 14.0 },
    "gpt-5-mini": { input: 0.25, cached_input: 0.025, output: 2.0 },
    "gpt-4.1-mini": { input: 0.4, cached_input: 0.1, output: 1.6 },
  };
  const matchedPricingKey = isGpt54
    ? (inputTokens > 272_000 ? "gpt-5.4-over-272k" : "gpt-5.4-under-272k")
    : (Object.keys(modelPricingUsdPer1M).find((key) => normalizedModel.startsWith(key)) ?? "");
  const matchedPricing = matchedPricingKey ? modelPricingUsdPer1M[matchedPricingKey] : null;
  const estimatedUsd = matchedPricing
    ? (
        (nonCachedInputTokens * matchedPricing.input) +
        (cachedInputTokens * matchedPricing.cached_input) +
        (outputTokens * matchedPricing.output)
      ) / 1_000_000
    : null;
  const estimatedBrl = estimatedUsd != null ? estimatedUsd * usdToBrl : null;

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
              onRunRandomPensata={handleRunRandomPensata}
              onOpenBookSearch={handleOpenBookSearchFromLeft}
              onOpenVerbetografia={handleOpenVerbetografiaFromLeft}
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
                    <div className={`flex items-center justify-between border-b border-border ${panelsTopMenuBarBgClass} px-4 py-3`}>
                      <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setParameterPanelTarget(null)}
                        title="Fechar Parameters"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {parameterPanelTarget.section !== "document" && parameterPanelTarget.section !== "settings" && (
                      <div className="border-b border-border p-3">
                        <div className="grid grid-cols-1 gap-2">
                        {parameterPanelTarget.section === "actions" &&
                          ACTION_PANEL_BUTTONS.map((id) => (
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


                      
                        {parameterPanelTarget.section === "apps" &&
                          APP_PANEL_BUTTONS_BY_SCOPE[appPanelScope ?? "bibliografia"].map((id) => (
                          (() => {
                            const Icon = APP_PANEL_ICONS[id];
                            return (


                              
                          <div key={id} className="space-y-2">
                            {appPanelScope === "verbetografia" && id === "app8" ? (
                              <>
                                <Separator className="my-4" />
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
                      ) : parameterPanelTarget.section === "settings" ? (
                        <div className="h-full overflow-y-auto p-3">
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurações LLM</Label>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Modelo</Label>
                              <select
                                value={llmModel}
                                onChange={(e) => setLlmModel(e.target.value)}
                                className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none"
                              >
                                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                                <option value="gpt-5-mini">gpt-5-mini</option>
                                <option value="gpt-5.2">gpt-5.2</option>
                                <option value="gpt-5.4">gpt-5.4</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Temperatura</Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="2"
                                value={llmTemperature}
                                onChange={(e) => setLlmTemperature(Number(e.target.value))}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Output Tokens</Label>
                              <Input
                                type="number"
                                min="1"
                                value={llmMaxOutputTokens}
                                onChange={(e) => setLlmMaxOutputTokens(e.target.value ? Number(e.target.value) : 500)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Num Results</Label>
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={llmMaxNumResults}
                                onChange={(e) => setLlmMaxNumResults(e.target.value ? Number(e.target.value) : 5)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Context Max Chars</Label>
                              <Input
                                type="number"
                                min="500"
                                value={llmEditorContextMaxChars}
                                onChange={(e) => setLlmEditorContextMaxChars(e.target.value ? Number(e.target.value) : CHAT_EDITOR_CONTEXT_MAX_CHARS)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Verbosity</Label>
                              <Input value={llmVerbosity} onChange={(e) => setLlmVerbosity(e.target.value)} placeholder="low | medium | high" className="h-8 text-xs" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Effort</Label>
                              <Input value={llmEffort} onChange={(e) => setLlmEffort(e.target.value)} placeholder="minimal | low | medium | high" className="h-8 text-xs" />
                            </div>



                            <div className="space-y-2">
                              <Label className="w-36 shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">System Prompt</Label>
                              <textarea
                                value={llmSystemPrompt}
                                onChange={(e) => setLlmSystemPrompt(e.target.value)}
                                rows={6}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none resize-none overflow-y-auto"
                              />
                            </div>

                            <Separator className="my-1" />

                            <Button
                              variant="ghost"
                              className={sectionActionButtonClass}
                              onClick={handleCleanLlmConversation}
                            >
                              <RotateCcw className="mr-2 h-4 w-4 shrink-0 text-primary" />
                              <span className="min-w-0 flex-1 text-left">
                                <span className="block break-words text-sm font-medium text-foreground">Clean</span>
                                <span className="block break-words text-xs text-muted-foreground">Inicia nova conversa sem contexto anterior</span>
                              </span>
                            </Button>

                            <Button
                              variant="ghost"
                              className={sectionActionButtonClass}
                              onClick={() => {
                                setIsJsonLogPanelOpen((prev) => !prev);
                                if (isMobileView) setActiveMobilePanel("json");
                              }}
                            >
                              <Braces className="mr-2 h-4 w-4 shrink-0 text-primary" />
                              <span className="min-w-0 flex-1 text-left">
                                <span className="block break-words text-sm font-medium text-foreground">Json</span>
                                <span className="block break-words text-xs text-muted-foreground">Logs de request/response da LLM</span>
                              </span>
                            </Button>

                            <div className="rounded-md border border-border bg-muted/40 p-3">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo da última chamada LLM</p>
                              <div className="space-y-1.5 text-xs leading-snug">
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Modelo:</span>{" "}
                                  <span className="font-medium text-foreground">{effectiveModel || "-"}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Status:</span>{" "}
                                  <span className="font-medium text-foreground">{String(latestLlmMeta.status ?? "-")}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Temperatura:</span>{" "}
                                  <span className="font-medium text-foreground">{String(latestLlmMeta.temperature_requested ?? llmTemperature)}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Max tokens:</span>{" "}
                                  <span className="font-medium text-foreground">{String(latestLlmMeta.max_output_tokens_requested ?? llmMaxOutputTokens)}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Input tokens:</span>{" "}
                                  <span className="font-medium text-foreground">{inputTokens || 0}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Cached input tokens:</span>{" "}
                                  <span className="font-medium text-foreground">{cachedInputTokens || 0}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Output tokens:</span>{" "}
                                  <span className="font-medium text-foreground">{outputTokens || 0}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Total tokens:</span>{" "}
                                  <span className="font-medium text-foreground">{totalTokens || 0}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Reasoning tokens:</span>{" "}
                                  <span className="font-medium text-foreground">{reasoningTokens || 0}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Chunks RAG usados:</span>{" "}
                                  <span className="font-medium text-foreground">{latestRagChunksCount}</span>
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Referências RAG:</span>{" "}
                                  {latestRagReferences.length > 0 ? (
                                    <span className="font-medium text-foreground">{latestRagReferences.join(" | ")}</span>
                                  ) : (
                                    <span className="font-medium text-muted-foreground">não informado</span>
                                  )}
                                </div>
                                <div className="rounded bg-background/70 px-2 py-1">
                                  <span className="font-semibold text-blue-600">Custo estimado:</span>{" "}
                                  <span className="font-medium text-foreground">
                                    {estimatedBrl != null
                                      ? `R$ ${estimatedBrl.toFixed(4)} (≈ US$ ${estimatedUsd?.toFixed(6)})`
                                      : "indisponível (modelo sem tabela local de preço)"}
                                  </span>
                                </div>
                              </div>
                              {/* <p className="mt-2 text-[11px] text-muted-foreground">
                                Estimativa de custo baseada em tabela local e câmbio fixo (US$1 = R$ {usdToBrl.toFixed(2)}).
                              </p> */}
                            </div>
                          </div>
                        </div>
                      ) : parameterPanelTarget.section === "actions" && parameterPanelTarget.id ? (
                        <AiActionParametersPanel
                          title={parameterActionMeta[parameterPanelTarget.id].title}
                          description={parameterActionMeta[parameterPanelTarget.id].description}
                          actionText={actionText}
                          onActionTextChange={setActionText}
                          onRetrieveSelectedText={() => void handleRetrieveSelectedText()}
                          onApply={() => void handleAction(parameterPanelTarget.id as AiActionId)}
                          isLoading={isLoading}
                          hasDocumentOpen={Boolean(currentFileId)}
                          showLanguageSelect={parameterPanelTarget.id === "translate"}
                          languageOptions={TRANSLATE_LANGUAGE_OPTIONS.map((option) => ({ ...option }))}
                          selectedLanguage={translateLanguage}
                          onSelectedLanguageChange={(value) => setTranslateLanguage(value as (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"])}
                          showPanelChrome={false}
                        />
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
                          onAuthorChange={setBiblioExternaAuthor}
                          onTitleFieldChange={setBiblioExternaTitle}
                          onYearChange={setBiblioExternaYear}
                          onJournalChange={setBiblioExternaJournal}
                          onPublisherChange={setBiblioExternaPublisher}
                          onIdentifierChange={setBiblioExternaIdentifier}
                          onExtraChange={setBiblioExternaExtra}
                          onRun={() => void handleRunBiblioExterna()}
                          isRunning={isRunningBiblioExterna}
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
                      ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        
                        </div>
                      )}
                    </div>
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
              onClear={() => setResponses([])}
              onSendMessage={(message) => void handleChat(message)}
              onAppendToEditor={(html) => void handleAppendHistoryToEditor(html)}
              showAppendToEditor={Boolean(currentFileId)}
              isSending={isHistoryProcessing}
              chatDisabled={!openAiReady}
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
              <div className="flex h-full flex-col">
                <div className={`flex items-center justify-between border-b border-border ${panelsTopMenuBarBgClass} px-4 py-3`}>
                  <h2 className="text-sm font-semibold text-foreground">LLM JSON Logs</h2>
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
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setLlmLogs([])}
                      title="Limpar logs"
                    >
                      Limpar
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
                            <pre className="whitespace-pre-wrap break-words rounded bg-background p-2 text-[11px] text-foreground" style={llmLogFontStyle}>{JSON.stringify(entry.request, null, 2)}</pre>
                          </div>
                          {entry.response ? (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" style={llmLogFontStyle}>Response</p>
                              <pre className="whitespace-pre-wrap break-words rounded bg-background p-2 text-[11px] text-foreground" style={llmLogFontStyle}>{JSON.stringify(entry.response, null, 2)}</pre>
                            </div>
                          ) : null}
                          {entry.error ? (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-destructive" style={llmLogFontStyle}>Error</p>
                              <pre className="whitespace-pre-wrap break-words rounded bg-background p-2 text-[11px] text-destructive" style={llmLogFontStyle}>{entry.error}</pre>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
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
                  onCloseEditor={() => {
                    setCurrentFileId("");
                    setCurrentFileName("");
                    setCurrentFileConvertedFromPdf(false);
                  }}
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















