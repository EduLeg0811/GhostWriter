import { useCallback, useState } from "react";
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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
  buildDefinePrompt,
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
import { AI_ACTIONS_LLM_SETTINGS_STORAGE_KEY, BIBLIO_EXTERNA_DEFAULT_SYSTEM_PROMPT, BIBLIO_EXTERNA_LLM_SETTINGS_STORAGE_KEY, CHAT_EDITOR_CONTEXT_MAX_CHARS, DEFAULT_BOOK_SEARCH_MAX_RESULTS, DEFAULT_LOG_FONT_SIZE_PX, GENERAL_SETTINGS_STORAGE_KEY, LLM_LOG_FONT_MAX, LLM_LOG_FONT_MIN, LLM_LOG_FONT_STEP, LLM_SETTINGS_STORAGE_KEY, NO_VECTOR_STORE_ID, PANEL_SIZES } from "@/features/ghost-writer/config/constants";
import { BOOK_SOURCE, DEFAULT_BOOK_SOURCE_ID, MACRO1_HIGHLIGHT_COLORS, TRANSLATE_LANGUAGE_OPTIONS, VECTOR_STORES_SOURCE } from "@/features/ghost-writer/config/options";
import useGhostWriterLayout from "@/features/ghost-writer/hooks/useGhostWriterLayout";
import useGhostWriterDocument from "@/features/ghost-writer/hooks/useGhostWriterDocument";
import useGhostWriterApps from "@/features/ghost-writer/hooks/useGhostWriterApps";
import useGhostWriterLlm from "@/features/ghost-writer/hooks/useGhostWriterLlm";
import useGhostWriterLlmLogs from "@/features/ghost-writer/hooks/useGhostWriterLlmLogs";
import { useGhostWriterAppsState, useGhostWriterDocumentState, useGhostWriterLlmState } from "@/features/ghost-writer/hooks/useGhostWriterDocumentState";
import useGhostWriterFeedback from "@/features/ghost-writer/hooks/useGhostWriterFeedback";
const sidePanelClass = panelsBgClass;

const Index = () => {
  const LLM_LOG_FONT_DEFAULT = Number((DEFAULT_LOG_FONT_SIZE_PX / 11).toFixed(2));
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
    selectedRefBook, setSelectedRefBook, refBookPages, setRefBookPages, isRunningInsertRefBook, setIsRunningInsertRefBook, verbeteInput, setVerbeteInput,
    isRunningInsertRefVerbete, setIsRunningInsertRefVerbete, biblioGeralAuthor, setBiblioGeralAuthor, biblioGeralTitle, setBiblioGeralTitle, biblioGeralYear, setBiblioGeralYear,
    biblioGeralExtra, setBiblioGeralExtra, isRunningBiblioGeral, setIsRunningBiblioGeral, biblioExternaAuthor, setBiblioExternaAuthor, biblioExternaTitle, setBiblioExternaTitle,
    biblioExternaYear, setBiblioExternaYear, biblioExternaJournal, setBiblioExternaJournal, biblioExternaPublisher, setBiblioExternaPublisher, biblioExternaIdentifier,
    setBiblioExternaIdentifier, biblioExternaExtra, setBiblioExternaExtra, biblioExternaFreeText, setBiblioExternaFreeText, isRunningBiblioExterna, setIsRunningBiblioExterna,
    lexicalBooks, setLexicalBooks, selectedLexicalBook, setSelectedLexicalBook, lexicalTerm, setLexicalTerm, lexicalMaxResults, setLexicalMaxResults, isRunningLexicalSearch,
    setIsRunningLexicalSearch, semanticSearchQuery, setSemanticSearchQuery, semanticSearchMaxResults, setSemanticSearchMaxResults, semanticSearchIndexes, setSemanticSearchIndexes,
    selectedSemanticSearchIndexId, setSelectedSemanticSearchIndexId, isLoadingSemanticSearchIndexes, setIsLoadingSemanticSearchIndexes, isRunningSemanticSearch, setIsRunningSemanticSearch,
    verbeteSearchAuthor, setVerbeteSearchAuthor, verbeteSearchTitle, setVerbeteSearchTitle, verbeteSearchArea, setVerbeteSearchArea, verbeteSearchText, setVerbeteSearchText,
    verbeteSearchMaxResults, setVerbeteSearchMaxResults, isRunningVerbeteSearch, setIsRunningVerbeteSearch, verbetografiaTitle, setVerbetografiaTitle,
    verbetografiaSpecialty, setVerbetografiaSpecialty, isRunningVerbetografiaOpenTable, setIsRunningVerbetografiaOpenTable, isRunningVerbeteDefinologia, setIsRunningVerbeteDefinologia,
    isRunningVerbeteFraseEnfatica, setIsRunningVerbeteFraseEnfatica, isRunningVerbeteSinonimologia, setIsRunningVerbeteSinonimologia, isRunningVerbeteFatologia, setIsRunningVerbeteFatologia,
  } = appState;
  const llmState = useGhostWriterLlmState(LLM_LOG_FONT_DEFAULT);
  const {
    responses, setResponses, isLoading, setIsLoading, actionText, setActionText, chatHistory, setChatHistory, backendStatus, setBackendStatus, translateLanguage, setTranslateLanguage,
    aiCommandQuery, setAiCommandQuery, llmModel, setLlmModel, llmTemperature, setLlmTemperature, llmMaxOutputTokens, setLlmMaxOutputTokens, llmMaxNumResults, setLlmMaxNumResults,
    llmEditorContextMaxChars, setLlmEditorContextMaxChars, llmVerbosity, setLlmVerbosity, llmEffort, setLlmEffort, llmSystemPrompt, setLlmSystemPrompt, aiActionsLlmModel,
    setAiActionsLlmModel, aiActionsLlmTemperature, setAiActionsLlmTemperature, aiActionsLlmMaxOutputTokens, setAiActionsLlmMaxOutputTokens, aiActionsLlmVerbosity, setAiActionsLlmVerbosity,
    aiActionsLlmEffort, setAiActionsLlmEffort, aiActionsLlmSystemPrompt, setAiActionsLlmSystemPrompt, aiActionSystemPrompts, setAiActionSystemPrompts, aiActionsSelectedVectorStoreIds, setAiActionsSelectedVectorStoreIds,
    aiActionsSelectedInputFileIds, setAiActionsSelectedInputFileIds, biblioExternaLlmModel, setBiblioExternaLlmModel, biblioExternaLlmTemperature, setBiblioExternaLlmTemperature,
    biblioExternaLlmMaxOutputTokens, setBiblioExternaLlmMaxOutputTokens, biblioExternaLlmVerbosity, setBiblioExternaLlmVerbosity, biblioExternaLlmEffort, setBiblioExternaLlmEffort,
    biblioExternaLlmSystemPrompt, setBiblioExternaLlmSystemPrompt, chatPreviousResponseId, setChatPreviousResponseId, llmLogs, setLlmLogs, llmSessionLogs, setLlmSessionLogs,
    llmLogFontScale, setLlmLogFontScale, enableHistoryNumbering, setEnableHistoryNumbering, enableHistoryReferences, setEnableHistoryReferences, enableHistoryMetadata, setEnableHistoryMetadata, selectedBookSourceIds, setSelectedBookSourceIds,
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
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    sourcesPanelView,
    setSourcesPanelView,
    isChatConfigOpen,
    isAiActionsConfigOpen,
    isBiblioExternaConfigOpen,
    hasCenterPanel,
    hasJsonPanel,
    layoutResetKey,
    mobilePanelOptions,
    showJsonPanel,
    showLeftPanel,
    showCenterPanel,
    showRightPanel,
    showEditorPanel,
    showHandleAfterLeft,
    showHandleAfterCenter,
    showHandleAfterRight,
    showHandleAfterJson,
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
    handleRunVerbeteDefinologia,
    handleRunVerbeteFraseEnfatica,
    handleRunVerbeteSinonimologia,
    handleRunVerbeteFatologia,
    handleSelectVerbetografiaAction,
    handleRunLexicalSearch,
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

  const handleOpenParameterSection = useCallback((section: ParameterPanelSection) => {
    setIsAiCommandSelectionPending(false);
    setAppPanelScope(section === "apps" ? "bibliografia" : null);
    if (section === "sources") setSourcesPanelView("books");
    else setSourcesPanelView(null);
    setParameterPanelTarget({ section, id: null });
  }, [setAppPanelScope, setParameterPanelTarget, setSourcesPanelView]);

  const handleOpenAiActionParameters = useCallback((type: AiActionId) => {
    setIsAiCommandSelectionPending(false);
    baseHandleOpenAiActionParameters(type);
  }, [baseHandleOpenAiActionParameters]);

  const handleOpenAiCommandPanel = useCallback(() => {
    setIsAiCommandSelectionPending(true);
    baseHandleOpenAiCommandPanel();
  }, [baseHandleOpenAiCommandPanel]);

  const handleToggleBookSource = useCallback((id: string, checked: boolean) => {
    setSelectedBookSourceIds((prev) => {
      if (checked) {
        if (id === NO_VECTOR_STORE_ID) return [NO_VECTOR_STORE_ID];
        return normalizeIdList([...prev.filter((value) => value !== NO_VECTOR_STORE_ID), id]);
      }

      return prev.filter((value) => value !== id);
    });
  }, [setSelectedBookSourceIds]);

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
  }, [actionText, macro1Term, setMacro1Term, setParameterPanelTarget]);

  const isHistoryProcessing =
    isLoading || isRunningInsertRefBook || isRunningInsertRefVerbete || isRunningBiblioGeral || isRunningBiblioExterna || isRunningLexicalSearch || isRunningSemanticSearch || isRunningVerbeteSearch || isRunningVerbetografiaOpenTable || isRunningVerbeteDefinologia || isRunningVerbeteFraseEnfatica || isRunningVerbeteSinonimologia || isRunningVerbeteFatologia;
  const parameterPanelHeaderMeta = parameterPanelTarget
    ? getParameterPanelHeaderMeta(parameterPanelTarget, appPanelScope)
    : null;
  const hasVerbetografiaRequiredFields = Boolean(verbetografiaTitle.trim() && verbetografiaSpecialty.trim());
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {isMobileView && (
        <MobilePanelHeader
          activeMobilePanel={activeMobilePanel}
          options={mobilePanelOptions}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((open) => !open)}
          onSelectPanel={(panelId) => {
            setActiveMobilePanel(panelId);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
      <ResizablePanelGroup key={layoutResetKey} direction="horizontal" className={isMobileView ? "h-[calc(100vh-3.5rem)]" : "min-h-0"}>
        {showLeftPanel && (
          <ResizablePanel
            id="left-panel"
            order={1}
            defaultSize={PANEL_SIZES.left.default}
            minSize={PANEL_SIZES.left.min}
            maxSize={PANEL_SIZES.left.max}
            className="min-h-0 border-r border-border bg-card"
          >
            <LeftPanel
              onOpenParameterSection={handleOpenParameterSection}
              onOpenAiCommand={handleOpenAiCommandPanel}
              onOpenVerbetografiaTable={handleOpenVerbetografiaTableFromLeft}
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
              className={`min-h-0 border-r border-border ${sidePanelClass}`}
            >
              {parameterPanelTarget ? (
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
                    isRunningVerbeteDefinologia={isRunningVerbeteDefinologia}
                    isRunningVerbeteFraseEnfatica={isRunningVerbeteFraseEnfatica}
                    isRunningVerbeteSinonimologia={isRunningVerbeteSinonimologia}
                    isRunningVerbeteFatologia={isRunningVerbeteFatologia}
                    hasVerbetografiaRequiredFields={hasVerbetografiaRequiredFields}
                    onToggleAiActionsConfig={() => toggleLlmConfigPanel("ai_actions")}
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
                    onAiActionsSelectedVectorStoreIdsChange={setAiActionsSelectedVectorStoreIds}
                    onUploadSourceFiles={handleUploadSourceFiles}
                    onSelectRefBook={handleSelectRefBook}
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
              ) : null}
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
            className={`min-h-0 border-l border-border ${sidePanelClass}`}
          >
            <RightPanel
              responses={responses}
              enableHistoryNumbering={enableHistoryNumbering}
              enableHistoryReferences={enableHistoryReferences}
              enableHistoryMetadata={enableHistoryMetadata}
              onToggleHistoryNumbering={() => setEnableHistoryNumbering((prev) => !prev)}
              onToggleHistoryReferences={() => setEnableHistoryReferences((prev) => !prev)}
              onToggleHistoryMetadata={() => setEnableHistoryMetadata((prev) => !prev)}
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
              className={`min-h-0 border-l border-border ${sidePanelClass}`}
            >
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
            </ResizablePanel>
            {showHandleAfterJson && <ResizableHandle withHandle />}
          </>
        )}

        {showEditorPanel && (
          <>
            <ResizablePanel
              id="editor-panel"
              order={hasCenterPanel ? (showJsonPanel ? 5 : 4) : (showJsonPanel ? 4 : 3)}
              defaultSize={PANEL_SIZES.editor.default}
              minSize={PANEL_SIZES.editor.min}
              maxSize={PANEL_SIZES.editor.max}
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
