import { Label } from "@/components/ui/label";
import AiAssistantConfigPanel from "@/features/ghost-writer/components/AiAssistantConfigPanel";
import BiblioExternaPanel from "@/features/ghost-writer/components/BiblioExternaPanel";
import BiblioGeralPanel from "@/features/ghost-writer/components/BiblioGeralPanel";
import BookSearchPanel from "@/features/ghost-writer/components/BookSearchPanel";
import InsertRefBookPanel from "@/features/ghost-writer/components/InsertRefBookPanel";
import InsertRefVerbetePanel from "@/features/ghost-writer/components/InsertRefVerbetePanel";
import SemanticSearchPanel from "@/features/ghost-writer/components/SemanticSearchPanel";
import VerbeteSearchPanel from "@/features/ghost-writer/components/VerbeteSearchPanel";
import VerbetografiaPanel from "@/features/ghost-writer/components/VerbetografiaPanel";
import { parameterAppMeta } from "@/features/ghost-writer/config/metadata";
import type { AppActionId, AppPanelScope, SelectOption, SemanticIndexOption } from "@/features/ghost-writer/types";
import type { BookCode } from "@/lib/bookCatalog";
import type { UploadedLlmFile } from "@/lib/openai";

interface AppsParameterSectionProps {
  appId: AppActionId | null;
  appPanelScope: AppPanelScope | null;
  isAiActionsConfigOpen: boolean;
  selectedRefBook: BookCode;
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
  selectedSemanticSearchIndexId: string;
  semanticSearchIndexes: SemanticIndexOption[];
  isLoadingSemanticSearchIndexes: boolean;
  semanticSearchQuery: string;
  semanticSearchMaxResults: number;
  isRunningSemanticSearch: boolean;
  verbeteSearchAuthor: string;
  verbeteSearchTitle: string;
  verbeteSearchArea: string;
  verbeteSearchText: string;
  verbeteSearchMaxResults: number;
  isRunningVerbeteSearch: boolean;
  verbetografiaTitle: string;
  verbetografiaSpecialty: string;
  isRunningVerbetografiaOpenTable: boolean;
  isRunningVerbeteDefinologia: boolean;
  isRunningVerbeteFraseEnfatica: boolean;
  isRunningVerbeteSinonimologia: boolean;
  isRunningVerbeteFatologia: boolean;
  aiActionsLlmModel: string;
  aiActionsLlmTemperature: number;
  aiActionsLlmMaxOutputTokens: number;
  aiActionsLlmVerbosity: string;
  aiActionsLlmEffort: string;
  aiActionsSelectedVectorStoreId: string;
  aiActionVectorStoreOptions: SelectOption[];
  uploadedChatFiles: UploadedLlmFile[];
  isUploadingChatFiles: boolean;
  onSelectRefBook: (value: BookCode) => void;
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
  onSelectedSemanticSearchIndexIdChange: (value: string) => void;
  onSemanticSearchQueryChange: (value: string) => void;
  onSemanticSearchMaxResultsChange: (value: number) => void;
  onRunSemanticSearch: () => void | Promise<void>;
  onVerbeteSearchAuthorChange: (value: string) => void;
  onVerbeteSearchTitleChange: (value: string) => void;
  onVerbeteSearchAreaChange: (value: string) => void;
  onVerbeteSearchTextChange: (value: string) => void;
  onVerbeteSearchMaxResultsChange: (value: number) => void;
  onRunVerbeteSearch: () => void | Promise<void>;
  onRunVerbetografiaOpenTable: () => void | Promise<void>;
  onRunVerbeteDefinologia: () => void | Promise<void>;
  onRunVerbeteFraseEnfatica: () => void | Promise<void>;
  onRunVerbeteSinonimologia: () => void | Promise<void>;
  onRunVerbeteFatologia: () => void | Promise<void>;
  onVerbetografiaTitleChange: (value: string) => void;
  onVerbetografiaSpecialtyChange: (value: string) => void;
  onAiActionsLlmModelChange: (value: string) => void;
  onAiActionsLlmTemperatureChange: (value: number) => void;
  onAiActionsLlmMaxOutputTokensChange: (value: number) => void;
  onAiActionsLlmVerbosityChange: (value: string) => void;
  onAiActionsLlmEffortChange: (value: string) => void;
  onAiActionsSelectedVectorStoreIdChange: (value: string) => void;
  onUploadFiles: (files: File[]) => void | Promise<void>;
  onRemoveUploadedFile: (fileId: string) => void;
}

const AppsParameterSection = ({
  appId,
  appPanelScope,
  isAiActionsConfigOpen,
  selectedRefBook,
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
  selectedSemanticSearchIndexId,
  semanticSearchIndexes,
  isLoadingSemanticSearchIndexes,
  semanticSearchQuery,
  semanticSearchMaxResults,
  isRunningSemanticSearch,
  verbeteSearchAuthor,
  verbeteSearchTitle,
  verbeteSearchArea,
  verbeteSearchText,
  verbeteSearchMaxResults,
  isRunningVerbeteSearch,
  verbetografiaTitle,
  verbetografiaSpecialty,
  isRunningVerbetografiaOpenTable,
  isRunningVerbeteDefinologia,
  isRunningVerbeteFraseEnfatica,
  isRunningVerbeteSinonimologia,
  isRunningVerbeteFatologia,
  aiActionsLlmModel,
  aiActionsLlmTemperature,
  aiActionsLlmMaxOutputTokens,
  aiActionsLlmVerbosity,
  aiActionsLlmEffort,
  aiActionsSelectedVectorStoreId,
  aiActionVectorStoreOptions,
  uploadedChatFiles,
  isUploadingChatFiles,
  onSelectRefBook,
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
  onSelectedSemanticSearchIndexIdChange,
  onSemanticSearchQueryChange,
  onSemanticSearchMaxResultsChange,
  onRunSemanticSearch,
  onVerbeteSearchAuthorChange,
  onVerbeteSearchTitleChange,
  onVerbeteSearchAreaChange,
  onVerbeteSearchTextChange,
  onVerbeteSearchMaxResultsChange,
  onRunVerbeteSearch,
  onRunVerbetografiaOpenTable,
  onRunVerbeteDefinologia,
  onRunVerbeteFraseEnfatica,
  onRunVerbeteSinonimologia,
  onRunVerbeteFatologia,
  onVerbetografiaTitleChange,
  onVerbetografiaSpecialtyChange,
  onAiActionsLlmModelChange,
  onAiActionsLlmTemperatureChange,
  onAiActionsLlmMaxOutputTokensChange,
  onAiActionsLlmVerbosityChange,
  onAiActionsLlmEffortChange,
  onAiActionsSelectedVectorStoreIdChange,
  onUploadFiles,
  onRemoveUploadedFile,
}: AppsParameterSectionProps) => {
  if (appId === "app1") {
    return (
      <InsertRefBookPanel
        title={parameterAppMeta.app1.title}
        description={parameterAppMeta.app1.description}
        selectedRefBook={selectedRefBook}
        refBookPages={refBookPages}
        onSelectRefBook={onSelectRefBook}
        onRefBookPagesChange={onRefBookPagesChange}
        onRunInsertRefBook={() => void onRunInsertRefBook()}
        isRunningInsertRefBook={isRunningInsertRefBook}
        showPanelChrome={false}
      />
    );
  }

  if (appId === "app2") {
    return (
      <InsertRefVerbetePanel
        title={parameterAppMeta.app2.title}
        description={parameterAppMeta.app2.description}
        verbeteInput={verbeteInput}
        onVerbeteInputChange={onVerbeteInputChange}
        onRun={() => void onRunInsertRefVerbete()}
        isRunning={isRunningInsertRefVerbete}
        showPanelChrome={false}
      />
    );
  }

  if (appId === "app3") {
    return (
      <BiblioGeralPanel
        title={parameterAppMeta.app3.title}
        description={parameterAppMeta.app3.description}
        author={biblioGeralAuthor}
        titleField={biblioGeralTitle}
        year={biblioGeralYear}
        extra={biblioGeralExtra}
        onAuthorChange={onBiblioGeralAuthorChange}
        onTitleFieldChange={onBiblioGeralTitleChange}
        onYearChange={onBiblioGeralYearChange}
        onExtraChange={onBiblioGeralExtraChange}
        onRun={() => void onRunBiblioGeral()}
        isRunning={isRunningBiblioGeral}
        showPanelChrome={false}
      />
    );
  }

  if (appId === "app6") {
    return (
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
        onAuthorChange={onBiblioExternaAuthorChange}
        onTitleFieldChange={onBiblioExternaTitleChange}
        onYearChange={onBiblioExternaYearChange}
        onJournalChange={onBiblioExternaJournalChange}
        onPublisherChange={onBiblioExternaPublisherChange}
        onIdentifierChange={onBiblioExternaIdentifierChange}
        onExtraChange={onBiblioExternaExtraChange}
        onFreeTextChange={onBiblioExternaFreeTextChange}
        onRun={() => void onRunBiblioExterna()}
        isRunning={isRunningBiblioExterna}
        onToggleConfig={onToggleBiblioExternaConfig}
        isConfigOpen={isBiblioExternaConfigOpen}
        configContent={(
          <AiAssistantConfigPanel
            llmModel={biblioExternaLlmModel}
            onLlmModelChange={onBiblioExternaLlmModelChange}
            llmTemperature={biblioExternaLlmTemperature}
            onLlmTemperatureChange={onBiblioExternaLlmTemperatureChange}
            llmMaxOutputTokens={biblioExternaLlmMaxOutputTokens}
            onLlmMaxOutputTokensChange={onBiblioExternaLlmMaxOutputTokensChange}
            llmVerbosity={biblioExternaLlmVerbosity}
            onLlmVerbosityChange={onBiblioExternaLlmVerbosityChange}
            llmEffort={biblioExternaLlmEffort}
            onLlmEffortChange={onBiblioExternaLlmEffortChange}
            selectedVectorStoreId=""
            onSelectedVectorStoreIdChange={() => {}}
            vectorStoreOptions={[]}
            onUploadFiles={() => {}}
            uploadedFiles={[]}
            onRemoveUploadedFile={() => {}}
            showVectorStore={false}
            showUploadedFiles={false}
            extraContent={(
              <div className="space-y-2">
                <Label className="w-36 shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">System Prompt</Label>
                <textarea value={biblioExternaLlmSystemPrompt} onChange={(event) => onBiblioExternaLlmSystemPromptChange(event.target.value)} rows={10} className="w-full rounded-md border border-input bg-white px-3 py-2 text-[11px] text-foreground outline-none resize-none overflow-y-auto" />
              </div>
            )}
          />
        )}
        showPanelChrome={false}
      />
    );
  }

  if (appId === "app4") {
    return (
      <BookSearchPanel
        title={parameterAppMeta.app4.title}
        description={parameterAppMeta.app4.description}
        bookOptions={lexicalBooks}
        selectedBook={selectedLexicalBook}
        term={lexicalTerm}
        maxResults={lexicalMaxResults}
        onSelectBook={onSelectedLexicalBookChange}
        onTermChange={onLexicalTermChange}
        onMaxResultsChange={onLexicalMaxResultsChange}
        onRunSearch={() => void onRunLexicalSearch()}
        isRunning={isRunningLexicalSearch}
        showPanelChrome={false}
      />
    );
  }

  if (appId === "app12") {
    return (
      <SemanticSearchPanel
        title={parameterAppMeta.app12.title}
        description={parameterAppMeta.app12.description}
        selectedIndexId={selectedSemanticSearchIndexId}
        availableIndexes={semanticSearchIndexes}
        isLoadingIndexes={isLoadingSemanticSearchIndexes}
        onSelectedIndexChange={onSelectedSemanticSearchIndexIdChange}
        query={semanticSearchQuery}
        maxResults={semanticSearchMaxResults}
        onQueryChange={onSemanticSearchQueryChange}
        onMaxResultsChange={onSemanticSearchMaxResultsChange}
        onRunSearch={() => void onRunSemanticSearch()}
        isRunning={isRunningSemanticSearch}
        showPanelChrome={false}
      />
    );
  }

  if (appId === "app5") {
    return (
      <VerbeteSearchPanel
        title={parameterAppMeta.app5.title}
        description={parameterAppMeta.app5.description}
        author={verbeteSearchAuthor}
        titleField={verbeteSearchTitle}
        area={verbeteSearchArea}
        text={verbeteSearchText}
        maxResults={verbeteSearchMaxResults}
        onAuthorChange={onVerbeteSearchAuthorChange}
        onTitleFieldChange={onVerbeteSearchTitleChange}
        onAreaChange={onVerbeteSearchAreaChange}
        onTextChange={onVerbeteSearchTextChange}
        onMaxResultsChange={onVerbeteSearchMaxResultsChange}
        onRunSearch={() => void onRunVerbeteSearch()}
        isRunning={isRunningVerbeteSearch}
        showPanelChrome={false}
      />
    );
  }

  if (appPanelScope === "verbetografia") {
    const selectedVerbetografiaAction =
      appId === "app7" || appId === "app8" || appId === "app11" || appId === "app9" || appId === "app10"
        ? appId
        : null;

    const handleRunSelectedVerbetografiaAction = () => {
      switch (selectedVerbetografiaAction) {
        case "app7":
          void onRunVerbetografiaOpenTable();
          break;
        case "app8":
          void onRunVerbeteDefinologia();
          break;
        case "app11":
          void onRunVerbeteFraseEnfatica();
          break;
        case "app9":
          void onRunVerbeteSinonimologia();
          break;
        case "app10":
          void onRunVerbeteFatologia();
          break;
        default:
          break;
      }
    };

    const isSelectedVerbetografiaActionRunning =
      selectedVerbetografiaAction === "app7"
        ? isRunningVerbetografiaOpenTable
        : selectedVerbetografiaAction === "app8"
          ? isRunningVerbeteDefinologia
          : selectedVerbetografiaAction === "app11"
            ? isRunningVerbeteFraseEnfatica
            : selectedVerbetografiaAction === "app9"
              ? isRunningVerbeteSinonimologia
              : selectedVerbetografiaAction === "app10"
                ? isRunningVerbeteFatologia
                : false;

    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          {selectedVerbetografiaAction ? (
          <VerbetografiaPanel
            title={selectedVerbetografiaAction ? parameterAppMeta[selectedVerbetografiaAction].title : "Seções do Verbete"}
            description={selectedVerbetografiaAction ? parameterAppMeta[selectedVerbetografiaAction].description : "Informe Título e Especialidade para habilitar as ações."}
            actionLabel={selectedVerbetografiaAction ? parameterAppMeta[selectedVerbetografiaAction].title : undefined}
            verbeteTitle={verbetografiaTitle}
            specialty={verbetografiaSpecialty}
            onVerbeteTitleChange={onVerbetografiaTitleChange}
            onSpecialtyChange={onVerbetografiaSpecialtyChange}
            onRun={selectedVerbetografiaAction ? handleRunSelectedVerbetografiaAction : undefined}
            isRunning={isSelectedVerbetografiaActionRunning}
            showActionButton={Boolean(selectedVerbetografiaAction)}
            showPanelChrome={false}
          />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground" />
          )}
        </div>
        {isAiActionsConfigOpen ? (
          <div className="border-t border-border p-4">
            <AiAssistantConfigPanel
              llmModel={aiActionsLlmModel}
              onLlmModelChange={onAiActionsLlmModelChange}
              llmTemperature={aiActionsLlmTemperature}
              onLlmTemperatureChange={onAiActionsLlmTemperatureChange}
              llmMaxOutputTokens={aiActionsLlmMaxOutputTokens}
              onLlmMaxOutputTokensChange={onAiActionsLlmMaxOutputTokensChange}
              llmVerbosity={aiActionsLlmVerbosity}
              onLlmVerbosityChange={onAiActionsLlmVerbosityChange}
              llmEffort={aiActionsLlmEffort}
              onLlmEffortChange={onAiActionsLlmEffortChange}
              selectedVectorStoreId={aiActionsSelectedVectorStoreId}
              onSelectedVectorStoreIdChange={onAiActionsSelectedVectorStoreIdChange}
              vectorStoreOptions={aiActionVectorStoreOptions}
              onUploadFiles={(files) => void onUploadFiles(files)}
              uploadedFiles={uploadedChatFiles}
              onRemoveUploadedFile={onRemoveUploadedFile}
              isUploadingFiles={isUploadingChatFiles}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground" />;
};

export default AppsParameterSection;
