import { useRef, useState } from "react";
import { BIBLIO_EXTERNA_DEFAULT_SYSTEM_PROMPT, CHAT_MAX_OUTPUT_TOKENS, CHAT_MAX_NUM_RESULTS, CHAT_MODEL, CHAT_SYSTEM_PROMPT, CHAT_TEMPERATURE, CHAT_GPT5_VERBOSITY, CHAT_GPT5_EFFORT, type UploadedLlmFile } from "@/lib/openai";
import { HtmlEditorControlApi } from "@/lib/html-editor-control";
import type { BackendStatus, Macro2SpacingMode } from "@/features/ghost-writer/types";
import { DEFAULT_ACTION_SYSTEM_PROMPTS, type ActionSystemPromptId } from "@/features/ghost-writer/config/actionSystemPrompts";
import { CHAT_EDITOR_CONTEXT_MAX_CHARS, DEFAULT_BOOK_SEARCH_MAX_RESULTS, DEFAULT_LOG_FONT_SIZE_PX } from "@/features/ghost-writer/config/constants";
import { DEFAULT_BOOK_SOURCE_ID, MACRO1_HIGHLIGHT_COLORS, TRANSLATE_LANGUAGE_OPTIONS } from "@/features/ghost-writer/config/options";
import type { BookCode } from "@/lib/bookCatalog";
import type { AIResponse, SemanticIndexOption } from "@/features/ghost-writer/types";
import type { ChatMessage } from "@/lib/openai";

export const useGhostWriterDocumentState = () => {
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
  const [htmlEditorControlApi, setHtmlEditorControlApi] = useState<HtmlEditorControlApi | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isImportingDocument, setIsImportingDocument] = useState(false);
  const [selectedImportFileName, setSelectedImportFileName] = useState("");
  const [macro1Term, setMacro1Term] = useState("");
  const [macro1ColorId, setMacro1ColorId] = useState<(typeof MACRO1_HIGHLIGHT_COLORS)[number]["id"]>("yellow");
  const [macro1PredictedMatches, setMacro1PredictedMatches] = useState<number | null>(null);
  const [isCountingMacro1Matches, setIsCountingMacro1Matches] = useState(false);
  const [macro2SpacingMode, setMacro2SpacingMode] = useState<Macro2SpacingMode>("nbsp_double");

  const saveTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const htmlEditorControlApiRef = useRef<HtmlEditorControlApi | null>(null);
  const currentFileIdRef = useRef("");
  const macro1CountRequestIdRef = useRef(0);

  return {
    documentText,
    setDocumentText,
    currentFileName,
    setCurrentFileName,
    currentFileConvertedFromPdf,
    setCurrentFileConvertedFromPdf,
    documentPageCount,
    setDocumentPageCount,
    documentParagraphCount,
    setDocumentParagraphCount,
    documentWordCount,
    setDocumentWordCount,
    documentSymbolCount,
    setDocumentSymbolCount,
    documentSymbolWithSpacesCount,
    setDocumentSymbolWithSpacesCount,
    currentFileId,
    setCurrentFileId,
    statsKey,
    setStatsKey,
    openedDocumentVersion,
    setOpenedDocumentVersion,
    editorContentHtml,
    setEditorContentHtml,
    isOpeningDocument,
    setIsOpeningDocument,
    htmlEditorControlApi,
    setHtmlEditorControlApi,
    isExportingDocx,
    setIsExportingDocx,
    isImportingDocument,
    setIsImportingDocument,
    selectedImportFileName,
    setSelectedImportFileName,
    macro1Term,
    setMacro1Term,
    macro1ColorId,
    setMacro1ColorId,
    macro1PredictedMatches,
    setMacro1PredictedMatches,
    isCountingMacro1Matches,
    setIsCountingMacro1Matches,
    macro2SpacingMode,
    setMacro2SpacingMode,
    saveTimerRef,
    fileInputRef,
    htmlEditorControlApiRef,
    currentFileIdRef,
    macro1CountRequestIdRef,
  };
};

export const useGhostWriterAppsState = () => {
  const [selectedRefBook, setSelectedRefBook] = useState<BookCode>("LO");
  const [refBookMode, setRefBookMode] = useState<"bee" | "simples">("bee");
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
  const [isRunningLexicalOverview, setIsRunningLexicalOverview] = useState(false);
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
  const [isRunningVerbetografiaOpenTableWord, setIsRunningVerbetografiaOpenTableWord] = useState(false);
  const [isRunningVerbeteDefinologia, setIsRunningVerbeteDefinologia] = useState(false);
  const [isRunningVerbeteFraseEnfatica, setIsRunningVerbeteFraseEnfatica] = useState(false);
  const [isRunningVerbeteSinonimologia, setIsRunningVerbeteSinonimologia] = useState(false);
  const [isRunningVerbeteFatologia, setIsRunningVerbeteFatologia] = useState(false);

  return {
    selectedRefBook,
    setSelectedRefBook,
    refBookMode,
    setRefBookMode,
    refBookPages,
    setRefBookPages,
    isRunningInsertRefBook,
    setIsRunningInsertRefBook,
    verbeteInput,
    setVerbeteInput,
    isRunningInsertRefVerbete,
    setIsRunningInsertRefVerbete,
    biblioGeralAuthor,
    setBiblioGeralAuthor,
    biblioGeralTitle,
    setBiblioGeralTitle,
    biblioGeralYear,
    setBiblioGeralYear,
    biblioGeralExtra,
    setBiblioGeralExtra,
    isRunningBiblioGeral,
    setIsRunningBiblioGeral,
    biblioExternaAuthor,
    setBiblioExternaAuthor,
    biblioExternaTitle,
    setBiblioExternaTitle,
    biblioExternaYear,
    setBiblioExternaYear,
    biblioExternaJournal,
    setBiblioExternaJournal,
    biblioExternaPublisher,
    setBiblioExternaPublisher,
    biblioExternaIdentifier,
    setBiblioExternaIdentifier,
    biblioExternaExtra,
    setBiblioExternaExtra,
    biblioExternaFreeText,
    setBiblioExternaFreeText,
    isRunningBiblioExterna,
    setIsRunningBiblioExterna,
    lexicalBooks,
    setLexicalBooks,
    selectedLexicalBook,
    setSelectedLexicalBook,
    lexicalTerm,
    setLexicalTerm,
    lexicalMaxResults,
    setLexicalMaxResults,
    isRunningLexicalSearch,
    setIsRunningLexicalSearch,
    isRunningLexicalOverview,
    setIsRunningLexicalOverview,
    semanticSearchQuery,
    setSemanticSearchQuery,
    semanticSearchMaxResults,
    setSemanticSearchMaxResults,
    semanticSearchIndexes,
    setSemanticSearchIndexes,
    selectedSemanticSearchIndexId,
    setSelectedSemanticSearchIndexId,
    isLoadingSemanticSearchIndexes,
    setIsLoadingSemanticSearchIndexes,
    isRunningSemanticSearch,
    setIsRunningSemanticSearch,
    verbeteSearchAuthor,
    setVerbeteSearchAuthor,
    verbeteSearchTitle,
    setVerbeteSearchTitle,
    verbeteSearchArea,
    setVerbeteSearchArea,
    verbeteSearchText,
    setVerbeteSearchText,
    verbeteSearchMaxResults,
    setVerbeteSearchMaxResults,
    isRunningVerbeteSearch,
    setIsRunningVerbeteSearch,
    verbetografiaTitle,
    setVerbetografiaTitle,
    verbetografiaSpecialty,
    setVerbetografiaSpecialty,
    isRunningVerbetografiaOpenTable,
    setIsRunningVerbetografiaOpenTable,
    isRunningVerbetografiaOpenTableWord,
    setIsRunningVerbetografiaOpenTableWord,
    isRunningVerbeteDefinologia,
    setIsRunningVerbeteDefinologia,
    isRunningVerbeteFraseEnfatica,
    setIsRunningVerbeteFraseEnfatica,
    isRunningVerbeteSinonimologia,
    setIsRunningVerbeteSinonimologia,
    isRunningVerbeteFatologia,
    setIsRunningVerbeteFatologia,
  };
};

export const useGhostWriterLlmState = (llmLogFontDefault: number) => {
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionText, setActionText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [translateLanguage, setTranslateLanguage] = useState<(typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"]>("Ingles");
  const [aiCommandQuery, setAiCommandQuery] = useState("");
  const [llmModel, setLlmModel] = useState(CHAT_MODEL);
  const [llmTemperature, setLlmTemperature] = useState(CHAT_TEMPERATURE);
  const [llmMaxOutputTokens, setLlmMaxOutputTokens] = useState<number>(CHAT_MAX_OUTPUT_TOKENS ?? 1000);
  const [llmMaxNumResults, setLlmMaxNumResults] = useState<number>(CHAT_MAX_NUM_RESULTS);
  const [llmEditorContextMaxChars, setLlmEditorContextMaxChars] = useState<number>(CHAT_EDITOR_CONTEXT_MAX_CHARS);
  const [llmVerbosity, setLlmVerbosity] = useState(CHAT_GPT5_VERBOSITY ?? "");
  const [llmEffort, setLlmEffort] = useState(CHAT_GPT5_EFFORT ?? "");
  const [llmSystemPrompt, setLlmSystemPrompt] = useState(CHAT_SYSTEM_PROMPT ?? "");
  const [aiActionsLlmModel, setAiActionsLlmModel] = useState(CHAT_MODEL);
  const [aiActionsLlmTemperature, setAiActionsLlmTemperature] = useState(CHAT_TEMPERATURE);
  const [aiActionsLlmMaxOutputTokens, setAiActionsLlmMaxOutputTokens] = useState<number>(CHAT_MAX_OUTPUT_TOKENS ?? 1000);
  const [aiActionsLlmVerbosity, setAiActionsLlmVerbosity] = useState(CHAT_GPT5_VERBOSITY ?? "");
  const [aiActionsLlmEffort, setAiActionsLlmEffort] = useState(CHAT_GPT5_EFFORT ?? "");
  const [aiActionsLlmSystemPrompt, setAiActionsLlmSystemPrompt] = useState(CHAT_SYSTEM_PROMPT ?? "");
  const [aiActionSystemPrompts, setAiActionSystemPrompts] = useState<Partial<Record<ActionSystemPromptId, string>>>({ ...DEFAULT_ACTION_SYSTEM_PROMPTS });
  const [aiActionsSelectedVectorStoreIds, setAiActionsSelectedVectorStoreIds] = useState<string[]>([]);
  const [aiActionsSelectedInputFileIds, setAiActionsSelectedInputFileIds] = useState<string[]>([]);
  const [isTermsConceptsConscienciografiaEnabled, setIsTermsConceptsConscienciografiaEnabled] = useState(false);
  const [biblioExternaLlmModel, setBiblioExternaLlmModel] = useState("gpt-5.4");
  const [biblioExternaLlmTemperature, setBiblioExternaLlmTemperature] = useState<number>(0);
  const [biblioExternaLlmMaxOutputTokens, setBiblioExternaLlmMaxOutputTokens] = useState<number>(1000);
  const [biblioExternaLlmVerbosity, setBiblioExternaLlmVerbosity] = useState("low");
  const [biblioExternaLlmEffort, setBiblioExternaLlmEffort] = useState("none");
  const [biblioExternaLlmSystemPrompt, setBiblioExternaLlmSystemPrompt] = useState(BIBLIO_EXTERNA_DEFAULT_SYSTEM_PROMPT);
  const [chatPreviousResponseId, setChatPreviousResponseId] = useState<string | null>(null);
  const [llmLogs, setLlmLogs] = useState<Array<{ id: string; at: string; request: unknown; response?: unknown; error?: string }>>([]);
  const [llmSessionLogs, setLlmSessionLogs] = useState<Array<{ id: string; at: string; request: unknown; response?: unknown; error?: string }>>([]);
  const [llmLogFontScale, setLlmLogFontScale] = useState(llmLogFontDefault);
  const [enableHistoryNumbering, setEnableHistoryNumbering] = useState(true);
  const [enableHistoryReferences, setEnableHistoryReferences] = useState(true);
  const [enableHistoryMetadata, setEnableHistoryMetadata] = useState(true);
  const [enableHistoryHighlight, setEnableHistoryHighlight] = useState(true);
  const [selectedBookSourceIds, setSelectedBookSourceIds] = useState<string[]>(() => (DEFAULT_BOOK_SOURCE_ID ? [DEFAULT_BOOK_SOURCE_ID] : []));
  const [uploadedChatFiles, setUploadedChatFiles] = useState<UploadedLlmFile[]>([]);
  const [isUploadingChatFiles, setIsUploadingChatFiles] = useState(false);
  const [includeEditorContextInLlm, setIncludeEditorContextInLlm] = useState(false);

  return {
    responses,
    setResponses,
    isLoading,
    setIsLoading,
    actionText,
    setActionText,
    chatHistory,
    setChatHistory,
    backendStatus,
    setBackendStatus,
    translateLanguage,
    setTranslateLanguage,
    aiCommandQuery,
    setAiCommandQuery,
    llmModel,
    setLlmModel,
    llmTemperature,
    setLlmTemperature,
    llmMaxOutputTokens,
    setLlmMaxOutputTokens,
    llmMaxNumResults,
    setLlmMaxNumResults,
    llmEditorContextMaxChars,
    setLlmEditorContextMaxChars,
    llmVerbosity,
    setLlmVerbosity,
    llmEffort,
    setLlmEffort,
    llmSystemPrompt,
    setLlmSystemPrompt,
    aiActionsLlmModel,
    setAiActionsLlmModel,
    aiActionsLlmTemperature,
    setAiActionsLlmTemperature,
    aiActionsLlmMaxOutputTokens,
    setAiActionsLlmMaxOutputTokens,
    aiActionsLlmVerbosity,
    setAiActionsLlmVerbosity,
    aiActionsLlmEffort,
    setAiActionsLlmEffort,
    aiActionsLlmSystemPrompt,
    setAiActionsLlmSystemPrompt,
    aiActionSystemPrompts,
    setAiActionSystemPrompts,
    aiActionsSelectedVectorStoreIds,
    setAiActionsSelectedVectorStoreIds,
    aiActionsSelectedInputFileIds,
    setAiActionsSelectedInputFileIds,
    isTermsConceptsConscienciografiaEnabled,
    setIsTermsConceptsConscienciografiaEnabled,
    biblioExternaLlmModel,
    setBiblioExternaLlmModel,
    biblioExternaLlmTemperature,
    setBiblioExternaLlmTemperature,
    biblioExternaLlmMaxOutputTokens,
    setBiblioExternaLlmMaxOutputTokens,
    biblioExternaLlmVerbosity,
    setBiblioExternaLlmVerbosity,
    biblioExternaLlmEffort,
    setBiblioExternaLlmEffort,
    biblioExternaLlmSystemPrompt,
    setBiblioExternaLlmSystemPrompt,
    chatPreviousResponseId,
    setChatPreviousResponseId,
    llmLogs,
    setLlmLogs,
    llmSessionLogs,
    setLlmSessionLogs,
    llmLogFontScale,
    setLlmLogFontScale,
    enableHistoryNumbering,
    setEnableHistoryNumbering,
    enableHistoryReferences,
    setEnableHistoryReferences,
    enableHistoryMetadata,
    setEnableHistoryMetadata,
    enableHistoryHighlight,
    setEnableHistoryHighlight,
    selectedBookSourceIds,
    setSelectedBookSourceIds,
    uploadedChatFiles,
    setUploadedChatFiles,
    isUploadingChatFiles,
    setIsUploadingChatFiles,
    includeEditorContextInLlm,
    setIncludeEditorContextInLlm,
  };
};
