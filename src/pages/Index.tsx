import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AlignLeft, BookOpen, FileText, Hash, Languages, ListOrdered, Loader2, PenLine, RefreshCw, Repeat2, Search, Settings, Sparkles, Type, Upload, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import LeftPanel from "@/features/ghost-writer/components/LeftPanel";
import RightPanel from "@/features/ghost-writer/components/RightPanel";
import HtmlEditor from "@/features/ghost-writer/components/HtmlEditor";
import InsertRefBookPanel from "@/features/ghost-writer/components/InsertRefBookPanel";
import InsertRefVerbetePanel from "@/features/ghost-writer/components/InsertRefVerbetePanel";
import BiblioGeralPanel from "@/features/ghost-writer/components/BiblioGeralPanel";
import BiblioExternaPanel from "@/features/ghost-writer/components/BiblioExternaPanel";
import BookSearchPanel from "@/features/ghost-writer/components/BookSearchPanel";
import SemanticSearchPanel from "@/features/ghost-writer/components/SemanticSearchPanel";
import VerbeteSearchPanel from "@/features/ghost-writer/components/VerbeteSearchPanel";
import VerbetografiaPanel from "@/features/ghost-writer/components/VerbetografiaPanel";
import Macro1HighlightPanel from "@/features/ghost-writer/components/Macro1HighlightPanel";
import Macro2ManualNumberingPanel from "@/features/ghost-writer/components/Macro2ManualNumberingPanel";
import AiActionParametersPanel from "@/features/ghost-writer/components/AiActionParametersPanel";
import SourcesPanel from "@/features/ghost-writer/components/SourcesPanel";
import MobilePanelHeader from "@/features/ghost-writer/components/MobilePanelHeader";
import AiAssistantConfigPanel from "@/features/ghost-writer/components/AiAssistantConfigPanel";
import ApplicationsLinksPanel from "@/features/ghost-writer/components/ApplicationsLinksPanel";
import LlmLogsPanel from "@/features/ghost-writer/components/LlmLogsPanel";
import ParameterPanel from "@/features/ghost-writer/components/ParameterPanel";
import ParameterPanelContent from "@/features/ghost-writer/components/ParameterPanelContent";
import DesktopResizeHandle from "@/features/ghost-writer/components/DesktopResizeHandle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTextStats } from "@/hooks/useTextStats";
import {
  healthCheck,
} from "@/lib/backend-api";
import { HtmlEditorControlApi } from "@/lib/html-editor-control";
import { buttonsPrimaryBgClass, cardsBgClass, panelsBgClass, panelsTopMenuBarBgClass, uploadDocBgClass } from "@/styles/backgroundColors";
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
  buildSynonymsPrompt,
  buildEpigraphPrompt,
  buildRewritePrompt,
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildAiCommandPrompt,
  buildChatPrompt,
  uploadLlmSourceFiles,
  type UploadedLlmFile,
} from "@/lib/openai";
import { sectionActionButtonClass } from "@/styles/buttonStyles";
import type { BookCode } from "@/lib/bookCatalog";
import type { AIResponse, AiActionId, AiPanelScope, AppActionId, AppPanelScope, BackendStatus, Macro2SpacingMode, MacroActionId, MobilePanelId, ParameterPanelHeaderMeta, ParameterPanelSection, ParameterPanelTarget, SelectOption, SemanticIndexOption, SourcesPanelView } from "@/features/ghost-writer/types";
import { ACTION_PANEL_BUTTONS_BY_SCOPE, ACTION_PANEL_ICONS, APP_PANEL_BUTTONS_BY_SCOPE, APP_PANEL_ICONS, getAiPanelScopeByAction, getParameterPanelHeaderMeta, normalizeIdList, parameterActionMeta, parameterAppMeta, parameterMacroMeta } from "@/features/ghost-writer/config/metadata";
import { AI_ACTIONS_LLM_SETTINGS_STORAGE_KEY, BIBLIO_EXTERNA_LLM_SETTINGS_STORAGE_KEY, CHAT_EDITOR_CONTEXT_MAX_CHARS, DEFAULT_BOOK_SEARCH_MAX_RESULTS, DEFAULT_LOG_FONT_SIZE_PX, DESKTOP_CONTENT_EDGE_GUTTER_PX, DESKTOP_PANEL_SIZES_PX, GENERAL_SETTINGS_STORAGE_KEY, LLM_LOG_FONT_MAX, LLM_LOG_FONT_MIN, LLM_LOG_FONT_STEP, LLM_SETTINGS_STORAGE_KEY, NO_VECTOR_STORE_ID } from "@/features/ghost-writer/config/constants";
import { BOOK_SOURCE, DEFAULT_BOOK_SOURCE_ID, MACRO1_HIGHLIGHT_COLORS, TRANSLATE_LANGUAGE_OPTIONS, VECTOR_STORES_SOURCE } from "@/features/ghost-writer/config/options";
import useGhostWriterLayout from "@/features/ghost-writer/hooks/useGhostWriterLayout";
import useGhostWriterDocument from "@/features/ghost-writer/hooks/useGhostWriterDocument";
import useGhostWriterApps from "@/features/ghost-writer/hooks/useGhostWriterApps";
import useGhostWriterLlm from "@/features/ghost-writer/hooks/useGhostWriterLlm";
import useGhostWriterLlmLogs from "@/features/ghost-writer/hooks/useGhostWriterLlmLogs";
import { useGhostWriterAppsState, useGhostWriterDocumentState, useGhostWriterLlmState } from "@/features/ghost-writer/hooks/useGhostWriterDocumentState";
import useGhostWriterFeedback from "@/features/ghost-writer/hooks/useGhostWriterFeedback";
import { clampToMin, getDesktopMinimumContentWidthPx, getRightPanelWidthPx, type DesktopFixedPanelWidthsPx, type DesktopResizablePanelKey } from "@/features/ghost-writer/utils/desktopLayoutPx";
const sidePanelClass = panelsBgClass;

const Index = () => {
  const layoutContainerRef = useRef<HTMLDivElement | null>(null);
  const LLM_LOG_FONT_DEFAULT = Number((DEFAULT_LOG_FONT_SIZE_PX / 11).toFixed(2));
  const [desktopContainerWidthPx, setDesktopContainerWidthPx] = useState<number | null>(null);
  const [desktopFixedPanelWidthsPx, setDesktopFixedPanelWidthsPx] = useState<DesktopFixedPanelWidthsPx>({
    left: DESKTOP_PANEL_SIZES_PX.left.default,
    parameter: DESKTOP_PANEL_SIZES_PX.parameter.default,
    editor: DESKTOP_PANEL_SIZES_PX.editor.default,
    json: DESKTOP_PANEL_SIZES_PX.json.default,
  });
  const documentState = useGhostWriterDocumentState();
  const {
    documentText, setDocumentText, currentFileName, setCurrentFileName, currentFileConvertedFromPdf, setCurrentFileConvertedFromPdf, documentPageCount, setDocumentPageCount,
    documentParagraphCount, setDocumentParagraphCount, documentWordCount, setDocumentWordCount, documentSymbolCount, setDocumentSymbolCount, documentSymbolWithSpacesCount,
    setDocumentSymbolWithSpacesCount, currentFileId, setCurrentFileId, statsKey, setStatsKey, openedDocumentVersion, setOpenedDocumentVersion, editorContentHtml, setEditorContentHtml,
    isOpeningDocument, setIsOpeningDocument, htmlEditorControlApi, setHtmlEditorControlApi, isExportingDocx, setIsExportingDocx, isImportingDocument, setIsImportingDocument,
    selectedImportFileName, setSelectedImportFileName, macro1Term, setMacro1Term, macro1ColorId, setMacro1ColorId, macro1PredictedMatches, setMacro1PredictedMatches,
    isCountingMacro1Matches, setIsCountingMacro1Matches, macro2SpacingMode, setMacro2SpacingMode, saveTimerRef, fileInputRef, htmlEditorControlApiRef, currentFileIdRef, macro1CountRequestIdRef,
  } = documentState;
  const appState = useGhostWriterAppsState();
  const {
    selectedRefBook, setSelectedRefBook, refBookMode, setRefBookMode, refBookPages, setRefBookPages, isRunningInsertRefBook, setIsRunningInsertRefBook, verbeteInput, setVerbeteInput,
    isRunningInsertRefVerbete, setIsRunningInsertRefVerbete, biblioGeralAuthor, setBiblioGeralAuthor, biblioGeralTitle, setBiblioGeralTitle, biblioGeralYear, setBiblioGeralYear,
    biblioGeralExtra, setBiblioGeralExtra, isRunningBiblioGeral, setIsRunningBiblioGeral, biblioExternaAuthor, setBiblioExternaAuthor, biblioExternaTitle, setBiblioExternaTitle,
    biblioExternaYear, setBiblioExternaYear, biblioExternaJournal, setBiblioExternaJournal, biblioExternaPublisher, setBiblioExternaPublisher, biblioExternaIdentifier,
    setBiblioExternaIdentifier, biblioExternaExtra, setBiblioExternaExtra, biblioExternaFreeText, setBiblioExternaFreeText, isRunningBiblioExterna, setIsRunningBiblioExterna,
    lexicalBooks, setLexicalBooks, selectedLexicalBook, setSelectedLexicalBook, lexicalTerm, setLexicalTerm, lexicalMaxResults, setLexicalMaxResults, isRunningLexicalSearch,
    setIsRunningLexicalSearch, isRunningLexicalOverview, setIsRunningLexicalOverview, semanticSearchQuery, setSemanticSearchQuery, semanticSearchMaxResults, setSemanticSearchMaxResults, semanticSearchIndexes, setSemanticSearchIndexes,
    selectedSemanticSearchIndexId, setSelectedSemanticSearchIndexId, isLoadingSemanticSearchIndexes, setIsLoadingSemanticSearchIndexes, isRunningSemanticSearch, setIsRunningSemanticSearch,
    verbeteSearchAuthor, setVerbeteSearchAuthor, verbeteSearchTitle, setVerbeteSearchTitle, verbeteSearchArea, setVerbeteSearchArea, verbeteSearchText, setVerbeteSearchText,
    verbeteSearchMaxResults, setVerbeteSearchMaxResults, isRunningVerbeteSearch, setIsRunningVerbeteSearch, verbetografiaTitle, setVerbetografiaTitle,
    verbetografiaSpecialty, setVerbetografiaSpecialty, isRunningVerbetografiaOpenTable, setIsRunningVerbetografiaOpenTable, isRunningVerbetografiaOpenTableWord, setIsRunningVerbetografiaOpenTableWord, isRunningVerbeteDefinologia, setIsRunningVerbeteDefinologia,
    isRunningVerbeteFraseEnfatica, setIsRunningVerbeteFraseEnfatica, isRunningVerbeteSinonimologia, setIsRunningVerbeteSinonimologia, isRunningVerbeteFatologia, setIsRunningVerbeteFatologia,
  } = appState;
  const llmState = useGhostWriterLlmState(LLM_LOG_FONT_DEFAULT);
  const {
    responses, setResponses, isLoading, setIsLoading, actionText, setActionText, chatHistory, setChatHistory, backendStatus, setBackendStatus, translateLanguage, setTranslateLanguage,
    aiCommandQuery, setAiCommandQuery, llmModel, setLlmModel, llmTemperature, setLlmTemperature, llmMaxOutputTokens, setLlmMaxOutputTokens, llmMaxNumResults, setLlmMaxNumResults,
    llmEditorContextMaxChars, setLlmEditorContextMaxChars, llmVerbosity, setLlmVerbosity, llmEffort, setLlmEffort, llmSystemPrompt, setLlmSystemPrompt, aiActionsLlmModel,
    setAiActionsLlmModel, aiActionsLlmTemperature, setAiActionsLlmTemperature, aiActionsLlmMaxOutputTokens, setAiActionsLlmMaxOutputTokens, aiActionsLlmVerbosity, setAiActionsLlmVerbosity,
    aiActionsLlmEffort, setAiActionsLlmEffort, aiActionsLlmSystemPrompt, setAiActionsLlmSystemPrompt, aiActionSystemPrompts, setAiActionSystemPrompts, aiActionsSelectedVectorStoreIds, setAiActionsSelectedVectorStoreIds,
    aiActionsSelectedInputFileIds, setAiActionsSelectedInputFileIds, isTermsConceptsConscienciografiaEnabled, setIsTermsConceptsConscienciografiaEnabled, biblioExternaLlmModel, setBiblioExternaLlmModel, biblioExternaLlmTemperature, setBiblioExternaLlmTemperature,
    biblioExternaLlmMaxOutputTokens, setBiblioExternaLlmMaxOutputTokens, biblioExternaLlmVerbosity, setBiblioExternaLlmVerbosity, biblioExternaLlmEffort, setBiblioExternaLlmEffort,
    biblioExternaLlmSystemPrompt, setBiblioExternaLlmSystemPrompt, chatPreviousResponseId, setChatPreviousResponseId, llmLogs, setLlmLogs, llmSessionLogs, setLlmSessionLogs,
    llmLogFontScale, setLlmLogFontScale, enableHistoryNumbering, setEnableHistoryNumbering, enableHistoryReferences, setEnableHistoryReferences, enableHistoryMetadata, setEnableHistoryMetadata, enableHistoryHighlight, setEnableHistoryHighlight, selectedBookSourceIds, setSelectedBookSourceIds,
    uploadedChatFiles, setUploadedChatFiles, isUploadingChatFiles, setIsUploadingChatFiles, includeEditorContextInLlm, setIncludeEditorContextInLlm,
  } = llmState;
  const { historyNotice, showHistoryNotice, toast } = useGhostWriterFeedback();
  const [isAiCommandSelectionPending, setIsAiCommandSelectionPending] = useState(false);
  const hasEditorPanel = Boolean(currentFileId) || isOpeningDocument;
  const {
    parameterPanelTarget,
    setParameterPanelTarget,
    appPanelScope,
    setAppPanelScope,
    activeLlmConfigPanel,
    setActiveLlmConfigPanel,
    isJsonLogPanelOpen,
    setIsJsonLogPanelOpen,
    isMobileView,
    activeMobilePanel,
    setActiveMobilePanel,
    sourcesPanelView,
    setSourcesPanelView,
    isChatConfigOpen,
    isAiActionsConfigOpen,
    isBiblioExternaConfigOpen,
    hasCenterPanel,
    hasJsonPanel,
    mobilePanelOptions,
    showJsonPanel,
    showLeftPanel,
    showCenterPanel,
    showRightPanel,
    showEditorPanel,
    toggleLlmConfigPanel,
  } = useGhostWriterLayout({ hasEditorPanel });
  const {
    handleDocumentPanelDrop,
    handleDocumentPanelFile,
    handleCreateBlankDocument,
    handleRefreshStats,
    handleRetrieveSelectedText,
    handleImportSelectedTextToActions,
    handleSelectAllContent,
    handleTriggerSave,
    getEditorApi,
    handleAppendHistoryToEditor,
    handleRunMacro2ManualNumbering,
    handleEditorControlApiReady,
    handleRunMacro1Highlight,
    handleClearMacro1Highlight,
    handleEditorContentChange,
    handleExportDocx,
    handleCloseEditorWithPrompt,
  } = useGhostWriterDocument({
    ...documentState,
    setActionText,
    setIsLoading,
    setParameterPanelTarget,
    responses,
    toast,
  });

  const stats = useTextStats(
    documentText || actionText,
    statsKey,
    documentPageCount,
    documentParagraphCount,
    documentWordCount,
    documentSymbolCount,
    documentSymbolWithSpacesCount,
  );
  const {
    aiActionsLlmConfigRef,
    openAiReady,
    backendNotReadyMessage,
    handleToggleChatSourcesPanel,
    aiActionVectorStoreOptions,
    selectedChatSourceLabel,
    addResponse,
    executeLLMWithLog,
    executeAiActionsLLMWithLog,
    handleCleanLlmConversation,
    handleUploadSourceFiles,
    handleRemoveUploadedChatFile,
    handleAction,
    handleOpenAiActionParameters: baseHandleOpenAiActionParameters,
    handleOpenAiCommandPanel: baseHandleOpenAiCommandPanel,
    handleChat,
  } = useGhostWriterLlm({
    ...llmState,
    documentText,
    currentFileId,
    setParameterPanelTarget,
    setActiveLlmConfigPanel,
    setAppPanelScope,
    setSourcesPanelView,
    isMobileView,
    setActiveMobilePanel,
    getEditorApi,
    toast,
  });
  const {
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
    handleRunVerbeteSearch,
    handleRunRandomPensata,
  } = useGhostWriterApps({
    ...appState,
    actionText,
    setActionText,
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
    setLlmLogs,
    setLlmSessionLogs,
    setAppPanelScope,
    setParameterPanelTarget,
    aiActionsLlmConfigRef,
    uploadedChatFiles,
    getEditorApi,
    backendNotReadyMessage,
    executeAiActionsLLMWithLog,
    executeLLMWithLog,
    addResponse,
    toast,
  });

  const handleOpenVerbetografiaTableWithPrompt = useCallback(async () => {
    if (currentFileId) {
      const shouldDownloadCurrentEditorText = window.confirm(
        "Deseja baixar o texto atual do editor HTML antes de abrir a tabela? O conteúdo atual será substituído.",
      );
      if (shouldDownloadCurrentEditorText) {
        await handleExportDocx();
      }
    }
    await handleOpenVerbetografiaTable();
  }, [currentFileId, handleExportDocx, handleOpenVerbetografiaTable]);

  const focusMobilePanel = useCallback((panel: MobilePanelId) => {
    if (!isMobileView) return;
    setActiveMobilePanel(panel);
  }, [isMobileView, setActiveMobilePanel]);

  const handleOpenParameterSection = useCallback((section: ParameterPanelSection) => {
    setIsAiCommandSelectionPending(false);
    setAppPanelScope(section === "apps" ? "bibliografia" : null);
    if (section === "sources") setSourcesPanelView("books");
    else setSourcesPanelView(null);
    setParameterPanelTarget({ section, id: null });
    focusMobilePanel("center");
  }, [focusMobilePanel, setAppPanelScope, setParameterPanelTarget, setSourcesPanelView]);

  const handleOpenAiActionParameters = useCallback((type: AiActionId) => {
    setIsAiCommandSelectionPending(false);
    baseHandleOpenAiActionParameters(type);
    focusMobilePanel("center");
  }, [baseHandleOpenAiActionParameters, focusMobilePanel]);

  const handleOpenAiCommandPanel = useCallback(() => {
    setIsAiCommandSelectionPending(true);
    baseHandleOpenAiCommandPanel();
    focusMobilePanel("center");
  }, [baseHandleOpenAiCommandPanel, focusMobilePanel]);

  const handleToggleBookSource = useCallback((id: string, checked: boolean) => {
    setSelectedBookSourceIds((prev) => {
      if (checked) {
        if (id === NO_VECTOR_STORE_ID) return [NO_VECTOR_STORE_ID];
        return normalizeIdList([...prev.filter((value) => value !== NO_VECTOR_STORE_ID), id]);
      }

      return prev.filter((value) => value !== id);
    });
  }, [setSelectedBookSourceIds]);

  const handleToggleTermsConceptsConscienciografia = useCallback(() => {
    setIsTermsConceptsConscienciografiaEnabled((prev) => {
      const next = !prev;
      const wvBooksId = VECTOR_STORES_SOURCE.find((item) => item.label === "WVBooks")?.id ?? "";
      setAiActionsSelectedVectorStoreIds(next ? (wvBooksId ? [wvBooksId] : []) : [NO_VECTOR_STORE_ID]);
      return next;
    });
  }, [setAiActionsSelectedVectorStoreIds, setIsTermsConceptsConscienciografiaEnabled]);

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
    focusMobilePanel("center");
  }, [actionText, focusMobilePanel, macro1Term, setMacro1Term, setParameterPanelTarget]);

  const isHistoryProcessing =
    isLoading || isRunningInsertRefBook || isRunningInsertRefVerbete || isRunningBiblioGeral || isRunningBiblioExterna || isRunningLexicalSearch || isRunningLexicalOverview || isRunningSemanticSearch || isRunningVerbeteSearch || isRunningVerbetografiaOpenTable || isRunningVerbetografiaOpenTableWord || isRunningVerbeteDefinologia || isRunningVerbeteFraseEnfatica || isRunningVerbeteSinonimologia || isRunningVerbeteFatologia;
  const parameterPanelHeaderMeta = parameterPanelTarget
    ? getParameterPanelHeaderMeta(parameterPanelTarget, appPanelScope)
    : null;
  const hasVerbetografiaRequiredFields = Boolean(verbetografiaTitle.trim());
  const lastHistoryResponseIdRef = useRef<string | null>(null);

  useEffect(() => {
    const element = layoutContainerRef.current;
    if (!element) return;

    const updateWidth = () => {
      const nextWidth = Math.max(1, Math.round(element.clientWidth));
      setDesktopContainerWidthPx(nextWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const latestResponseId = responses[0]?.id ?? null;
    if (!latestResponseId) {
      lastHistoryResponseIdRef.current = null;
      return;
    }
    if (latestResponseId !== lastHistoryResponseIdRef.current) {
      lastHistoryResponseIdRef.current = latestResponseId;
      focusMobilePanel("right");
    }
  }, [focusMobilePanel, responses]);

  const resizeDesktopFixedPanel = useCallback((panel: DesktopResizablePanelKey, deltaPx: number) => {
    setDesktopFixedPanelWidthsPx((prev) => ({
      ...prev,
      [panel]: clampToMin(prev[panel] + deltaPx, DESKTOP_PANEL_SIZES_PX[panel].min),
    }));
  }, []);

  const desktopRightWidthPx = useMemo(() => {
    if (desktopContainerWidthPx === null) return DESKTOP_PANEL_SIZES_PX.right.min;

    return getRightPanelWidthPx({
      containerWidthPx: desktopContainerWidthPx,
      leftWidthPx: desktopFixedPanelWidthsPx.left,
      parameterWidthPx: desktopFixedPanelWidthsPx.parameter,
      editorWidthPx: desktopFixedPanelWidthsPx.editor,
      jsonWidthPx: desktopFixedPanelWidthsPx.json,
      hasCenterPanel,
      hasEditorPanel,
      hasJsonPanel,
      rightMinPx: DESKTOP_PANEL_SIZES_PX.right.min,
    });
  }, [desktopContainerWidthPx, desktopFixedPanelWidthsPx, hasCenterPanel, hasEditorPanel, hasJsonPanel]);

  const desktopMinimumContentWidthPx = useMemo(() => getDesktopMinimumContentWidthPx({
    leftWidthPx: desktopFixedPanelWidthsPx.left,
    parameterWidthPx: desktopFixedPanelWidthsPx.parameter,
    editorWidthPx: desktopFixedPanelWidthsPx.editor,
    jsonWidthPx: desktopFixedPanelWidthsPx.json,
    hasCenterPanel,
    hasEditorPanel,
    hasJsonPanel,
    rightMinPx: DESKTOP_PANEL_SIZES_PX.right.min,
  }), [desktopFixedPanelWidthsPx, hasCenterPanel, hasEditorPanel, hasJsonPanel]);
  const {
    llmLogFontStyle,
    latestLlmMeta,
    latestInputTokens,
    latestCachedInputTokens,
    latestOutputTokens,
    latestTotalTokens,
    latestReasoningTokens,
    latestRagReferences,
    latestRagReferencesAllCalls,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    reasoningTokens,
    successfulCallsCount,
    errorCallsCount,
    effectiveModel,
    estimatedUsd,
    estimatedBrl,
    latestEstimatedUsd,
    latestEstimatedBrl,
  } = useGhostWriterLlmLogs({
    llmLogs,
    llmSessionLogs,
    llmModel,
    llmLogFontScale,
  });

  const leftPanelElement = (
    <LeftPanel
      onOpenParameterSection={handleOpenParameterSection}
      onOpenVerbetografiaTable={() => {
        handleOpenVerbetografiaTableFromLeft();
        focusMobilePanel("center");
      }}
      onOpenBookSearch={() => {
        handleOpenBookSearchFromLeft();
        focusMobilePanel("center");
      }}
      onOpenSemanticSearch={() => {
        handleOpenSemanticSearchFromLeft();
        focusMobilePanel("center");
      }}
      onOpenVerbetografia={() => {
        handleOpenVerbetografiaFromLeft();
        focusMobilePanel("center");
      }}
      onToggleJsonPanel={() => {
        setIsJsonLogPanelOpen((prev) => !prev);
        focusMobilePanel("json");
      }}
      isJsonPanelOpen={isJsonLogPanelOpen}
      isLoading={isLoading}
    />
  );

  const parameterPanelElement = parameterPanelTarget ? (
    <ParameterPanel
      title={parameterPanelHeaderMeta?.title ?? "Parameters"}
      description={parameterPanelHeaderMeta?.description}
      onClose={() => setParameterPanelTarget(null)}
    >
      <ParameterPanelContent
        parameterPanelTarget={parameterPanelTarget}
        appPanelScope={appPanelScope}
        isAiCommandSelectionPending={isAiCommandSelectionPending}
        isLoading={isLoading}
        isAiActionsConfigOpen={isAiActionsConfigOpen}
        isTermsConceptsConscienciografiaEnabled={isTermsConceptsConscienciografiaEnabled}
        isUploadingChatFiles={isUploadingChatFiles}
        currentFileId={currentFileId}
        selectedImportFileName={selectedImportFileName}
        fileInputRef={fileInputRef}
        stats={stats}
        isOpeningDocument={isOpeningDocument}
        isImportingDocument={isImportingDocument}
        macro1Term={macro1Term}
        macro1ColorId={macro1ColorId}
        macro1PredictedMatches={macro1PredictedMatches}
        isCountingMacro1Matches={isCountingMacro1Matches}
        macro2SpacingMode={macro2SpacingMode}
        selectedBookSourceIds={selectedBookSourceIds}
        selectedChatSourceLabel={selectedChatSourceLabel}
        uploadedChatFiles={uploadedChatFiles}
        llmModel={llmModel}
        llmTemperature={llmTemperature}
        llmMaxOutputTokens={llmMaxOutputTokens}
        llmMaxNumResults={llmMaxNumResults}
        llmEditorContextMaxChars={llmEditorContextMaxChars}
        llmVerbosity={llmVerbosity}
        llmEffort={llmEffort}
        llmSystemPrompt={llmSystemPrompt}
        actionText={actionText}
        aiCommandQuery={aiCommandQuery}
        translateLanguage={translateLanguage}
        aiActionsLlmModel={aiActionsLlmModel}
        aiActionsLlmTemperature={aiActionsLlmTemperature}
        aiActionsLlmMaxOutputTokens={aiActionsLlmMaxOutputTokens}
        aiActionsLlmVerbosity={aiActionsLlmVerbosity}
        aiActionsLlmEffort={aiActionsLlmEffort}
        aiActionSystemPrompts={aiActionSystemPrompts}
        aiActionsSelectedVectorStoreIds={aiActionsSelectedVectorStoreIds}
        aiActionVectorStoreOptions={aiActionVectorStoreOptions}
        selectedRefBook={selectedRefBook}
        refBookMode={refBookMode}
        refBookPages={refBookPages}
        isRunningInsertRefBook={isRunningInsertRefBook}
        verbeteInput={verbeteInput}
        isRunningInsertRefVerbete={isRunningInsertRefVerbete}
        biblioGeralAuthor={biblioGeralAuthor}
        biblioGeralTitle={biblioGeralTitle}
        biblioGeralYear={biblioGeralYear}
        biblioGeralExtra={biblioGeralExtra}
        isRunningBiblioGeral={isRunningBiblioGeral}
        biblioExternaAuthor={biblioExternaAuthor}
        biblioExternaTitle={biblioExternaTitle}
        biblioExternaYear={biblioExternaYear}
        biblioExternaJournal={biblioExternaJournal}
        biblioExternaPublisher={biblioExternaPublisher}
        biblioExternaIdentifier={biblioExternaIdentifier}
        biblioExternaExtra={biblioExternaExtra}
        biblioExternaFreeText={biblioExternaFreeText}
        isRunningBiblioExterna={isRunningBiblioExterna}
        isBiblioExternaConfigOpen={isBiblioExternaConfigOpen}
        biblioExternaLlmModel={biblioExternaLlmModel}
        biblioExternaLlmTemperature={biblioExternaLlmTemperature}
        biblioExternaLlmMaxOutputTokens={biblioExternaLlmMaxOutputTokens}
        biblioExternaLlmVerbosity={biblioExternaLlmVerbosity}
        biblioExternaLlmEffort={biblioExternaLlmEffort}
        biblioExternaLlmSystemPrompt={biblioExternaLlmSystemPrompt}
        lexicalBooks={lexicalBooks}
        selectedLexicalBook={selectedLexicalBook}
        lexicalTerm={lexicalTerm}
        lexicalMaxResults={lexicalMaxResults}
        isRunningLexicalSearch={isRunningLexicalSearch}
        isRunningLexicalOverview={isRunningLexicalOverview}
        selectedSemanticSearchIndexId={selectedSemanticSearchIndexId}
        semanticSearchIndexes={semanticSearchIndexes}
        isLoadingSemanticSearchIndexes={isLoadingSemanticSearchIndexes}
        semanticSearchQuery={semanticSearchQuery}
        semanticSearchMaxResults={semanticSearchMaxResults}
        isRunningSemanticSearch={isRunningSemanticSearch}
        verbeteSearchAuthor={verbeteSearchAuthor}
        verbeteSearchTitle={verbeteSearchTitle}
        verbeteSearchArea={verbeteSearchArea}
        verbeteSearchText={verbeteSearchText}
        verbeteSearchMaxResults={verbeteSearchMaxResults}
        isRunningVerbeteSearch={isRunningVerbeteSearch}
        verbetografiaTitle={verbetografiaTitle}
        verbetografiaSpecialty={verbetografiaSpecialty}
        includeEditorContextInLlm={includeEditorContextInLlm}
        isRunningVerbetografiaOpenTable={isRunningVerbetografiaOpenTable}
        isRunningVerbetografiaOpenTableWord={isRunningVerbetografiaOpenTableWord}
        isRunningVerbeteDefinologia={isRunningVerbeteDefinologia}
        isRunningVerbeteFraseEnfatica={isRunningVerbeteFraseEnfatica}
        isRunningVerbeteSinonimologia={isRunningVerbeteSinonimologia}
        isRunningVerbeteFatologia={isRunningVerbeteFatologia}
        hasVerbetografiaRequiredFields={hasVerbetografiaRequiredFields}
        onToggleAiActionsConfig={() => toggleLlmConfigPanel("ai_actions")}
        onToggleTermsConceptsConscienciografia={handleToggleTermsConceptsConscienciografia}
        onCreateBlankDocument={handleCreateBlankDocument}
        onDocumentPanelFile={handleDocumentPanelFile}
        onDocumentPanelDrop={handleDocumentPanelDrop}
        onClearSelectedImportFileName={() => setSelectedImportFileName("")}
        onRefreshStats={handleRefreshStats}
        onOpenMacro={handleActionMacros}
        onMacro1TermChange={setMacro1Term}
        onMacro1ColorChange={setMacro1ColorId}
        onRunMacro1Highlight={handleRunMacro1Highlight}
        onClearMacro1Highlight={handleClearMacro1Highlight}
        onMacro2SpacingModeChange={setMacro2SpacingMode}
        onRunMacro2ManualNumbering={handleRunMacro2ManualNumbering}
        onToggleBookSource={handleToggleBookSource}
        onRemoveUploadedChatFile={handleRemoveUploadedChatFile}
        onLlmModelChange={setLlmModel}
        onLlmTemperatureChange={setLlmTemperature}
        onLlmMaxOutputTokensChange={setLlmMaxOutputTokens}
        onLlmMaxNumResultsChange={setLlmMaxNumResults}
        onLlmEditorContextMaxCharsChange={setLlmEditorContextMaxChars}
        onLlmVerbosityChange={setLlmVerbosity}
        onLlmEffortChange={setLlmEffort}
        onLlmSystemPromptChange={setLlmSystemPrompt}
        onRunRandomPensata={handleRunRandomPensata}
        onOpenAiActionParameters={handleOpenAiActionParameters}
        onActionTextChange={setActionText}
        onAiCommandQueryChange={setAiCommandQuery}
        onTranslateLanguageChange={setTranslateLanguage}
        onRetrieveSelectedText={handleRetrieveSelectedText}
        onApplyAction={handleAction}
        onAiActionsLlmModelChange={setAiActionsLlmModel}
        onAiActionsLlmTemperatureChange={setAiActionsLlmTemperature}
        onAiActionsLlmMaxOutputTokensChange={setAiActionsLlmMaxOutputTokens}
        onAiActionsLlmVerbosityChange={setAiActionsLlmVerbosity}
        onAiActionsLlmEffortChange={setAiActionsLlmEffort}
        onAiActionSystemPromptChange={(actionId, value) => {
          setAiActionSystemPrompts((prev) => ({ ...prev, [actionId]: value }));
        }}
        onToggleIncludeEditorContextInLlm={() => {
          if (!currentFileId) return;
          setIncludeEditorContextInLlm((prev) => !prev);
        }}
        onAiActionsSelectedVectorStoreIdsChange={(value) => {
          if (parameterPanelTarget?.section === "actions") {
            const wvBooksId = VECTOR_STORES_SOURCE.find((item) => item.label === "WVBooks")?.id ?? "";
            if (isTermsConceptsConscienciografiaEnabled) {
              setAiActionsSelectedVectorStoreIds(wvBooksId ? [wvBooksId] : []);
              return;
            }
            setAiActionsSelectedVectorStoreIds([NO_VECTOR_STORE_ID]);
            return;
          }
          setAiActionsSelectedVectorStoreIds(value);
        }}
        onUploadSourceFiles={handleUploadSourceFiles}
        onSelectRefBook={handleSelectRefBook}
        onRefBookModeChange={setRefBookMode}
        onRefBookPagesChange={setRefBookPages}
        onRunInsertRefBook={handleRunInsertRefBook}
        onVerbeteInputChange={setVerbeteInput}
        onRunInsertRefVerbete={handleRunInsertRefVerbete}
        onBiblioGeralAuthorChange={setBiblioGeralAuthor}
        onBiblioGeralTitleChange={setBiblioGeralTitle}
        onBiblioGeralYearChange={setBiblioGeralYear}
        onBiblioGeralExtraChange={setBiblioGeralExtra}
        onRunBiblioGeral={handleRunBiblioGeral}
        onBiblioExternaAuthorChange={setBiblioExternaAuthor}
        onBiblioExternaTitleChange={setBiblioExternaTitle}
        onBiblioExternaYearChange={setBiblioExternaYear}
        onBiblioExternaJournalChange={setBiblioExternaJournal}
        onBiblioExternaPublisherChange={setBiblioExternaPublisher}
        onBiblioExternaIdentifierChange={setBiblioExternaIdentifier}
        onBiblioExternaExtraChange={setBiblioExternaExtra}
        onBiblioExternaFreeTextChange={setBiblioExternaFreeText}
        onRunBiblioExterna={handleRunBiblioExterna}
        onToggleBiblioExternaConfig={() => toggleLlmConfigPanel("biblio_externa")}
        onBiblioExternaLlmModelChange={setBiblioExternaLlmModel}
        onBiblioExternaLlmTemperatureChange={setBiblioExternaLlmTemperature}
        onBiblioExternaLlmMaxOutputTokensChange={setBiblioExternaLlmMaxOutputTokens}
        onBiblioExternaLlmVerbosityChange={setBiblioExternaLlmVerbosity}
        onBiblioExternaLlmEffortChange={setBiblioExternaLlmEffort}
        onBiblioExternaLlmSystemPromptChange={setBiblioExternaLlmSystemPrompt}
        onSelectedLexicalBookChange={setSelectedLexicalBook}
        onLexicalTermChange={setLexicalTerm}
        onLexicalMaxResultsChange={setLexicalMaxResults}
        onRunLexicalSearch={handleRunLexicalSearch}
        onRunLexicalOverview={handleRunLexicalOverview}
        onSelectedSemanticSearchIndexIdChange={setSelectedSemanticSearchIndexId}
        onSemanticSearchQueryChange={setSemanticSearchQuery}
        onSemanticSearchMaxResultsChange={setSemanticSearchMaxResults}
        onRunSemanticSearch={handleRunSemanticSearch}
        onVerbeteSearchAuthorChange={setVerbeteSearchAuthor}
        onVerbeteSearchTitleChange={setVerbeteSearchTitle}
        onVerbeteSearchAreaChange={setVerbeteSearchArea}
        onVerbeteSearchTextChange={setVerbeteSearchText}
        onVerbeteSearchMaxResultsChange={setVerbeteSearchMaxResults}
        onRunVerbeteSearch={handleRunVerbeteSearch}
        onRunVerbetografiaOpenTable={handleOpenVerbetografiaTableWithPrompt}
        onRunVerbetografiaOpenTableWord={handleOpenVerbetografiaTableWord}
        onRunVerbeteDefinologia={handleRunVerbeteDefinologia}
        onRunVerbeteFraseEnfatica={handleRunVerbeteFraseEnfatica}
        onRunVerbeteSinonimologia={handleRunVerbeteSinonimologia}
        onRunVerbeteFatologia={handleRunVerbeteFatologia}
        onSelectVerbetografiaAction={handleSelectVerbetografiaAction}
        onRunAppAction={handleActionApps}
        onVerbetografiaTitleChange={setVerbetografiaTitle}
        onVerbetografiaSpecialtyChange={setVerbetografiaSpecialty}
      />
    </ParameterPanel>
  ) : null;

  const rightPanelElement = (
    <RightPanel
      responses={responses}
      enableHistoryNumbering={enableHistoryNumbering}
      enableHistoryReferences={enableHistoryReferences}
      enableHistoryMetadata={enableHistoryMetadata}
      enableHistoryHighlight={enableHistoryHighlight}
      onToggleHistoryNumbering={() => setEnableHistoryNumbering((prev) => !prev)}
      onToggleHistoryReferences={() => setEnableHistoryReferences((prev) => !prev)}
      onToggleHistoryMetadata={() => setEnableHistoryMetadata((prev) => !prev)}
      onToggleHistoryHighlight={() => setEnableHistoryHighlight((prev) => !prev)}
      onClear={() => setResponses([])}
      onSendMessage={(message) => void handleChat(message)}
      onCleanConversation={handleCleanLlmConversation}
      onToggleChatConfig={handleToggleChatSourcesPanel}
      isChatConfigOpen={isChatConfigOpen}
      onAppendToEditor={(html) => void handleAppendHistoryToEditor(html)}
      onNotify={showHistoryNotice}
      showAppendToEditor={Boolean(currentFileId)}
      isSending={isHistoryProcessing}
      historyNotice={historyNotice}
      includeEditorContextInLlm={includeEditorContextInLlm}
      canToggleIncludeEditorContextInLlm={Boolean(currentFileId)}
      onToggleIncludeEditorContextInLlm={() => {
        if (!currentFileId) return;
        setIncludeEditorContextInLlm((prev) => !prev);
      }}
      chatDisabled={!openAiReady}
      chatDisabledReason={backendStatus === "unavailable"
        ? "Backend indisponivel em http://localhost:8787."
        : backendStatus === "missing_openai_key"
          ? "Backend sem OPENAI_API_KEY."
          : backendStatus === "checking"
            ? "Verificando backend..."
            : undefined}
    />
  );

  const jsonPanelElement = (
    <LlmLogsPanel
      llmLogs={llmLogs}
      llmSessionLogs={llmSessionLogs}
      llmLogFontScale={llmLogFontScale}
      llmLogFontStyle={llmLogFontStyle}
      llmLogFontDefault={LLM_LOG_FONT_DEFAULT}
      llmLogFontMin={LLM_LOG_FONT_MIN}
      llmLogFontMax={LLM_LOG_FONT_MAX}
      onDecreaseFont={() => setLlmLogFontScale((prev) => Math.max(LLM_LOG_FONT_MIN, Number((prev - LLM_LOG_FONT_STEP).toFixed(2))))}
      onIncreaseFont={() => setLlmLogFontScale((prev) => Math.min(LLM_LOG_FONT_MAX, Number((prev + LLM_LOG_FONT_STEP).toFixed(2))))}
      onResetFont={() => setLlmLogFontScale(LLM_LOG_FONT_DEFAULT)}
      onClearLogs={() => {
        setLlmLogs([]);
        setLlmSessionLogs([]);
      }}
      onClose={() => setIsJsonLogPanelOpen(false)}
      effectiveModel={effectiveModel}
      latestLlmMeta={latestLlmMeta}
      latestInputTokens={latestInputTokens}
      latestCachedInputTokens={latestCachedInputTokens}
      latestOutputTokens={latestOutputTokens}
      latestTotalTokens={latestTotalTokens}
      latestReasoningTokens={latestReasoningTokens}
      latestRagReferences={latestRagReferences}
      latestEstimatedBrl={latestEstimatedBrl}
      latestEstimatedUsd={latestEstimatedUsd}
      inputTokens={inputTokens}
      cachedInputTokens={cachedInputTokens}
      outputTokens={outputTokens}
      totalTokens={totalTokens}
      reasoningTokens={reasoningTokens}
      latestRagReferencesAllCalls={latestRagReferencesAllCalls}
      estimatedBrl={estimatedBrl}
      estimatedUsd={estimatedUsd}
      successfulCallsCount={successfulCallsCount}
      errorCallsCount={errorCallsCount}
    />
  );

  const editorPanelElement = (
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
  );

  const getPanelStyle = (widthPx: number): CSSProperties => ({
    width: `${widthPx}px`,
    minWidth: `${widthPx}px`,
    flex: "0 0 auto",
  });

  const renderPanelContainer = (children: ReactNode, className: string, style?: CSSProperties) => (
    <div className={`${className} overflow-hidden`} style={style}>
      {children}
    </div>
  );

  return (
    <div ref={layoutContainerRef} className="h-screen w-screen overflow-hidden bg-background">
      {isMobileView ? (
        <div className="flex h-full min-h-0 flex-col">
          <MobilePanelHeader
            activeMobilePanel={activeMobilePanel}
            options={mobilePanelOptions}
            onSelectPanel={(panelId) => {
              setActiveMobilePanel(panelId);
            }}
          />
          <div className="min-h-0 flex-1">
            {showLeftPanel && renderPanelContainer(leftPanelElement, "h-full min-h-0 bg-card")}
            {showCenterPanel && parameterPanelElement && renderPanelContainer(parameterPanelElement, `h-full min-h-0 ${sidePanelClass}`)}
            {showRightPanel && renderPanelContainer(rightPanelElement, `h-full min-h-0 ${sidePanelClass}`)}
            {showEditorPanel && renderPanelContainer(editorPanelElement, "h-full min-h-0")}
            {showJsonPanel && renderPanelContainer(jsonPanelElement, `h-full min-h-0 ${sidePanelClass}`)}
          </div>
        </div>
      ) : desktopContainerWidthPx !== null ? (
        <div className="flex h-full min-h-0 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full min-h-0" style={{ minWidth: `${desktopMinimumContentWidthPx}px` }}>
            {renderPanelContainer(leftPanelElement, "min-h-0 shrink-0 border-r border-border bg-card", getPanelStyle(desktopFixedPanelWidthsPx.left))}
            <DesktopResizeHandle onResizeDelta={(deltaPx) => resizeDesktopFixedPanel("left", deltaPx)} />

            {hasCenterPanel && parameterPanelElement && (
              <>
                {renderPanelContainer(parameterPanelElement, `min-h-0 shrink-0 border-r border-border ${sidePanelClass}`, getPanelStyle(desktopFixedPanelWidthsPx.parameter))}
                <DesktopResizeHandle onResizeDelta={(deltaPx) => resizeDesktopFixedPanel("parameter", deltaPx)} />
              </>
            )}

            {renderPanelContainer(rightPanelElement, `min-h-0 shrink-0 border-l border-border ${sidePanelClass}`, getPanelStyle(desktopRightWidthPx))}

            {hasEditorPanel && (
              <>
                <DesktopResizeHandle onResizeDelta={(deltaPx) => resizeDesktopFixedPanel("editor", -deltaPx)} />
                {renderPanelContainer(editorPanelElement, `min-h-0 shrink-0 ${panelsBgClass}`, getPanelStyle(desktopFixedPanelWidthsPx.editor))}
              </>
            )}

            {hasJsonPanel && (
              <>
                <DesktopResizeHandle onResizeDelta={(deltaPx) => resizeDesktopFixedPanel("json", -deltaPx)} />
                {renderPanelContainer(jsonPanelElement, `min-h-0 shrink-0 border-l border-border ${sidePanelClass}`, getPanelStyle(desktopFixedPanelWidthsPx.json))}
              </>
            )}

            <div className="shrink-0" style={{ width: `${DESKTOP_CONTENT_EDGE_GUTTER_PX}px` }} aria-hidden="true" />

          </div>
        </div>
      ) : null}

    </div>
  );
};

export default Index;
