import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { biblioExternaApp, biblioGeralApp, insertRefBookMacro, insertRefVerbeteApp, listLexicalBooksApp, listSemanticIndexesApp, openVerbetografiaTableApp, openVerbetografiaTableWordApp, randomPensataApp, searchLexicalBookApp, searchLexicalOverviewApp, searchSemanticOverviewApp, searchVerbeteApp, semanticSearchPensatasApp } from "@/lib/backend-api";
import { executeLLM, buildPensataAnalysisPrompt, buildVerbeteDefinologiaPrompt, buildVerbeteFatologiaPrompt, buildVerbeteFraseEnfaticaPrompt, buildVerbeteSinonimologiaPrompt } from "@/lib/openai";
import { BOOK_LABELS, type BookCode } from "@/lib/bookCatalog";
import { applySystemPromptOverride, getActionSystemPrompt, type ActionSystemPromptId } from "@/features/ghost-writer/config/actionSystemPrompts";
import { NO_VECTOR_STORE_ID } from "@/features/ghost-writer/config/constants";
import { normalizeIdList } from "@/features/ghost-writer/config/metadata";
import { DEFAULT_BOOK_SOURCE_ID } from "@/features/ghost-writer/config/options";
import type { AIResponse, AppActionId, AppPanelScope, LlmLogEntry, ParameterPanelTarget, RefBookMode, SemanticIndexOption, SemanticSearchRagContext } from "@/features/ghost-writer/types";
import { buildLexicalOverviewHistoryResponsePayload, buildLexicalSearchHistoryResponsePayload, buildSemanticOverviewHistoryResponsePayload, buildSemanticSearchHistoryResponsePayload } from "@/features/ghost-writer/utils/historySearchResponses";
import { HtmlEditorControlApi } from "@/lib/html-editor-control";

interface ToastApi {
  error: (message: string) => void;
  info: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
}

interface AiActionsLlmConfig {
  model: string;
  temperature: number;
  maxOutputTokens?: number;
  gpt5Verbosity?: string;
  gpt5Effort?: string;
  systemPrompt?: string;
  vectorStoreIds: string[];
  inputFileIds: string[];
}

interface UseGhostWriterAppsParams {
  actionText: string;
  setActionText: Dispatch<SetStateAction<string>>;
  selectedRefBook: BookCode;
  setSelectedRefBook: Dispatch<SetStateAction<BookCode>>;
  refBookMode: RefBookMode;
  refBookPages: string;
  verbeteInput: string;
  biblioGeralAuthor: string;
  biblioGeralTitle: string;
  setBiblioGeralTitle: Dispatch<SetStateAction<string>>;
  biblioGeralYear: string;
  biblioGeralExtra: string;
  biblioExternaAuthor: string;
  biblioExternaTitle: string;
  setBiblioExternaTitle: Dispatch<SetStateAction<string>>;
  biblioExternaYear: string;
  biblioExternaJournal: string;
  biblioExternaPublisher: string;
  biblioExternaIdentifier: string;
  biblioExternaExtra: string;
  biblioExternaFreeText: string;
  lexicalBooks: string[];
  setLexicalBooks: Dispatch<SetStateAction<string[]>>;
  selectedLexicalBook: string;
  setSelectedLexicalBook: Dispatch<SetStateAction<string>>;
  lexicalTerm: string;
  lexicalMaxResults: number;
  semanticSearchQuery: string;
  semanticSearchMaxResults: number;
  semanticMinScore: number | null;
  semanticUseRagContext: boolean;
  semanticExcludeLexicalDuplicates: boolean;
  setSemanticSearchLastRagContext: Dispatch<SetStateAction<SemanticSearchRagContext | null>>;
  setSemanticOverviewLastRagContext: Dispatch<SetStateAction<SemanticSearchRagContext | null>>;
  semanticSearchIndexes: SemanticIndexOption[];
  setSemanticSearchIndexes: Dispatch<SetStateAction<SemanticIndexOption[]>>;
  selectedSemanticSearchIndexId: string;
  setSelectedSemanticSearchIndexId: Dispatch<SetStateAction<string>>;
  setIsLoadingSemanticSearchIndexes: Dispatch<SetStateAction<boolean>>;
  semanticOverviewTerm: string;
  semanticOverviewMaxResults: number;
  verbeteSearchAuthor: string;
  verbeteSearchTitle: string;
  verbeteSearchArea: string;
  verbeteSearchText: string;
  verbeteSearchMaxResults: number;
  verbetografiaTitle: string;
  setVerbetografiaTitle: Dispatch<SetStateAction<string>>;
  verbetografiaSpecialty: string;
  biblioExternaLlmModel: string;
  biblioExternaLlmTemperature: number;
  biblioExternaLlmMaxOutputTokens: number;
  biblioExternaLlmVerbosity: string;
  biblioExternaLlmEffort: string;
  biblioExternaLlmSystemPrompt: string;
  aiActionSystemPrompts: Partial<Record<ActionSystemPromptId, string>>;
  documentText: string;
  openAiReady: boolean;
  isLoading: boolean;
  includeEditorContextInLlm: boolean;
  llmEditorContextMaxChars: number;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsOpeningDocument: Dispatch<SetStateAction<boolean>>;
  setCurrentFileId: Dispatch<SetStateAction<string>>;
  setCurrentFileName: Dispatch<SetStateAction<string>>;
  setCurrentFileConvertedFromPdf: Dispatch<SetStateAction<boolean>>;
  setIsRunningInsertRefBook: Dispatch<SetStateAction<boolean>>;
  setIsRunningInsertRefVerbete: Dispatch<SetStateAction<boolean>>;
  setIsRunningBiblioGeral: Dispatch<SetStateAction<boolean>>;
  setIsRunningBiblioExterna: Dispatch<SetStateAction<boolean>>;
  setIsRunningLexicalSearch: Dispatch<SetStateAction<boolean>>;
  setIsRunningLexicalOverview: Dispatch<SetStateAction<boolean>>;
  setIsRunningSemanticSearch: Dispatch<SetStateAction<boolean>>;
  setIsRunningSemanticOverview: Dispatch<SetStateAction<boolean>>;
  setIsRunningVerbeteSearch: Dispatch<SetStateAction<boolean>>;
  setIsRunningVerbetografiaOpenTable: Dispatch<SetStateAction<boolean>>;
  setIsRunningVerbetografiaOpenTableWord: Dispatch<SetStateAction<boolean>>;
  setIsRunningVerbeteDefinologia: Dispatch<SetStateAction<boolean>>;
  setIsRunningVerbeteFraseEnfatica: Dispatch<SetStateAction<boolean>>;
  setIsRunningVerbeteSinonimologia: Dispatch<SetStateAction<boolean>>;
  setIsRunningVerbeteFatologia: Dispatch<SetStateAction<boolean>>;
  setLlmLogs: Dispatch<SetStateAction<LlmLogEntry[]>>;
  setLlmSessionLogs: Dispatch<SetStateAction<LlmLogEntry[]>>;
  setAppPanelScope: Dispatch<SetStateAction<AppPanelScope | null>>;
  setParameterPanelTarget: Dispatch<SetStateAction<ParameterPanelTarget>>;
  aiActionsLlmConfigRef: MutableRefObject<AiActionsLlmConfig>;
  aiActionsSelectedVectorStoreIds: string[];
  uploadedChatFiles: Array<{ id: string }>;
  getEditorApi: () => Promise<HtmlEditorControlApi | null>;
  backendNotReadyMessage: () => string;
  executeAiActionsLLMWithLog: (payload: Parameters<typeof executeLLM>[0]) => Promise<Awaited<ReturnType<typeof executeLLM>>>;
  executeLLMWithLog: (payload: Parameters<typeof executeLLM>[0]) => Promise<Awaited<ReturnType<typeof executeLLM>>>;
  addResponse: (type: AIResponse["type"], query: string, content: string, payload?: AIResponse["payload"]) => void;
  toast: ToastApi;
}

const normalizeRefPages = (pages: string) => (
  pages
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ")
);

const createLlmLogEntry = (incomingLog: { request?: unknown; response?: unknown; error?: unknown } | null | undefined): LlmLogEntry | null => {
  if (!incomingLog) return null;
  if (incomingLog.request === undefined && incomingLog.response === undefined && incomingLog.error === undefined) return null;
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    request: incomingLog.request ?? {},
    response: incomingLog.response ?? {},
    error: typeof incomingLog.error === "string" ? incomingLog.error : undefined,
  };
};

const buildSemanticSearchEmptyMessage = ({
  minScore,
  requestedMinScore,
  recommendedMinScore,
  lexicalFilteredCount,
}: {
  minScore: number;
  requestedMinScore: number | null;
  recommendedMinScore: number;
  lexicalFilteredCount: number;
}) => {
  const details = [
    `Score minimo efetivo: ${minScore.toFixed(2)}`,
    requestedMinScore === null ? `Calibrado da base: ${recommendedMinScore.toFixed(2)}` : "",
    lexicalFilteredCount > 0 ? `Duplicados lexicos filtrados: ${lexicalFilteredCount}` : "",
  ].filter(Boolean);
  return `Nenhuma pensata semanticamente afim encontrada.${details.length > 0 ? ` ${details.join(" | ")}` : ""}`;
};

const buildSemanticOverviewEmptyMessage = ({
  minScore,
  recommendedMinScoreMin,
  recommendedMinScoreMax,
  lexicalFilteredCount,
}: {
  minScore: number;
  recommendedMinScoreMin: number;
  recommendedMinScoreMax: number;
  lexicalFilteredCount: number;
}) => {
  const details = [
    `Piso global: ${minScore.toFixed(2)}`,
    `Faixa calibrada: ${recommendedMinScoreMin.toFixed(2)}-${recommendedMinScoreMax.toFixed(2)}`,
    lexicalFilteredCount > 0 ? `Duplicados lexicos filtrados: ${lexicalFilteredCount}` : "",
  ].filter(Boolean);
  return `Nenhum resultado semanticamente afim encontrado.${details.length > 0 ? ` ${details.join(" | ")}` : ""}`;
};

const buildVerbeteSearchMarkdown = (matches: Array<{
  title?: string;
  text?: string;
  number?: number | null;
  link?: string;
  data?: Record<string, unknown>;
}>) => matches
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
    const definologiaPart = `${rowText || ""}`.trim();
    const linkPart = rowLink ? `[PDF](${rowLink})` : "";
    const headerLine = `**${titlePart}** (*${areaPart}*) ● *${authorPart}* ● ${numberPart} ● ${datePart}`;
    return [headerLine, definologiaPart, linkPart].filter(Boolean).join("\n");
  })
  .join("\n");

const useGhostWriterApps = ({
  actionText,
  setActionText,
  selectedRefBook,
  setSelectedRefBook,
  refBookMode,
  refBookPages,
  verbeteInput,
  biblioGeralAuthor,
  biblioGeralTitle,
  setBiblioGeralTitle,
  biblioGeralYear,
  biblioGeralExtra,
  biblioExternaAuthor,
  biblioExternaTitle,
  setBiblioExternaTitle,
  biblioExternaYear,
  biblioExternaJournal,
  biblioExternaPublisher,
  biblioExternaIdentifier,
  biblioExternaExtra,
  biblioExternaFreeText,
  lexicalBooks,
  setLexicalBooks,
  selectedLexicalBook,
  setSelectedLexicalBook,
  lexicalTerm,
  lexicalMaxResults,
  semanticSearchQuery,
  semanticSearchMaxResults,
  semanticMinScore,
  semanticUseRagContext,
  semanticExcludeLexicalDuplicates,
  setSemanticSearchLastRagContext,
  setSemanticOverviewLastRagContext,
  semanticSearchIndexes,
  setSemanticSearchIndexes,
  selectedSemanticSearchIndexId,
  setSelectedSemanticSearchIndexId,
  setIsLoadingSemanticSearchIndexes,
  semanticOverviewTerm,
  semanticOverviewMaxResults,
  verbeteSearchAuthor,
  verbeteSearchTitle,
  verbeteSearchArea,
  verbeteSearchText,
  verbeteSearchMaxResults,
  verbetografiaTitle,
  setVerbetografiaTitle,
  verbetografiaSpecialty,
  biblioExternaLlmModel,
  biblioExternaLlmTemperature,
  biblioExternaLlmMaxOutputTokens,
  biblioExternaLlmVerbosity,
  biblioExternaLlmEffort,
  biblioExternaLlmSystemPrompt,
  aiActionSystemPrompts,
  documentText,
  openAiReady,
  isLoading,
  includeEditorContextInLlm,
  llmEditorContextMaxChars,
  setIsLoading,
  setIsOpeningDocument,
  setCurrentFileId,
  setCurrentFileName,
  setCurrentFileConvertedFromPdf,
  setIsRunningInsertRefBook,
  setIsRunningInsertRefVerbete,
  setIsRunningBiblioGeral,
  setIsRunningBiblioExterna,
  setIsRunningLexicalSearch,
  setIsRunningLexicalOverview,
  setIsRunningSemanticSearch,
  setIsRunningSemanticOverview,
  setIsRunningVerbeteSearch,
  setIsRunningVerbetografiaOpenTable,
  setIsRunningVerbetografiaOpenTableWord,
  setIsRunningVerbeteDefinologia,
  setIsRunningVerbeteFraseEnfatica,
  setIsRunningVerbeteSinonimologia,
  setIsRunningVerbeteFatologia,
  setLlmLogs,
  setLlmSessionLogs,
  setAppPanelScope,
  setParameterPanelTarget,
  aiActionsLlmConfigRef,
  aiActionsSelectedVectorStoreIds,
  uploadedChatFiles,
  getEditorApi,
  backendNotReadyMessage,
  executeAiActionsLLMWithLog,
  executeLLMWithLog,
  addResponse,
  toast,
}: UseGhostWriterAppsParams) => {
  const pushLlmLogEntry = useCallback((incomingLog: { request?: unknown; response?: unknown; error?: unknown } | null | undefined) => {
    const nextLog = createLlmLogEntry(incomingLog);
    if (!nextLog) return;
    setLlmLogs([nextLog]);
    setLlmSessionLogs((prev) => [...prev, nextLog]);
  }, [setLlmLogs, setLlmSessionLogs]);

  const handleSelectRefBook = useCallback((book: BookCode) => {
    setSelectedRefBook(book);
  }, [setSelectedRefBook]);

  const handleRunInsertRefBook = useCallback(async () => {
    setIsRunningInsertRefBook(true);
    try {
      const rawResult = (await insertRefBookMacro(selectedRefBook, refBookMode)).result.trim();
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
  }, [addResponse, refBookMode, refBookPages, selectedRefBook, setIsRunningInsertRefBook, toast]);

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
  }, [addResponse, setIsRunningInsertRefVerbete, toast, verbeteInput]);

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
  }, [addResponse, biblioGeralAuthor, biblioGeralExtra, biblioGeralTitle, biblioGeralYear, setIsRunningBiblioGeral, toast]);

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
        pushLlmLogEntry(incomingLogs[incomingLogs.length - 1]);
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
  }, [addResponse, biblioExternaAuthor, biblioExternaExtra, biblioExternaFreeText, biblioExternaIdentifier, biblioExternaJournal, biblioExternaLlmEffort, biblioExternaLlmMaxOutputTokens, biblioExternaLlmModel, biblioExternaLlmSystemPrompt, biblioExternaLlmTemperature, biblioExternaLlmVerbosity, biblioExternaPublisher, biblioExternaTitle, biblioExternaYear, pushLlmLogEntry, setIsRunningBiblioExterna, toast]);

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
      const msg = err instanceof Error ? err.message : "Falha ao carregar livros para Lexical Search.";
      toast.error(msg);
      return [];
    }
  }, [lexicalBooks, selectedLexicalBook, setLexicalBooks, setSelectedLexicalBook, toast]);

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
  }, [semanticSearchIndexes, setIsLoadingSemanticSearchIndexes, setSemanticSearchIndexes, setSelectedSemanticSearchIndexId, toast]);

  const handleActionApps = useCallback((type: AppActionId) => {
    if (type === "app4" || type === "app13" || type === "app5") {
      setAppPanelScope("busca_termos");
    } else if (type === "app12") {
      setAppPanelScope("semantic_search");
    } else if (type === "app7" || type === "app8" || type === "app11" || type === "app9" || type === "app10") {
      setAppPanelScope("verbetografia");
    } else {
      setAppPanelScope("bibliografia");
    }
    setParameterPanelTarget({ section: "apps", id: type });
    if (type === "app3" && !biblioGeralTitle.trim() && actionText.trim()) {
      setBiblioGeralTitle(actionText.trim());
    }
    if (type === "app6" && !biblioExternaTitle.trim() && actionText.trim()) {
      setBiblioExternaTitle(actionText.trim());
    }
    if (type === "app4") {
      void ensureLexicalBooksLoaded();
    }
    if (type === "app12") {
      void ensureSemanticIndexesLoaded();
    }
    if ((type === "app7" || type === "app8" || type === "app11" || type === "app9" || type === "app10") && !verbetografiaTitle.trim() && actionText.trim()) {
      setVerbetografiaTitle(actionText.trim());
    }
  }, [actionText, biblioExternaTitle, biblioGeralTitle, ensureLexicalBooksLoaded, ensureSemanticIndexesLoaded, setAppPanelScope, setBiblioExternaTitle, setBiblioGeralTitle, setParameterPanelTarget, setVerbetografiaTitle, verbetografiaTitle]);

  const handleOpenBookSearchFromLeft = useCallback(() => {
    setAppPanelScope("busca_termos");
    setParameterPanelTarget({ section: "apps", id: null });
    void ensureLexicalBooksLoaded();
  }, [ensureLexicalBooksLoaded, setAppPanelScope, setParameterPanelTarget]);

  const handleOpenSemanticSearchFromLeft = useCallback(() => {
    setAppPanelScope("semantic_search");
    setParameterPanelTarget({ section: "apps", id: "app12" });
    void ensureSemanticIndexesLoaded();
  }, [ensureSemanticIndexesLoaded, setAppPanelScope, setParameterPanelTarget]);

  const handleOpenVerbetografiaFromLeft = useCallback(() => {
    setAppPanelScope("verbetografia");
    setParameterPanelTarget({ section: "apps", id: null });
  }, [setAppPanelScope, setParameterPanelTarget]);

  const handleOpenVerbetografiaTableFromLeft = useCallback(() => {
    setAppPanelScope("verbetografia");
    setParameterPanelTarget({ section: "apps", id: "app7" });
  }, [setAppPanelScope, setParameterPanelTarget]);

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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao abrir tabela de verbetografia.");
    } finally {
      setIsOpeningDocument(false);
      setIsRunningVerbetografiaOpenTable(false);
    }
  }, [setActionText, setCurrentFileConvertedFromPdf, setCurrentFileId, setCurrentFileName, setIsOpeningDocument, setIsRunningVerbetografiaOpenTable, toast, verbetografiaSpecialty, verbetografiaTitle]);

  const handleOpenVerbetografiaTableWord = useCallback(async () => {
    setIsRunningVerbetografiaOpenTableWord(true);
    try {
      await openVerbetografiaTableWordApp({
        title: verbetografiaTitle.trim(),
        specialty: verbetografiaSpecialty.trim(),
      });
      toast.success("Tabela verbete aberta no Word local.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao abrir tabela de verbetografia no Word.");
    } finally {
      setIsRunningVerbetografiaOpenTableWord(false);
    }
  }, [setIsRunningVerbetografiaOpenTableWord, toast, verbetografiaSpecialty, verbetografiaTitle]);

  const buildVerbetografiaQueryContext = useCallback(async () => {
    const currentConfig = aiActionsLlmConfigRef.current;
    const normalizedVectorStoreIds = normalizeIdList(currentConfig.vectorStoreIds);
    const hasExplicitNone = normalizedVectorStoreIds.includes(NO_VECTOR_STORE_ID);
    const vectorStoreIds = normalizedVectorStoreIds.filter((id) => id.startsWith("vs_"));
    const effectiveVectorStoreIds = hasExplicitNone
      ? []
      : vectorStoreIds.length > 0
        ? vectorStoreIds
        : [DEFAULT_BOOK_SOURCE_ID].filter(Boolean);
    const inputFileIds = normalizeIdList(uploadedChatFiles.map((file) => file.id));
    const editorApi = await getEditorApi();
    const latestEditorText = editorApi ? await editorApi.getDocumentText() : documentText;
    const normalizedEditorText = (latestEditorText || "").trim();
    const editorContextTruncated = normalizedEditorText.length > llmEditorContextMaxChars;
    const editorPlainTextContext = normalizedEditorText.slice(0, llmEditorContextMaxChars);
    return { vectorStoreIds: effectiveVectorStoreIds, inputFileIds, editorContextTruncated, editorPlainTextContext };
  }, [aiActionsLlmConfigRef, documentText, getEditorApi, llmEditorContextMaxChars, uploadedChatFiles]);

  const buildVerbetografiaActionLabel = useCallback((title: string, specialty: string) => (
    specialty ? `Título: ${title} | Especialidade: ${specialty}` : `Título: ${title}`
  ), []);

  const buildVerbetografiaActionQuery = useCallback((sectionLabel: string, title: string, specialty: string) => (
    specialty
      ? `Escreva uma ${sectionLabel} do tema do verbete com título: ${title} e especialidade: ${specialty}.`
      : `Escreva uma ${sectionLabel} do tema do verbete com título: ${title}.`
  ), []);

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

    setIsRunningVerbeteDefinologia(true);
    try {
      const { vectorStoreIds, inputFileIds, editorContextTruncated, editorPlainTextContext } = await buildVerbetografiaQueryContext();
      const query = buildVerbetografiaActionQuery("Definologia", title, specialty);
      const messages = applySystemPromptOverride(
        buildVerbeteDefinologiaPrompt(query, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm),
        getActionSystemPrompt(aiActionSystemPrompts, "app8"),
      );
      const result = (await executeAiActionsLLMWithLog({ messages, systemPrompt: "", vectorStoreIds, inputFileIds })).content.trim();
      addResponse("app_verbete_definologia", buildVerbetografiaActionLabel(title, specialty), result || "Sem conteudo retornado pela IA.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Definologia.";
      toast.error(msg);
      addResponse("app_verbete_definologia", buildVerbetografiaActionLabel(verbetografiaTitle.trim(), verbetografiaSpecialty.trim()), `Erro na Definologia: ${msg}`);
    } finally {
      setIsRunningVerbeteDefinologia(false);
    }
  }, [addResponse, aiActionSystemPrompts, backendNotReadyMessage, buildVerbetografiaActionLabel, buildVerbetografiaActionQuery, buildVerbetografiaQueryContext, executeAiActionsLLMWithLog, includeEditorContextInLlm, openAiReady, setIsRunningVerbeteDefinologia, toast, verbetografiaSpecialty, verbetografiaTitle]);

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

    setIsRunningVerbeteFraseEnfatica(true);
    try {
      const { vectorStoreIds, inputFileIds, editorContextTruncated, editorPlainTextContext } = await buildVerbetografiaQueryContext();
      const query = buildVerbetografiaActionQuery("Frase Enfática", title, specialty);
      const messages = applySystemPromptOverride(
        buildVerbeteFraseEnfaticaPrompt(query, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm),
        getActionSystemPrompt(aiActionSystemPrompts, "app11"),
      );
      const result = (await executeAiActionsLLMWithLog({ messages, systemPrompt: "", vectorStoreIds, inputFileIds })).content.trim();
      addResponse("app_verbete_frase_enfatica", buildVerbetografiaActionLabel(title, specialty), result || "Sem conteudo retornado pela IA.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Frase Enfática.";
      toast.error(msg);
      addResponse("app_verbete_frase_enfatica", buildVerbetografiaActionLabel(verbetografiaTitle.trim(), verbetografiaSpecialty.trim()), `Erro na Frase Enfática: ${msg}`);
    } finally {
      setIsRunningVerbeteFraseEnfatica(false);
    }
  }, [addResponse, aiActionSystemPrompts, backendNotReadyMessage, buildVerbetografiaActionLabel, buildVerbetografiaActionQuery, buildVerbetografiaQueryContext, executeAiActionsLLMWithLog, includeEditorContextInLlm, openAiReady, setIsRunningVerbeteFraseEnfatica, toast, verbetografiaSpecialty, verbetografiaTitle]);

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

    setIsRunningVerbeteSinonimologia(true);
    try {
      const { vectorStoreIds, inputFileIds, editorContextTruncated, editorPlainTextContext } = await buildVerbetografiaQueryContext();
      const query = buildVerbetografiaActionQuery("Sinonimologia", title, specialty);
      const messages = applySystemPromptOverride(
        buildVerbeteSinonimologiaPrompt(query, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm),
        getActionSystemPrompt(aiActionSystemPrompts, "app9"),
      );
      const result = (await executeAiActionsLLMWithLog({ messages, systemPrompt: "", vectorStoreIds, inputFileIds })).content.trim();
      addResponse("app_verbete_sinonimologia", buildVerbetografiaActionLabel(title, specialty), result || "Sem conteudo retornado pela IA.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Sinonimologia.";
      toast.error(msg);
      addResponse("app_verbete_sinonimologia", buildVerbetografiaActionLabel(verbetografiaTitle.trim(), verbetografiaSpecialty.trim()), `Erro na Sinonimologia: ${msg}`);
    } finally {
      setIsRunningVerbeteSinonimologia(false);
    }
  }, [addResponse, aiActionSystemPrompts, backendNotReadyMessage, buildVerbetografiaActionLabel, buildVerbetografiaActionQuery, buildVerbetografiaQueryContext, executeAiActionsLLMWithLog, includeEditorContextInLlm, openAiReady, setIsRunningVerbeteSinonimologia, toast, verbetografiaSpecialty, verbetografiaTitle]);

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

    setIsRunningVerbeteFatologia(true);
    try {
      const { vectorStoreIds, inputFileIds, editorContextTruncated, editorPlainTextContext } = await buildVerbetografiaQueryContext();
      const query = buildVerbetografiaActionQuery("Fatologia", title, specialty);
      const messages = applySystemPromptOverride(
        buildVerbeteFatologiaPrompt(query, editorPlainTextContext, editorContextTruncated, includeEditorContextInLlm),
        getActionSystemPrompt(aiActionSystemPrompts, "app10"),
      );
      const result = (await executeAiActionsLLMWithLog({ messages, systemPrompt: "", vectorStoreIds, inputFileIds })).content.trim();
      addResponse("app_verbete_fatologia", buildVerbetografiaActionLabel(title, specialty), result || "Sem conteudo retornado pela IA.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Fatologia.";
      toast.error(msg);
      addResponse("app_verbete_fatologia", buildVerbetografiaActionLabel(verbetografiaTitle.trim(), verbetografiaSpecialty.trim()), `Erro na Fatologia: ${msg}`);
    } finally {
      setIsRunningVerbeteFatologia(false);
    }
  }, [addResponse, aiActionSystemPrompts, backendNotReadyMessage, buildVerbetografiaActionLabel, buildVerbetografiaActionQuery, buildVerbetografiaQueryContext, executeAiActionsLLMWithLog, includeEditorContextInLlm, openAiReady, setIsRunningVerbeteFatologia, toast, verbetografiaSpecialty, verbetografiaTitle]);

  const handleSelectVerbetografiaAction = useCallback((type: "app7" | "app8" | "app11" | "app9" | "app10") => {
    setAppPanelScope("verbetografia");
    setParameterPanelTarget({ section: "apps", id: type });
    if (!verbetografiaTitle.trim() && actionText.trim()) setVerbetografiaTitle(actionText.trim());
  }, [actionText, setAppPanelScope, setParameterPanelTarget, setVerbetografiaTitle, verbetografiaTitle]);

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
      const payload = buildLexicalSearchHistoryResponsePayload({ book, term, totalFound, maxResults, matches });
      addResponse("app_book_search", payload.querySummary, payload.markdown);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Lexical Search.";
      toast.error(msg);
    } finally {
      setIsRunningLexicalSearch(false);
    }
  }, [addResponse, lexicalMaxResults, lexicalTerm, selectedLexicalBook, setIsRunningLexicalSearch, toast]);

  const handleRunLexicalOverview = useCallback(async () => {
    const term = lexicalTerm.trim();
    const limit = Math.max(1, Math.min(100, lexicalMaxResults || 1));
    if (!term) {
      toast.error("Informe um termo para busca.");
      return;
    }

    setIsRunningLexicalOverview(true);
    try {
      const data = await searchLexicalOverviewApp({ term, limit });
      const totalBooks = Number(data.result.totalBooks || 0);
      const totalFound = Number(data.result.totalFound || 0);
      const groups = data.result.groups || [];
      if (groups.length <= 0 || totalFound <= 0) {
        toast.info("Nenhuma ocorrencia encontrada.");
        return;
      }
      const payload = buildLexicalOverviewHistoryResponsePayload({
        term,
        limit,
        totalBooks,
        totalFound,
        groups,
      });
      addResponse("app_lexical_overview", payload.querySummary, payload.markdown, payload.payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Lexical Overview.";
      toast.error(msg);
    } finally {
      setIsRunningLexicalOverview(false);
    }
  }, [addResponse, lexicalMaxResults, lexicalTerm, setIsRunningLexicalOverview, toast]);

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
      const vectorStoreIds = normalizeIdList(aiActionsSelectedVectorStoreIds).filter((id) => id.startsWith("vs_"));
      const data = await semanticSearchPensatasApp({
        indexId,
        query,
        limit: maxResults,
        minScore: semanticMinScore ?? undefined,
        useRagContext: semanticUseRagContext,
        excludeLexicalDuplicates: semanticExcludeLexicalDuplicates,
        vectorStoreIds,
      });
      const totalFound = Number(data.result.total || 0);
      const requestedMinScore = typeof data.result.requestedMinScore === "number" ? data.result.requestedMinScore : null;
      const recommendedMinScore = Number(data.result.recommendedMinScore ?? 0);
      const minScore = Number(data.result.minScore || recommendedMinScore || 0);
      const lexicalFilteredCount = Number(data.result.lexicalFilteredCount || 0);
      setSemanticSearchLastRagContext(data.result.ragContext ?? null);
      pushLlmLogEntry(data.result.ragLlmLog);
      const matches = (data.result.matches || []).slice(0, maxResults);
      if (matches.length <= 0) {
        toast.info(buildSemanticSearchEmptyMessage({
          minScore,
          requestedMinScore,
          recommendedMinScore,
          lexicalFilteredCount,
        }));
        return;
      }
      const payload = buildSemanticSearchHistoryResponsePayload({
        selectedIndexId: indexId,
        indexes: semanticSearchIndexes,
        query,
        totalFound,
        requestedMinScore,
        recommendedMinScore,
        minScore,
        ignoreBaseCalibration: requestedMinScore !== null,
        lexicalFilteredCount,
        matches,
      });
      addResponse("app_semantic_search", payload.querySummary, payload.markdown);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Semantic Search.";
      toast.error(msg);
    } finally {
      setIsRunningSemanticSearch(false);
    }
  }, [addResponse, aiActionsSelectedVectorStoreIds, pushLlmLogEntry, selectedSemanticSearchIndexId, semanticExcludeLexicalDuplicates, semanticMinScore, semanticSearchIndexes, semanticSearchMaxResults, semanticSearchQuery, semanticUseRagContext, setIsRunningSemanticSearch, setSemanticSearchLastRagContext, toast]);

  const handleRunSemanticOverview = useCallback(async () => {
    const term = semanticOverviewTerm.trim();
    const limit = Math.max(1, Math.min(100, semanticOverviewMaxResults || 1));
    if (!term) {
      toast.error("Informe um termo para busca.");
      return;
    }

    setIsRunningSemanticOverview(true);
    try {
      const vectorStoreIds = normalizeIdList(aiActionsSelectedVectorStoreIds).filter((id) => id.startsWith("vs_"));
      const data = await searchSemanticOverviewApp({
        term,
        limit,
        minScore: semanticMinScore ?? undefined,
        useRagContext: semanticUseRagContext,
        excludeLexicalDuplicates: semanticExcludeLexicalDuplicates,
        vectorStoreIds,
      });
      const totalIndexes = Number(data.result.totalIndexes || 0);
      const totalFound = Number(data.result.totalFound || 0);
      const recommendedMinScoreMin = Number(data.result.recommendedMinScoreMin || 0);
      const recommendedMinScoreMax = Number(data.result.recommendedMinScoreMax || 0);
      const minScore = typeof data.result.minScore === "number" ? data.result.minScore : recommendedMinScoreMin;
      const usesCalibratedMinScores = Boolean(data.result.usesCalibratedMinScores);
      const lexicalFilteredCount = Number(data.result.lexicalFilteredCount || 0);
      setSemanticOverviewLastRagContext(data.result.ragContext ?? null);
      pushLlmLogEntry(data.result.ragLlmLog);
      const groups = data.result.groups || [];
      if (groups.length <= 0 || totalFound <= 0) {
        toast.info(buildSemanticOverviewEmptyMessage({
          minScore,
          recommendedMinScoreMin,
          recommendedMinScoreMax,
          lexicalFilteredCount,
        }));
        return;
      }
      const payload = buildSemanticOverviewHistoryResponsePayload({
        term,
        limit,
        minScore,
        recommendedMinScoreMin,
        recommendedMinScoreMax,
        usesCalibratedMinScores,
        ignoreBaseCalibration: !usesCalibratedMinScores,
        totalIndexes,
        totalFound,
        lexicalFilteredCount,
        groups,
      });
      addResponse("app_semantic_overview", payload.querySummary, payload.markdown, payload.payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Semantic Overview.";
      toast.error(msg);
    } finally {
      setIsRunningSemanticOverview(false);
    }
  }, [addResponse, aiActionsSelectedVectorStoreIds, pushLlmLogEntry, semanticExcludeLexicalDuplicates, semanticMinScore, semanticOverviewMaxResults, semanticOverviewTerm, semanticUseRagContext, setIsRunningSemanticOverview, setSemanticOverviewLastRagContext, toast]);

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
      const queryParts = [
        author && `Author: ${author}`,
        title && `Title: ${title}`,
        area && `Area: ${area}`,
        text && `Text: ${text}`,
      ].filter(Boolean);
      addResponse(
        "app_verbete_search",
        `${queryParts.join(" | ")} | Total: ${totalFound}${totalFound > maxResults ? ` | Exibidos: ${maxResults}` : ""}`,
        buildVerbeteSearchMarkdown(matches),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Busca em Verbetes.";
      toast.error(msg);
    } finally {
      setIsRunningVerbeteSearch(false);
    }
  }, [addResponse, setIsRunningVerbeteSearch, toast, verbeteSearchArea, verbeteSearchAuthor, verbeteSearchMaxResults, verbeteSearchText, verbeteSearchTitle]);

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
      const page = (result.page || "").trim();
      const number = Number(result.paragraph_number || 0);
      const total = Number(result.total_paragraphs || 0);
      const paragraph = (result.paragraph || "").trim();
      const header = `Livro: ${source} | Paragrafo: ${number}${total > 0 ? `/${total}` : ""}${page ? ` | p. ${page}` : ""}`;
      const pensata = paragraph || "Paragrafo nao encontrado.";
      const analysisMessages = buildPensataAnalysisPrompt(pensata);
      const analysis = (await executeLLMWithLog({
        messages: analysisMessages,
        vectorStoreIds: ["vs_6912908250e4819197e23fe725e04fae"],
      })).content.trim();
      const content = analysis ? `${pensata}\n\n**Análise IA:** ${analysis}` : pensata;
      addResponse("app_random_pensata", header, content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Pensata do Dia.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [addResponse, backendNotReadyMessage, executeLLMWithLog, isLoading, openAiReady, setIsLoading, toast]);

  return {
    ensureLexicalBooksLoaded,
    ensureSemanticIndexesLoaded,
    handleActionApps,
    handleOpenBookSearchFromLeft,
    handleOpenSemanticSearchFromLeft,
    handleOpenVerbetografiaFromLeft,
    handleOpenVerbetografiaTableFromLeft,
    handleSelectRefBook,
    handleRunInsertRefBook,
    handleRunInsertRefVerbete,
    handleRunBiblioGeral,
    handleRunBiblioExterna,
    handleOpenVerbetografiaTable,
    handleOpenVerbetografiaTableWord,
    handleRunVerbeteDefinologia,
    handleRunVerbeteFraseEnfatica,
    handleRunVerbeteSinonimologia,
    handleRunVerbeteFatologia,
    handleSelectVerbetografiaAction,
    handleRunLexicalSearch,
    handleRunLexicalOverview,
    handleRunSemanticSearch,
    handleRunSemanticOverview,
    handleRunVerbeteSearch,
    handleRunRandomPensata,
  };
};

export default useGhostWriterApps;
