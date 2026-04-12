import SourcesPanel from "@/features/ghost-writer/components/SourcesPanel";
import ApplicationsLinksPanel from "@/features/ghost-writer/components/ApplicationsLinksPanel";
import DocumentParameterSection from "@/features/ghost-writer/components/DocumentParameterSection";
import AiActionsParameterSection from "@/features/ghost-writer/components/AiActionsParameterSection";
import AppsParameterSection from "@/features/ghost-writer/components/AppsParameterSection";
import ParameterPanelToolbar from "@/features/ghost-writer/components/ParameterPanelToolbar";
import type { ActionSystemPromptId } from "@/features/ghost-writer/config/actionSystemPrompts";
import { NO_VECTOR_STORE_ID } from "@/features/ghost-writer/config/constants";
import { BOOK_SOURCE, DEFAULT_BOOK_SOURCE_ID, MACRO1_HIGHLIGHT_COLORS, TRANSLATE_LANGUAGE_OPTIONS, VECTOR_STORES_SOURCE } from "@/features/ghost-writer/config/options";
import type { TextStats } from "@/hooks/useTextStats";
import type { BookCode } from "@/lib/bookCatalog";
import type { UploadedLlmFile } from "@/lib/openai";
import type { AiActionId, AppActionId, AppPanelScope, Macro2SpacingMode, ParameterPanelTarget, RefBookMode, SelectOption, SemanticIndexOption } from "@/features/ghost-writer/types";

type NonNullParameterPanelTarget = Exclude<ParameterPanelTarget, null>;

interface ParameterPanelContentProps {
  parameterPanelTarget: NonNullParameterPanelTarget;
  appPanelScope: AppPanelScope | null;
  isLoading: boolean;
  isAiActionsConfigOpen: boolean;
  isTermsConceptsConscienciografiaEnabled: boolean;
  isUploadingChatFiles: boolean;
  currentFileId: string;
  selectedImportFileName: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  stats: TextStats;
  isOpeningDocument: boolean;
  isImportingDocument: boolean;
  macro1Term: string;
  macro1ColorId: (typeof MACRO1_HIGHLIGHT_COLORS)[number]["id"];
  macro1PredictedMatches: number | null;
  isCountingMacro1Matches: boolean;
  macro2SpacingMode: Macro2SpacingMode;
  selectedBookSourceIds: string[];
  selectedChatSourceLabel: string;
  uploadedChatFiles: UploadedLlmFile[];
  llmModel: string;
  llmTemperature: number;
  llmMaxOutputTokens: number;
  llmMaxNumResults: number;
  llmEditorContextMaxChars: number;
  llmVerbosity: string;
  llmEffort: string;
  llmSystemPrompt: string;
  actionText: string;
  aiCommandQuery: string;
  translateLanguage: (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"];
  aiActionsLlmModel: string;
  aiActionsLlmTemperature: number;
  aiActionsLlmMaxOutputTokens: number;
  aiActionsLlmVerbosity: string;
  aiActionsLlmEffort: string;
  aiActionSystemPrompts: Partial<Record<ActionSystemPromptId, string>>;
  aiActionsSelectedVectorStoreIds: string[];
  aiActionVectorStoreOptions: SelectOption[];
  selectedRefBook: BookCode;
  refBookMode: RefBookMode;
  refBookPages: string;
  isRunningInsertRefBook: boolean;
  verbeteInput: string;
  isRunningInsertRefVerbete: boolean;
  biblioGeralAuthor: string;
  biblioGeralTitle: string;
  biblioGeralYear: string;
  biblioGeralExtra: string;
  isRunningBiblioGeral: boolean;
  biblioExternaAuthor: string;
  biblioExternaTitle: string;
  biblioExternaYear: string;
  biblioExternaJournal: string;
  biblioExternaPublisher: string;
  biblioExternaIdentifier: string;
  biblioExternaExtra: string;
  biblioExternaFreeText: string;
  isRunningBiblioExterna: boolean;
  isBiblioExternaConfigOpen: boolean;
  biblioExternaLlmModel: string;
  biblioExternaLlmTemperature: number;
  biblioExternaLlmMaxOutputTokens: number;
  biblioExternaLlmVerbosity: string;
  biblioExternaLlmEffort: string;
  biblioExternaLlmSystemPrompt: string;
  lexicalBooks: string[];
  selectedLexicalBook: string;
  lexicalTerm: string;
  lexicalMaxResults: number;
  isRunningLexicalSearch: boolean;
  isRunningLexicalOverview: boolean;
  selectedSemanticSearchIndexId: string;
  semanticSearchIndexes: SemanticIndexOption[];
  isLoadingSemanticSearchIndexes: boolean;
  semanticSearchQuery: string;
  semanticSearchMaxResults: number;
  isRunningSemanticSearch: boolean;
  semanticOverviewTerm: string;
  semanticOverviewMaxResults: number;
  isRunningSemanticOverview: boolean;
  verbeteSearchAuthor: string;
  verbeteSearchTitle: string;
  verbeteSearchArea: string;
  verbeteSearchText: string;
  verbeteSearchMaxResults: number;
  isRunningVerbeteSearch: boolean;
  verbetografiaTitle: string;
  verbetografiaSpecialty: string;
  includeEditorContextInLlm: boolean;
  isRunningVerbetografiaOpenTable: boolean;
  isRunningVerbetografiaOpenTableWord: boolean;
  isRunningVerbeteDefinologia: boolean;
  isRunningVerbeteFraseEnfatica: boolean;
  isRunningVerbeteSinonimologia: boolean;
  isRunningVerbeteFatologia: boolean;
  hasVerbetografiaRequiredFields: boolean;
  onToggleAiActionsConfig: () => void;
  onToggleTermsConceptsConscienciografia: () => void;
  onCreateBlankDocument: () => void | Promise<void>;
  onDocumentPanelFile: (file: File | null | undefined) => void | Promise<void>;
  onDocumentPanelDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onClearSelectedImportFileName: () => void;
  onRefreshStats: () => void | Promise<void>;
  onOpenMacro: (macroId: "macro1" | "macro2") => void | Promise<void>;
  onMacro1TermChange: (value: string) => void;
  onMacro1ColorChange: (value: (typeof MACRO1_HIGHLIGHT_COLORS)[number]["id"]) => void;
  onRunMacro1Highlight: () => void | Promise<void>;
  onClearMacro1Highlight: () => void | Promise<void>;
  onMacro2SpacingModeChange: (value: Macro2SpacingMode) => void;
  onRunMacro2ManualNumbering: () => void | Promise<void>;
  onToggleBookSource: (id: string, checked: boolean) => void;
  onRemoveUploadedChatFile: (fileId: string) => void;
  onLlmModelChange: (value: string) => void;
  onLlmTemperatureChange: (value: number) => void;
  onLlmMaxOutputTokensChange: (value: number) => void;
  onLlmMaxNumResultsChange: (value: number) => void;
  onLlmEditorContextMaxCharsChange: (value: number) => void;
  onLlmVerbosityChange: (value: string) => void;
  onLlmEffortChange: (value: string) => void;
  onLlmSystemPromptChange: (value: string) => void;
  onResetAllConfig: () => void;
  onRunRandomPensata: () => void | Promise<void>;
  onOpenAiActionParameters: (id: AiActionId, sectionOverride?: "actions" | "rewriting" | "translation" | "customized_prompts") => void;
  onActionTextChange: (value: string) => void;
  onAiCommandQueryChange: (value: string) => void;
  onTranslateLanguageChange: (value: (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"]) => void;
  onRetrieveSelectedText: () => void | Promise<void>;
  onApplyAction: (actionId: AiActionId) => void | Promise<void>;
  onAiActionsLlmModelChange: (value: string) => void;
  onAiActionsLlmTemperatureChange: (value: number) => void;
  onAiActionsLlmMaxOutputTokensChange: (value: number) => void;
  onAiActionsLlmVerbosityChange: (value: string) => void;
  onAiActionsLlmEffortChange: (value: string) => void;
  onAiActionSystemPromptChange: (actionId: ActionSystemPromptId, value: string) => void;
  onToggleIncludeEditorContextInLlm: () => void;
  onAiActionsSelectedVectorStoreIdsChange: (value: string[]) => void;
  onUploadSourceFiles: (files: File[]) => void | Promise<void>;
  onSelectRefBook: (value: BookCode) => void;
  onRefBookModeChange: (value: RefBookMode) => void;
  onRefBookPagesChange: (value: string) => void;
  onRunInsertRefBook: () => void | Promise<void>;
  onVerbeteInputChange: (value: string) => void;
  onRunInsertRefVerbete: () => void | Promise<void>;
  onBiblioGeralAuthorChange: (value: string) => void;
  onBiblioGeralTitleChange: (value: string) => void;
  onBiblioGeralYearChange: (value: string) => void;
  onBiblioGeralExtraChange: (value: string) => void;
  onRunBiblioGeral: () => void | Promise<void>;
  onBiblioExternaAuthorChange: (value: string) => void;
  onBiblioExternaTitleChange: (value: string) => void;
  onBiblioExternaYearChange: (value: string) => void;
  onBiblioExternaJournalChange: (value: string) => void;
  onBiblioExternaPublisherChange: (value: string) => void;
  onBiblioExternaIdentifierChange: (value: string) => void;
  onBiblioExternaExtraChange: (value: string) => void;
  onBiblioExternaFreeTextChange: (value: string) => void;
  onRunBiblioExterna: () => void | Promise<void>;
  onToggleBiblioExternaConfig: () => void;
  onBiblioExternaLlmModelChange: (value: string) => void;
  onBiblioExternaLlmTemperatureChange: (value: number) => void;
  onBiblioExternaLlmMaxOutputTokensChange: (value: number) => void;
  onBiblioExternaLlmVerbosityChange: (value: string) => void;
  onBiblioExternaLlmEffortChange: (value: string) => void;
  onBiblioExternaLlmSystemPromptChange: (value: string) => void;
  onSelectedLexicalBookChange: (value: string) => void;
  onLexicalTermChange: (value: string) => void;
  onLexicalMaxResultsChange: (value: number) => void;
  onRunLexicalSearch: () => void | Promise<void>;
  onRunLexicalOverview: () => void | Promise<void>;
  onSelectedSemanticSearchIndexIdChange: (value: string) => void;
  onSemanticSearchQueryChange: (value: string) => void;
  onSemanticSearchMaxResultsChange: (value: number) => void;
  onRunSemanticSearch: () => void | Promise<void>;
  onSemanticOverviewTermChange: (value: string) => void;
  onSemanticOverviewMaxResultsChange: (value: number) => void;
  onRunSemanticOverview: () => void | Promise<void>;
  onVerbeteSearchAuthorChange: (value: string) => void;
  onVerbeteSearchTitleChange: (value: string) => void;
  onVerbeteSearchAreaChange: (value: string) => void;
  onVerbeteSearchTextChange: (value: string) => void;
  onVerbeteSearchMaxResultsChange: (value: number) => void;
  onRunVerbeteSearch: () => void | Promise<void>;
  onRunVerbetografiaOpenTable: () => void | Promise<void>;
  onRunVerbetografiaOpenTableWord: () => void | Promise<void>;
  onRunVerbeteDefinologia: () => void | Promise<void>;
  onRunVerbeteFraseEnfatica: () => void | Promise<void>;
  onRunVerbeteSinonimologia: () => void | Promise<void>;
  onRunVerbeteFatologia: () => void | Promise<void>;
  onSelectVerbetografiaAction: (id: "app7" | "app8" | "app9" | "app10" | "app11") => void | Promise<void>;
  onRunAppAction: (id: AppActionId) => void | Promise<void>;
  onVerbetografiaTitleChange: (value: string) => void;
  onVerbetografiaSpecialtyChange: (value: string) => void;
}

const ParameterPanelContent = ({
  parameterPanelTarget,
  appPanelScope,
  isLoading,
  isAiActionsConfigOpen,
  isTermsConceptsConscienciografiaEnabled,
  isUploadingChatFiles,
  currentFileId,
  selectedImportFileName,
  fileInputRef,
  stats,
  isOpeningDocument,
  isImportingDocument,
  macro1Term,
  macro1ColorId,
  macro1PredictedMatches,
  isCountingMacro1Matches,
  macro2SpacingMode,
  selectedBookSourceIds,
  selectedChatSourceLabel,
  uploadedChatFiles,
  llmModel,
  llmTemperature,
  llmMaxOutputTokens,
  llmMaxNumResults,
  llmEditorContextMaxChars,
  llmVerbosity,
  llmEffort,
  llmSystemPrompt,
  actionText,
  aiCommandQuery,
  translateLanguage,
  aiActionsLlmModel,
  aiActionsLlmTemperature,
  aiActionsLlmMaxOutputTokens,
  aiActionsLlmVerbosity,
  aiActionsLlmEffort,
  aiActionSystemPrompts,
  aiActionsSelectedVectorStoreIds,
  aiActionVectorStoreOptions,
  selectedRefBook,
  refBookMode,
  refBookPages,
  isRunningInsertRefBook,
  verbeteInput,
  isRunningInsertRefVerbete,
  biblioGeralAuthor,
  biblioGeralTitle,
  biblioGeralYear,
  biblioGeralExtra,
  isRunningBiblioGeral,
  biblioExternaAuthor,
  biblioExternaTitle,
  biblioExternaYear,
  biblioExternaJournal,
  biblioExternaPublisher,
  biblioExternaIdentifier,
  biblioExternaExtra,
  biblioExternaFreeText,
  isRunningBiblioExterna,
  isBiblioExternaConfigOpen,
  biblioExternaLlmModel,
  biblioExternaLlmTemperature,
  biblioExternaLlmMaxOutputTokens,
  biblioExternaLlmVerbosity,
  biblioExternaLlmEffort,
  biblioExternaLlmSystemPrompt,
  lexicalBooks,
  selectedLexicalBook,
  lexicalTerm,
  lexicalMaxResults,
  isRunningLexicalSearch,
  isRunningLexicalOverview,
  selectedSemanticSearchIndexId,
  semanticSearchIndexes,
  isLoadingSemanticSearchIndexes,
  semanticSearchQuery,
  semanticSearchMaxResults,
  isRunningSemanticSearch,
  semanticOverviewTerm,
  semanticOverviewMaxResults,
  isRunningSemanticOverview,
  verbeteSearchAuthor,
  verbeteSearchTitle,
  verbeteSearchArea,
  verbeteSearchText,
  verbeteSearchMaxResults,
  isRunningVerbeteSearch,
  verbetografiaTitle,
  verbetografiaSpecialty,
  includeEditorContextInLlm,
  isRunningVerbetografiaOpenTable,
  isRunningVerbetografiaOpenTableWord,
  isRunningVerbeteDefinologia,
  isRunningVerbeteFraseEnfatica,
  isRunningVerbeteSinonimologia,
  isRunningVerbeteFatologia,
  hasVerbetografiaRequiredFields,
  onToggleAiActionsConfig,
  onToggleTermsConceptsConscienciografia,
  onCreateBlankDocument,
  onDocumentPanelFile,
  onDocumentPanelDrop,
  onClearSelectedImportFileName,
  onRefreshStats,
  onOpenMacro,
  onMacro1TermChange,
  onMacro1ColorChange,
  onRunMacro1Highlight,
  onClearMacro1Highlight,
  onMacro2SpacingModeChange,
  onRunMacro2ManualNumbering,
  onToggleBookSource,
  onRemoveUploadedChatFile,
  onLlmModelChange,
  onLlmTemperatureChange,
  onLlmMaxOutputTokensChange,
  onLlmMaxNumResultsChange,
  onLlmEditorContextMaxCharsChange,
  onLlmVerbosityChange,
  onLlmEffortChange,
  onLlmSystemPromptChange,
  onResetAllConfig,
  onRunRandomPensata,
  onOpenAiActionParameters,
  onActionTextChange,
  onAiCommandQueryChange,
  onTranslateLanguageChange,
  onRetrieveSelectedText,
  onApplyAction,
  onAiActionsLlmModelChange,
  onAiActionsLlmTemperatureChange,
  onAiActionsLlmMaxOutputTokensChange,
  onAiActionsLlmVerbosityChange,
  onAiActionsLlmEffortChange,
  onAiActionSystemPromptChange,
  onToggleIncludeEditorContextInLlm,
  onAiActionsSelectedVectorStoreIdsChange,
  onUploadSourceFiles,
  onSelectRefBook,
  onRefBookModeChange,
  onRefBookPagesChange,
  onRunInsertRefBook,
  onVerbeteInputChange,
  onRunInsertRefVerbete,
  onBiblioGeralAuthorChange,
  onBiblioGeralTitleChange,
  onBiblioGeralYearChange,
  onBiblioGeralExtraChange,
  onRunBiblioGeral,
  onBiblioExternaAuthorChange,
  onBiblioExternaTitleChange,
  onBiblioExternaYearChange,
  onBiblioExternaJournalChange,
  onBiblioExternaPublisherChange,
  onBiblioExternaIdentifierChange,
  onBiblioExternaExtraChange,
  onBiblioExternaFreeTextChange,
  onRunBiblioExterna,
  onToggleBiblioExternaConfig,
  onBiblioExternaLlmModelChange,
  onBiblioExternaLlmTemperatureChange,
  onBiblioExternaLlmMaxOutputTokensChange,
  onBiblioExternaLlmVerbosityChange,
  onBiblioExternaLlmEffortChange,
  onBiblioExternaLlmSystemPromptChange,
  onSelectedLexicalBookChange,
  onLexicalTermChange,
  onLexicalMaxResultsChange,
  onRunLexicalSearch,
  onRunLexicalOverview,
  onSelectedSemanticSearchIndexIdChange,
  onSemanticSearchQueryChange,
  onSemanticSearchMaxResultsChange,
  onRunSemanticSearch,
  onSemanticOverviewTermChange,
  onSemanticOverviewMaxResultsChange,
  onRunSemanticOverview,
  onVerbeteSearchAuthorChange,
  onVerbeteSearchTitleChange,
  onVerbeteSearchAreaChange,
  onVerbeteSearchTextChange,
  onVerbeteSearchMaxResultsChange,
  onRunVerbeteSearch,
  onRunVerbetografiaOpenTable,
  onRunVerbetografiaOpenTableWord,
  onRunVerbeteDefinologia,
  onRunVerbeteFraseEnfatica,
  onRunVerbeteSinonimologia,
  onRunVerbeteFatologia,
  onSelectVerbetografiaAction,
  onRunAppAction,
  onVerbetografiaTitleChange,
  onVerbetografiaSpecialtyChange,
}: ParameterPanelContentProps) => {
  const aiActionsSelectedVectorStoreId = aiActionsSelectedVectorStoreIds[0] ?? "";
  const isVerbetografiaAiAction =
    parameterPanelTarget.section === "apps"
    && appPanelScope === "verbetografia"
    && (parameterPanelTarget.id === "app8"
      || parameterPanelTarget.id === "app9"
      || parameterPanelTarget.id === "app10"
      || parameterPanelTarget.id === "app11");
  const verbetografiaDefaultVectorStoreId = DEFAULT_BOOK_SOURCE_ID;
  const effectiveVerbetografiaVectorStoreId =
    aiActionsSelectedVectorStoreId === NO_VECTOR_STORE_ID
      ? NO_VECTOR_STORE_ID
      : (aiActionsSelectedVectorStoreId || verbetografiaDefaultVectorStoreId);

  return (
    <div className="flex h-full flex-col">
      <ParameterPanelToolbar
        parameterPanelTarget={parameterPanelTarget}
        appPanelScope={appPanelScope}
        isLoading={isLoading}
        isAiActionsConfigOpen={isAiActionsConfigOpen}
        isTermsConceptsConscienciografiaEnabled={isTermsConceptsConscienciografiaEnabled}
        hasVerbetografiaRequiredFields={hasVerbetografiaRequiredFields}
        onToggleAiActionsConfig={onToggleAiActionsConfig}
        onToggleTermsConceptsConscienciografia={onToggleTermsConceptsConscienciografia}
        onOpenAiActionParameters={onOpenAiActionParameters}
        onSelectVerbetografiaAction={onSelectVerbetografiaAction}
        onRunAppAction={(id) => void onRunAppAction(id)}
      />
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {parameterPanelTarget.section === "document" ? (
          <DocumentParameterSection
            activeMacroId={parameterPanelTarget.id}
            currentFileId={currentFileId}
            selectedImportFileName={selectedImportFileName}
            fileInputRef={fileInputRef}
            stats={stats}
            isLoading={isLoading}
            isOpeningDocument={isOpeningDocument}
            isImportingDocument={isImportingDocument}
            macro1Term={macro1Term}
            macro1ColorId={macro1ColorId}
            macro1PredictedMatches={macro1PredictedMatches}
            isCountingMacro1Matches={isCountingMacro1Matches}
            macro2SpacingMode={macro2SpacingMode}
            onCreateBlankDocument={onCreateBlankDocument}
            onDocumentPanelFile={onDocumentPanelFile}
            onDocumentPanelDrop={onDocumentPanelDrop}
            onClearSelectedImportFileName={onClearSelectedImportFileName}
            onRefreshStats={onRefreshStats}
            onOpenMacro={onOpenMacro}
            onMacro1TermChange={onMacro1TermChange}
            onMacro1ColorChange={onMacro1ColorChange}
            onRunMacro1Highlight={onRunMacro1Highlight}
            onClearMacro1Highlight={onClearMacro1Highlight}
            onMacro2SpacingModeChange={onMacro2SpacingModeChange}
            onRunMacro2ManualNumbering={onRunMacro2ManualNumbering}
          />
        ) : null}

        {parameterPanelTarget.section === "sources" ? (
          <SourcesPanel
            onUploadFiles={(files) => void onUploadSourceFiles(files)}
            bookSources={BOOK_SOURCE.map((item) => ({ ...item }))}
            vectorStoreSources={VECTOR_STORES_SOURCE.map((item) => ({ ...item }))}
            selectedBookSourceIds={selectedBookSourceIds}
            onToggleBookSource={onToggleBookSource}
            selectedChatSourceLabel={selectedChatSourceLabel}
            uploadedFiles={uploadedChatFiles}
            onRemoveUploadedFile={onRemoveUploadedChatFile}
            isUploadingFiles={isUploadingChatFiles}
            llmModel={llmModel}
            onLlmModelChange={onLlmModelChange}
            llmTemperature={llmTemperature}
            onLlmTemperatureChange={onLlmTemperatureChange}
            llmMaxOutputTokens={llmMaxOutputTokens}
            onLlmMaxOutputTokensChange={onLlmMaxOutputTokensChange}
            llmMaxNumResults={llmMaxNumResults}
            onLlmMaxNumResultsChange={onLlmMaxNumResultsChange}
            llmEditorContextMaxChars={llmEditorContextMaxChars}
            onLlmEditorContextMaxCharsChange={onLlmEditorContextMaxCharsChange}
            llmVerbosity={llmVerbosity}
            onLlmVerbosityChange={onLlmVerbosityChange}
            llmEffort={llmEffort}
            onLlmEffortChange={onLlmEffortChange}
            llmSystemPrompt={llmSystemPrompt}
            onLlmSystemPromptChange={onLlmSystemPromptChange}
            includeEditorContextInLlm={includeEditorContextInLlm}
            onToggleIncludeEditorContextInLlm={onToggleIncludeEditorContextInLlm}
            canToggleIncludeEditorContextInLlm={Boolean(currentFileId)}
            onResetAllConfig={onResetAllConfig}
          />
        ) : null}

        {parameterPanelTarget.section === "applications" ? (
          <ApplicationsLinksPanel
            isLoading={isLoading}
            onRunRandomPensata={() => void onRunRandomPensata()}
          />
        ) : null}

        {(parameterPanelTarget.section === "actions" || parameterPanelTarget.section === "rewriting" || parameterPanelTarget.section === "translation" || parameterPanelTarget.section === "customized_prompts") ? (
          <AiActionsParameterSection
            section={parameterPanelTarget.section}
            actionId={parameterPanelTarget.id}
            actionText={actionText}
            aiCommandQuery={aiCommandQuery}
            translateLanguage={translateLanguage}
            isLoading={isLoading}
            hasDocumentOpen={Boolean(currentFileId)}
            isConfigOpen={isAiActionsConfigOpen}
            isTermsConceptsConscienciografiaEnabled={isTermsConceptsConscienciografiaEnabled}
            includeEditorContextInLlm={includeEditorContextInLlm}
            aiActionsLlmModel={aiActionsLlmModel}
            aiActionsLlmTemperature={aiActionsLlmTemperature}
            aiActionsLlmMaxOutputTokens={aiActionsLlmMaxOutputTokens}
            aiActionsLlmVerbosity={aiActionsLlmVerbosity}
            aiActionsLlmEffort={aiActionsLlmEffort}
            aiActionSystemPrompts={aiActionSystemPrompts}
            aiActionsSelectedVectorStoreId={aiActionsSelectedVectorStoreId}
            aiActionVectorStoreOptions={aiActionVectorStoreOptions}
            uploadedChatFiles={uploadedChatFiles}
            isUploadingChatFiles={isUploadingChatFiles}
            onActionTextChange={onActionTextChange}
            onAiCommandQueryChange={onAiCommandQueryChange}
            onTranslateLanguageChange={onTranslateLanguageChange}
            onRetrieveSelectedText={onRetrieveSelectedText}
            onApplyAction={onApplyAction}
            onAiActionsLlmModelChange={onAiActionsLlmModelChange}
            onAiActionsLlmTemperatureChange={onAiActionsLlmTemperatureChange}
            onAiActionsLlmMaxOutputTokensChange={onAiActionsLlmMaxOutputTokensChange}
            onAiActionsLlmVerbosityChange={onAiActionsLlmVerbosityChange}
            onAiActionsLlmEffortChange={onAiActionsLlmEffortChange}
            onAiActionSystemPromptChange={onAiActionSystemPromptChange}
            onToggleIncludeEditorContextInLlm={onToggleIncludeEditorContextInLlm}
            onAiActionsSelectedVectorStoreIdChange={(value) => onAiActionsSelectedVectorStoreIdsChange(value ? [value] : [])}
            onUploadFiles={onUploadSourceFiles}
            onRemoveUploadedFile={onRemoveUploadedChatFile}
          />
        ) : null}

        {parameterPanelTarget.section === "apps" ? (
          <AppsParameterSection
            appId={parameterPanelTarget.id}
            appPanelScope={appPanelScope}
            isAiActionsConfigOpen={isAiActionsConfigOpen}
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
            semanticOverviewTerm={semanticOverviewTerm}
            semanticOverviewMaxResults={semanticOverviewMaxResults}
            isRunningSemanticOverview={isRunningSemanticOverview}
            verbeteSearchAuthor={verbeteSearchAuthor}
            verbeteSearchTitle={verbeteSearchTitle}
            verbeteSearchArea={verbeteSearchArea}
            verbeteSearchText={verbeteSearchText}
            verbeteSearchMaxResults={verbeteSearchMaxResults}
            isRunningVerbeteSearch={isRunningVerbeteSearch}
            verbetografiaTitle={verbetografiaTitle}
            verbetografiaSpecialty={verbetografiaSpecialty}
            hasDocumentOpen={Boolean(currentFileId)}
            includeEditorContextInLlm={includeEditorContextInLlm}
            isRunningVerbetografiaOpenTable={isRunningVerbetografiaOpenTable}
            isRunningVerbetografiaOpenTableWord={isRunningVerbetografiaOpenTableWord}
            isRunningVerbeteDefinologia={isRunningVerbeteDefinologia}
            isRunningVerbeteFraseEnfatica={isRunningVerbeteFraseEnfatica}
            isRunningVerbeteSinonimologia={isRunningVerbeteSinonimologia}
            isRunningVerbeteFatologia={isRunningVerbeteFatologia}
            aiActionsLlmModel={aiActionsLlmModel}
            aiActionsLlmTemperature={aiActionsLlmTemperature}
            aiActionsLlmMaxOutputTokens={aiActionsLlmMaxOutputTokens}
            aiActionsLlmVerbosity={aiActionsLlmVerbosity}
            aiActionsLlmEffort={aiActionsLlmEffort}
            aiActionSystemPrompts={aiActionSystemPrompts}
            aiActionsSelectedVectorStoreId={isVerbetografiaAiAction ? effectiveVerbetografiaVectorStoreId : aiActionsSelectedVectorStoreId}
            aiActionVectorStoreOptions={aiActionVectorStoreOptions}
            uploadedChatFiles={uploadedChatFiles}
            isUploadingChatFiles={isUploadingChatFiles}
            onSelectRefBook={onSelectRefBook}
            onRefBookModeChange={onRefBookModeChange}
            onRefBookPagesChange={onRefBookPagesChange}
            onRunInsertRefBook={onRunInsertRefBook}
            onVerbeteInputChange={onVerbeteInputChange}
            onRunInsertRefVerbete={onRunInsertRefVerbete}
            onBiblioGeralAuthorChange={onBiblioGeralAuthorChange}
            onBiblioGeralTitleChange={onBiblioGeralTitleChange}
            onBiblioGeralYearChange={onBiblioGeralYearChange}
            onBiblioGeralExtraChange={onBiblioGeralExtraChange}
            onRunBiblioGeral={onRunBiblioGeral}
            onBiblioExternaAuthorChange={onBiblioExternaAuthorChange}
            onBiblioExternaTitleChange={onBiblioExternaTitleChange}
            onBiblioExternaYearChange={onBiblioExternaYearChange}
            onBiblioExternaJournalChange={onBiblioExternaJournalChange}
            onBiblioExternaPublisherChange={onBiblioExternaPublisherChange}
            onBiblioExternaIdentifierChange={onBiblioExternaIdentifierChange}
            onBiblioExternaExtraChange={onBiblioExternaExtraChange}
            onBiblioExternaFreeTextChange={onBiblioExternaFreeTextChange}
            onRunBiblioExterna={onRunBiblioExterna}
            onToggleBiblioExternaConfig={onToggleBiblioExternaConfig}
            onBiblioExternaLlmModelChange={onBiblioExternaLlmModelChange}
            onBiblioExternaLlmTemperatureChange={onBiblioExternaLlmTemperatureChange}
            onBiblioExternaLlmMaxOutputTokensChange={onBiblioExternaLlmMaxOutputTokensChange}
            onBiblioExternaLlmVerbosityChange={onBiblioExternaLlmVerbosityChange}
            onBiblioExternaLlmEffortChange={onBiblioExternaLlmEffortChange}
            onBiblioExternaLlmSystemPromptChange={onBiblioExternaLlmSystemPromptChange}
            onSelectedLexicalBookChange={onSelectedLexicalBookChange}
            onLexicalTermChange={onLexicalTermChange}
            onLexicalMaxResultsChange={onLexicalMaxResultsChange}
            onRunLexicalSearch={onRunLexicalSearch}
            onRunLexicalOverview={onRunLexicalOverview}
            onSelectedSemanticSearchIndexIdChange={onSelectedSemanticSearchIndexIdChange}
            onSemanticSearchQueryChange={onSemanticSearchQueryChange}
            onSemanticSearchMaxResultsChange={onSemanticSearchMaxResultsChange}
            onRunSemanticSearch={onRunSemanticSearch}
            onSemanticOverviewTermChange={onSemanticOverviewTermChange}
            onSemanticOverviewMaxResultsChange={onSemanticOverviewMaxResultsChange}
            onRunSemanticOverview={onRunSemanticOverview}
            onVerbeteSearchAuthorChange={onVerbeteSearchAuthorChange}
            onVerbeteSearchTitleChange={onVerbeteSearchTitleChange}
            onVerbeteSearchAreaChange={onVerbeteSearchAreaChange}
            onVerbeteSearchTextChange={onVerbeteSearchTextChange}
            onVerbeteSearchMaxResultsChange={onVerbeteSearchMaxResultsChange}
            onRunVerbeteSearch={onRunVerbeteSearch}
            onRunVerbetografiaOpenTable={onRunVerbetografiaOpenTable}
            onRunVerbetografiaOpenTableWord={onRunVerbetografiaOpenTableWord}
            onRunVerbeteDefinologia={onRunVerbeteDefinologia}
            onRunVerbeteFraseEnfatica={onRunVerbeteFraseEnfatica}
            onRunVerbeteSinonimologia={onRunVerbeteSinonimologia}
            onRunVerbeteFatologia={onRunVerbeteFatologia}
            onVerbetografiaTitleChange={onVerbetografiaTitleChange}
            onVerbetografiaSpecialtyChange={onVerbetografiaSpecialtyChange}
            onAiActionsLlmModelChange={onAiActionsLlmModelChange}
            onAiActionsLlmTemperatureChange={onAiActionsLlmTemperatureChange}
            onAiActionsLlmMaxOutputTokensChange={onAiActionsLlmMaxOutputTokensChange}
            onAiActionsLlmVerbosityChange={onAiActionsLlmVerbosityChange}
            onAiActionsLlmEffortChange={onAiActionsLlmEffortChange}
            onAiActionSystemPromptChange={onAiActionSystemPromptChange}
            onToggleIncludeEditorContextInLlm={onToggleIncludeEditorContextInLlm}
            onAiActionsSelectedVectorStoreIdChange={(value) => onAiActionsSelectedVectorStoreIdsChange(value ? [value] : [])}
            onUploadFiles={onUploadSourceFiles}
            onRemoveUploadedFile={onRemoveUploadedChatFile}
          />
        ) : null}
      </div>
    </div>
  );
};

export default ParameterPanelContent;
