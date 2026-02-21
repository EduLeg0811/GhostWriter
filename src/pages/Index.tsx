import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, FileText, Languages, ListOrdered, Loader2, PenLine, Repeat2, Search, X } from "lucide-react";
import { toast } from "sonner";
import LeftPanel from "@/components/LeftPanel";
import RightPanel, { AIResponse } from "@/components/RightPanel";
import HtmlEditor from "@/components/HtmlEditor";
import InsertRefBookPanel from "@/components/InsertRefBookPanel";
import InsertRefVerbetePanel from "@/components/InsertRefVerbetePanel";
import BiblioGeralPanel from "@/components/BiblioGeralPanel";
import BiblioExternaPanel from "@/components/BiblioExternaPanel";
import BookSearchPanel, { BOOK_OPTION_LABELS } from "@/components/BookSearchPanel";
import VerbeteSearchPanel from "@/components/VerbeteSearchPanel";
import Macro1HighlightPanel from "@/components/Macro1HighlightPanel";
import Macro2ManualNumberingPanel from "@/components/Macro2ManualNumberingPanel";
import type { Macro2SpacingMode } from "@/components/Macro2ManualNumberingPanel";
import AiActionParametersPanel from "@/components/AiActionParametersPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
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
  randomPensataApp,
  saveFileText,
  searchLexicalBookApp,
  searchVerbeteApp,
  UploadedFileMeta,
  uploadFileToServer,
} from "@/lib/backend-api";
import { HtmlEditorControlApi } from "@/lib/html-editor-control";
import { buildDocxBlobFromHtml } from "@/lib/docx-export";
import { parseDocxArrayBuffer, warmupDocxParser } from "@/lib/file-parser";
import { markdownToEditorHtml, normalizeHistoryContentToMarkdown, plainTextToEditorHtml } from "@/lib/markdown";
import {
  callOpenAI,
  ChatMessage,
  searchVectorStore,
  buildDefinePrompt,
  buildSynonymsPrompt,
  buildEpigraphPrompt,
  buildRewritePrompt,
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildChatPrompt,
  buildPensataAnalysisPrompt,
} from "@/lib/openai";
import { sectionActionButtonClass } from "@/styles/buttonStyles";
import { BOOK_LABELS, type BookCode } from "@/lib/bookCatalog";

const OPENAI_VECTOR_STORES = (import.meta.env.VITE_OPENAI_VECTOR_STORES as string | undefined)?.trim() || "";
const OPENAI_VECTOR_STORE_LO = (import.meta.env.VITE_OPENAI_VECTOR_STORE_LO as string | undefined)?.trim() || "";
const OPENAI_VECTOR_STORE_TRANSLATE_RAG = (import.meta.env.VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG as string | undefined)?.trim() || "";

type MacroActionId = "macro1" | "macro2";
type AppActionId = "app1" | "app2" | "app3" | "app4" | "app5" | "app6";
type AiActionId = "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "translate";
type ParameterPanelSection = "actions" | "macros" | "apps";
type ParameterPanelTarget =
  | { section: "actions"; id: AiActionId | null }
  | { section: "macros"; id: MacroActionId | null }
  | { section: "apps"; id: AppActionId | null }
  | null;

const ACTION_PANEL_BUTTONS: AiActionId[] = ["define", "synonyms", "epigraph", "pensatas", "rewrite", "summarize", "translate"];
const APP_PANEL_BUTTONS: AppActionId[] = ["app1", "app2", "app3", "app6"];
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
};
const MACRO_PANEL_ICONS: Record<MacroActionId, typeof BookOpen> = {
  macro1: BookOpen,
  macro2: ListOrdered,
};

const parameterAppMeta: Record<AppActionId, { title: string; description: string }> = {
  app1: { title: "Bibliografia de Livros", description: "Monta Bibliografia de livros de Waldo Vieira." },
  app2: { title: "Bibliografia de Verbetes", description: "Monta Listagem ou Bibliografia de verbetes." },
  app3: { title: "Bibliografia Autores", description: "Busca bibliogr\u00e1fia de livros e artigos de autores." },
  app4: { title: "Busca em Livros", description: "Busca palavras e termos em livros." },
  app5: { title: "Busca em Verbetes", description: "Busca campos em verbetes da EC." },
  app6: { title: "Bibliografia Externa", description: "Busca referencias bibliograficas na internet." },
};
const parameterMacroMeta: Record<MacroActionId, { title: string; description: string }> = {
  macro1: { title: "Highlight", description: "Destaca termos no documento (highlight em cores)." },
  macro2: { title: "Numerar lista", description: "Aplica numera\u00e7\u00e3o manual \u00e0 lista de itens." },
};
const parameterActionMeta: Record<AiActionId, { title: string; description: string }> = {
  define: { title: "Definir", description: "Definologia conscienciol\u00f3gica." },
  synonyms: { title: "Sinon\u00edmia", description: "Sinonimologia." },
  epigraph: { title: "Ep\u00edgrafe", description: "Sugere ep\u00edgrafe." },
  rewrite: { title: "Reescrever", description: "Melhora clareza e fluidez." },
  summarize: { title: "Resumir", description: "S\u00edntese concisa." },
  pensatas: { title: "Pensatas LO", description: "Pensatas afins." },
  translate: { title: "Traduzir", description: "Traduz para o idioma selecionado." },
};
const sidePanelClass = "bg-card";
const PANEL_SIZES = {
  left: { default: 10, min: 8, max: 20 },
  parameter: { default: 15, min: 10, max: 20 },
  editor: { min: 20 },
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

// Valor padrao para o campo "Maximo de resultados" da Pesquisa em Livros.
// Ajuste aqui para alterar facilmente o default no frontend.
const DEFAULT_BOOK_SEARCH_MAX_RESULTS = 10;

const Index = () => {
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionText, setActionText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [documentText, setDocumentText] = useState("");
  const [currentFileName, setCurrentFileName] = useState("");
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
  const [selectedLexicalBook, setSelectedLexicalBook] = useState<string>("");
  const [lexicalTerm, setLexicalTerm] = useState("");
  const [lexicalMaxResults, setLexicalMaxResults] = useState(DEFAULT_BOOK_SEARCH_MAX_RESULTS);
  const [isRunningLexicalSearch, setIsRunningLexicalSearch] = useState(false);
  const [verbeteSearchAuthor, setVerbeteSearchAuthor] = useState("");
  const [verbeteSearchTitle, setVerbeteSearchTitle] = useState("");
  const [verbeteSearchArea, setVerbeteSearchArea] = useState("");
  const [verbeteSearchText, setVerbeteSearchText] = useState("");
  const [verbeteSearchMaxResults, setVerbeteSearchMaxResults] = useState(DEFAULT_BOOK_SEARCH_MAX_RESULTS);
  const [isRunningVerbeteSearch, setIsRunningVerbeteSearch] = useState(false);
  const [isBookSearchEntryMode, setIsBookSearchEntryMode] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [translateLanguage, setTranslateLanguage] = useState<(typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"]>("Ingles");
  const [macro1Term, setMacro1Term] = useState("");
  const [macro1ColorId, setMacro1ColorId] = useState<(typeof MACRO1_HIGHLIGHT_COLORS)[number]["id"]>("yellow");
  const [macro2SpacingMode, setMacro2SpacingMode] = useState<Macro2SpacingMode>("nbsp_double");
  const saveTimerRef = useRef<number | null>(null);
  const htmlEditorControlApiRef = useRef<HtmlEditorControlApi | null>(null);

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
        setEditorContentHtml(savedHtml);
        return;
      }

      if ((data.ext || "").toLowerCase() === "docx") {
        try {
          const buffer = await fetchFileContentBuffer(fileId);
          const convertedHtml = (await parseDocxArrayBuffer(buffer)).trim();
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
    if (!htmlEditorControlApi || !currentFileId) {
      setDocumentPageCount(null);
      setDocumentParagraphCount(null);
      setDocumentWordCount(null);
      setDocumentSymbolCount(null);
      setDocumentSymbolWithSpacesCount(null);
      return;
    }
    try {
      const statsData = await htmlEditorControlApi.getDocumentStats();
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
      return uploaded;
    } finally {
      setIsOpeningDocument(false);
    }
  }, [refreshDocumentText]);

  const handleCreateBlankDocument = useCallback(async (): Promise<void> => {
    setIsOpeningDocument(true);
    try {
      const created = await createBlankDocOnServer("novo-documento.docx");
      setActionText("");
      setCurrentFileId(created.id);
      setCurrentFileName(created.originalName || created.storedName || "novo-documento.docx");
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
    if (!htmlEditorControlApi) {
      toast.error("API do editor indisponivel no momento.");
      return;
    }

    try {
      const selected = (await htmlEditorControlApi.getSelectedText()).trim();
      if (!selected) throw new Error("Nenhum texto selecionado no editor.");
      setActionText(selected);
      toast.success("Trecho selecionado aplicado na caixa de texto.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao obter selecao.");
    }
  }, [htmlEditorControlApi]);

  const handleSelectAllContent = useCallback(async () => {
    if (!htmlEditorControlApi) {
      toast.error("Controle do editor indisponivel.");
      return;
    }

    try {
      await htmlEditorControlApi.selectAllContent();
      toast.success("Documento inteiro selecionado.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao selecionar todo o documento.");
    }
  }, [htmlEditorControlApi]);

  const handleTriggerSave = useCallback(async () => {
    if (!htmlEditorControlApi) {
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
      await htmlEditorControlApi.replaceSelectionRich(markdownContent, html);
      toast.success("Ultima resposta aplicada no cursor/selecao do editor.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao aplicar resposta no editor.");
    }
  }, [htmlEditorControlApi, responses]);

  const addResponse = (type: AIResponse["type"], query: string, content: string) => {
    setResponses((prev) => [{ id: crypto.randomUUID(), type, query, content, timestamp: new Date() }, ...prev]);
  };

  const insertRefBook = useCallback(async (book: string) => {
    const data = await insertRefBookMacro(book);
    return data.result;
  }, []);

  const handleOpenParameterSection = useCallback((section: ParameterPanelSection) => {
    setIsBookSearchEntryMode(false);
    setParameterPanelTarget({ section, id: null });
  }, []);

  const handleActionMacros = useCallback(async (type: MacroActionId) => {
    setParameterPanelTarget({ section: "macros", id: type });
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
      toast.success("Conteudo do historico inserido no final do editor.");
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
      toast.success(`Macro2 aplicada: ${result.converted} item(ns) convertidos para numeracao manual.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao executar Macro2.");
    } finally {
      setIsLoading(false);
    }
  }, [getEditorApi, macro2SpacingMode]);

  const handleEditorControlApiReady = useCallback((api: HtmlEditorControlApi | null) => {
    htmlEditorControlApiRef.current = api;
    setHtmlEditorControlApi(api);
  }, []);

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
      toast.success(
        `Highlight executado: ${result.matches} ocorr\u00eancia(s) encontradas e ${result.highlighted} destacada(s).`,
      );
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
      toast.success(`Marca\u00e7\u00e3o limpa em ${result.cleared} ocorr\u00eancia(s).`);
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
      if (!books.includes(selectedLexicalBook)) setSelectedLexicalBook(books[0] || "");
      return books;
    } catch (err: unknown) {
      setLexicalBooks([]);
      setSelectedLexicalBook("");
      const msg = err instanceof Error ? err.message : "Falha ao carregar livros para Book Search.";
      toast.error(msg);
      return [];
    }
  }, [lexicalBooks, selectedLexicalBook]);

  const handleActionApps = useCallback((type: AppActionId) => {
    setIsBookSearchEntryMode(false);
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
  }, [actionText, biblioExternaTitle, biblioGeralTitle, ensureLexicalBooksLoaded]);

  const handleOpenBookSearchFromLeft = useCallback(() => {
    setIsBookSearchEntryMode(true);
    setParameterPanelTarget({ section: "apps", id: null });
    void ensureLexicalBooksLoaded();
  }, [ensureLexicalBooksLoaded]);

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
          return `**${idx + 1}.\u00A0\u00A0**${titlePrefix}${body} ${sourceRef}`;
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
          const headerLine = `**${idx + 1}.\u00A0\u00A0** **${titlePart}** (*${areaPart}*) ● *${authorPart}* ● ${numberPart} ● ${datePart}`;
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
      const analysis = (await callOpenAI(analysisMessages)).trim();
      const content = analysis ? `${pensata}\n\n*Análise IA:*\n${analysis}` : pensata;
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
      if (!OPENAI_VECTOR_STORE_LO) {
        toast.error("Configure VITE_OPENAI_VECTOR_STORE_LO.");
        return;
      }

      setIsLoading(true);
      try {
        const chunks = await searchVectorStore(OPENAI_VECTOR_STORE_LO, text);
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
        const storeIds = OPENAI_VECTOR_STORES.split(",").map((s) => s.trim()).filter(Boolean);
        if (storeIds.length > 0) {
          const allChunks: string[] = [];
          for (const storeId of storeIds) {
            const chunks = await searchVectorStore(storeId, text);
            allChunks.push(...chunks);
          }
          if (allChunks.length > 0) ragContext = allChunks.join("\n\n---\n\n");
        }
      }
      if (type === "translate") {
        if (!OPENAI_VECTOR_STORE_TRANSLATE_RAG) {
          throw new Error("Configure VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG.");
        }
        const chunks = await searchVectorStore(OPENAI_VECTOR_STORE_TRANSLATE_RAG, text);
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
      const result = await callOpenAI(messages);
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
      const messages = buildChatPrompt(actionText, message, chatHistory);
      const result = await callOpenAI(messages);
      setChatHistory((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: result }]);
      addResponse("chat", message, result);
    } catch (_err) {
      // chat box is not rendered in this layout
    } finally {
      setIsLoading(false);
    }
  }, [openAiReady, actionText, chatHistory]);

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
      toast.success("Documento DOCX exportado.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao exportar DOCX.");
    } finally {
      setIsExportingDocx(false);
    }
  }, [currentFileId, currentFileName, documentText, editorContentHtml, htmlEditorControlApi]);

  const isHistoryProcessing =
    isLoading || isRunningInsertRefBook || isRunningInsertRefVerbete || isRunningBiblioGeral || isRunningBiblioExterna || isRunningLexicalSearch || isRunningVerbeteSearch;
  const hasEditorPanel = Boolean(currentFileId) || isOpeningDocument;
  const hasCenterPanel = hasEditorPanel || Boolean(parameterPanelTarget);
  const centerDefaultWithEditor = 100 - PANEL_SIZES.left.default - PANEL_SIZES.right.default;
  const centerMinWithEditor = PANEL_SIZES.parameter.min + PANEL_SIZES.editor.min;
  const centerMaxWithEditor = 100 - PANEL_SIZES.left.min - PANEL_SIZES.right.min;
  const parameterDefaultInCenter = hasEditorPanel
    ? (PANEL_SIZES.parameter.default / centerDefaultWithEditor) * 100
    : PANEL_SIZES.parameter.default;
  const parameterMinInCenter = hasEditorPanel
    ? (PANEL_SIZES.parameter.min / centerDefaultWithEditor) * 100
    : PANEL_SIZES.parameter.min;
  const parameterMaxInCenter = hasEditorPanel
    ? (PANEL_SIZES.parameter.max / centerDefaultWithEditor) * 100
    : PANEL_SIZES.parameter.max;
  const layoutResetKey = hasEditorPanel ? "layout-with-editor" : "layout-without-editor";

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <ResizablePanelGroup key={layoutResetKey} direction="horizontal">
        <ResizablePanel
          id="left-panel"
          order={1}
          defaultSize={PANEL_SIZES.left.default}
          minSize={PANEL_SIZES.left.min}
          maxSize={PANEL_SIZES.left.max}
          className="border-r border-border bg-card"
        >
          <LeftPanel
            stats={stats}
            onWordFileUpload={handleWordFileUpload}
            onCreateBlankDocument={handleCreateBlankDocument}
            onOpenParameterSection={handleOpenParameterSection}
            onRunRandomPensata={handleRunRandomPensata}
            onOpenBookSearch={handleOpenBookSearchFromLeft}
            isLoading={isLoading}
            hasDocumentOpen={Boolean(currentFileId)}
            onRefreshStats={() => void handleRefreshStats()}
          />
        </ResizablePanel>

        {hasCenterPanel && (
          <>
            <ResizableHandle withHandle />

            <ResizablePanel
              id="center-panel"
              order={2}
              defaultSize={
                hasEditorPanel
                  ? centerDefaultWithEditor
                  : PANEL_SIZES.parameter.default
              }
              minSize={
                hasEditorPanel
                  ? centerMinWithEditor
                  : PANEL_SIZES.parameter.min
              }
              maxSize={
                hasEditorPanel
                  ? centerMaxWithEditor
                  : PANEL_SIZES.parameter.max
              }
            >
              <ResizablePanelGroup direction="horizontal">
            {parameterPanelTarget && (
                <ResizablePanel
                  id="parameter-panel"
                  order={1}
                  defaultSize={parameterDefaultInCenter}
                  minSize={parameterMinInCenter}
                  maxSize={parameterMaxInCenter}
                  className={`border-r border-border ${sidePanelClass}`}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--panel-header))] px-4 py-3">
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
                            disabled={isLoading || (id === "pensatas" && !OPENAI_VECTOR_STORE_LO)}
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
                          ((isBookSearchEntryMode || parameterPanelTarget.id === "app4" || parameterPanelTarget.id === "app5")
                            ? (["app4", "app5"] as AppActionId[])
                            : APP_PANEL_BUTTONS).map((id) => (
                          (() => {
                            const Icon = APP_PANEL_ICONS[id];
                            return (
                          <Button
                            key={id}
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
                            );
                          })()
                        ))}

                        {parameterPanelTarget.section === "macros" && MACRO_PANEL_BUTTONS.map((id) => (
                          (() => {
                            const Icon = MACRO_PANEL_ICONS[id];
                            return (
                          <Button
                            key={id}
                            variant="ghost"
                            className={sectionActionButtonClass}
                            onClick={() => void handleActionMacros(id)}
                            disabled={isLoading || !currentFileId}
                          >
                            <Icon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block break-words text-sm font-medium text-foreground">{parameterMacroMeta[id].title}</span>
                              <span className="block break-words text-xs text-muted-foreground">{parameterMacroMeta[id].description}</span>
                            </span>
                          </Button>
                            );
                          })()
                        ))}
                      </div>
                    </div>

                    <div className="min-h-0 flex-1">
                      {parameterPanelTarget.section === "actions" && parameterPanelTarget.id ? (
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
                      ) : parameterPanelTarget.section === "macros" && parameterPanelTarget.id === "macro1" ? (
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
                          showPanelChrome={false}
                        />
                      ) : parameterPanelTarget.section === "macros" && parameterPanelTarget.id === "macro2" ? (
                        <Macro2ManualNumberingPanel
                          title={parameterMacroMeta.macro2.title}
                          description={parameterMacroMeta.macro2.description}
                          spacingMode={macro2SpacingMode}
                          onSpacingModeChange={setMacro2SpacingMode}
                          isRunning={isLoading}
                          onRun={() => void handleRunMacro2ManualNumbering()}
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
                      ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        
                        </div>
                      )}
                    </div>
                  </div>
                </ResizablePanel>
            )}

            {parameterPanelTarget && hasEditorPanel && <ResizableHandle withHandle />}

            {hasEditorPanel && (
            <ResizablePanel
              id="editor-panel"
              order={parameterPanelTarget ? 2 : 1}
              minSize={PANEL_SIZES.editor.min}
            >
              <main className="relative h-full min-w-0 bg-white">
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
                  }}
                />
                {isOpeningDocument && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm bg-green-50">
                      <Loader2 className="h-4 w-4 animate-spin text-primary bg-green-50" />
                      <span>Abrindo documento...</span>
                    </div>
                  </div>
                )}
              </main>
            </ResizablePanel>
            )}
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />
          </>
        )}

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
      </ResizablePanelGroup>

    </div>
  );
};

export default Index;







