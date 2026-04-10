import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AiAssistantConfigPanel from "@/features/ghost-writer/components/AiAssistantConfigPanel";
import BiblioExternaPanel from "@/features/ghost-writer/components/BiblioExternaPanel";
import BiblioGeralPanel from "@/features/ghost-writer/components/BiblioGeralPanel";
import BookSearchPanel from "@/features/ghost-writer/components/BookSearchPanel";
import LexicalOverviewPanel from "@/features/ghost-writer/components/LexicalOverviewPanel";
import InsertRefBookPanel from "@/features/ghost-writer/components/InsertRefBookPanel";
import InsertRefVerbetePanel from "@/features/ghost-writer/components/InsertRefVerbetePanel";
import SemanticSearchPanel from "@/features/ghost-writer/components/SemanticSearchPanel";
import VerbeteSearchPanel from "@/features/ghost-writer/components/VerbeteSearchPanel";
import VerbetografiaPanel from "@/features/ghost-writer/components/VerbetografiaPanel";
import { getActionSystemPrompt, type ActionSystemPromptId } from "@/features/ghost-writer/config/actionSystemPrompts";
import { CONFIG_PROMPT_ROWS } from "@/features/ghost-writer/config/constants";
import { APP_PANEL_ICONS, parameterAppMeta } from "@/features/ghost-writer/config/metadata";
import type { AppActionId, AppPanelScope, RefBookMode, SelectOption, SemanticIndexOption } from "@/features/ghost-writer/types";
import type { BookCode } from "@/lib/bookCatalog";
import type { UploadedLlmFile } from "@/lib/openai";
import { sectionActionButtonClass } from "@/styles/buttonStyles";

interface AppsParameterSectionProps {
  appId: AppActionId | null;
  appPanelScope: AppPanelScope | null;
  isAiActionsConfigOpen: boolean;
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
  verbeteSearchAuthor: string;
  verbeteSearchTitle: string;
  verbeteSearchArea: string;
  verbeteSearchText: string;
  verbeteSearchMaxResults: number;
  isRunningVerbeteSearch: boolean;
  verbetografiaTitle: string;
  verbetografiaSpecialty: string;
  hasDocumentOpen: boolean;
  includeEditorContextInLlm: boolean;
  isRunningVerbetografiaOpenTable: boolean;
  isRunningVerbetografiaOpenTableWord: boolean;
  isRunningVerbeteDefinologia: boolean;
  isRunningVerbeteFraseEnfatica: boolean;
  isRunningVerbeteSinonimologia: boolean;
  isRunningVerbeteFatologia: boolean;
  aiActionsLlmModel: string;
  aiActionsLlmTemperature: number;
  aiActionsLlmMaxOutputTokens: number;
  aiActionsLlmVerbosity: string;
  aiActionsLlmEffort: string;
  aiActionSystemPrompts: Partial<Record<ActionSystemPromptId, string>>;
  aiActionsSelectedVectorStoreId: string;
  aiActionVectorStoreOptions: SelectOption[];
  uploadedChatFiles: UploadedLlmFile[];
  isUploadingChatFiles: boolean;
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
  onVerbetografiaTitleChange: (value: string) => void;
  onVerbetografiaSpecialtyChange: (value: string) => void;
  onAiActionsLlmModelChange: (value: string) => void;
  onAiActionsLlmTemperatureChange: (value: number) => void;
  onAiActionsLlmMaxOutputTokensChange: (value: number) => void;
  onAiActionsLlmVerbosityChange: (value: string) => void;
  onAiActionsLlmEffortChange: (value: string) => void;
  onAiActionSystemPromptChange: (actionId: ActionSystemPromptId, value: string) => void;
  onToggleIncludeEditorContextInLlm: () => void;
  onAiActionsSelectedVectorStoreIdChange: (value: string) => void;
  onUploadFiles: (files: File[]) => void | Promise<void>;
  onRemoveUploadedFile: (fileId: string) => void;
}

const AppsParameterSection = ({
  appId,
  appPanelScope,
  isAiActionsConfigOpen,
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
  verbeteSearchAuthor,
  verbeteSearchTitle,
  verbeteSearchArea,
  verbeteSearchText,
  verbeteSearchMaxResults,
  isRunningVerbeteSearch,
  verbetografiaTitle,
  verbetografiaSpecialty,
  hasDocumentOpen,
  includeEditorContextInLlm,
  isRunningVerbetografiaOpenTable,
  isRunningVerbetografiaOpenTableWord,
  isRunningVerbeteDefinologia,
  isRunningVerbeteFraseEnfatica,
  isRunningVerbeteSinonimologia,
  isRunningVerbeteFatologia,
  aiActionsLlmModel,
  aiActionsLlmTemperature,
  aiActionsLlmMaxOutputTokens,
  aiActionsLlmVerbosity,
  aiActionsLlmEffort,
  aiActionSystemPrompts,
  aiActionsSelectedVectorStoreId,
  aiActionVectorStoreOptions,
  uploadedChatFiles,
  isUploadingChatFiles,
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
  onVerbetografiaTitleChange,
  onVerbetografiaSpecialtyChange,
  onAiActionsLlmModelChange,
  onAiActionsLlmTemperatureChange,
  onAiActionsLlmMaxOutputTokensChange,
  onAiActionsLlmVerbosityChange,
  onAiActionsLlmEffortChange,
  onAiActionSystemPromptChange,
  onToggleIncludeEditorContextInLlm,
  onAiActionsSelectedVectorStoreIdChange,
  onUploadFiles,
  onRemoveUploadedFile,
}: AppsParameterSectionProps) => {
  const [isSemanticSearchFormOpen, setIsSemanticSearchFormOpen] = useState(false);
  const [selectedTableVerbeteAction, setSelectedTableVerbeteAction] = useState<"editor" | "word" | null>(null);

  useEffect(() => {
    if (appId === "app12") {
      setIsSemanticSearchFormOpen(false);
    }
  }, [appId]);

  useEffect(() => {
    setSelectedTableVerbeteAction(null);
  }, [appId]);

  if (appId === "app1") {
    return (
      <InsertRefBookPanel
        title={parameterAppMeta.app1.title}
        description={parameterAppMeta.app1.description}
        selectedRefBook={selectedRefBook}
        refBookMode={refBookMode}
        refBookPages={refBookPages}
        onSelectRefBook={onSelectRefBook}
        onRefBookModeChange={onRefBookModeChange}
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
                <textarea value={biblioExternaLlmSystemPrompt} onChange={(event) => onBiblioExternaLlmSystemPromptChange(event.target.value)} rows={CONFIG_PROMPT_ROWS} className="w-full rounded-md border border-input bg-white px-3 py-2 text-[11px] text-foreground outline-none resize-none overflow-y-auto" />
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

  if (appId === "app13") {
    return (
      <LexicalOverviewPanel
        title={parameterAppMeta.app13.title}
        description={parameterAppMeta.app13.description}
        term={lexicalTerm}
        maxResults={lexicalMaxResults}
        onTermChange={onLexicalTermChange}
        onMaxResultsChange={onLexicalMaxResultsChange}
        onRunSearch={() => void onRunLexicalOverview()}
        isRunning={isRunningLexicalOverview}
        showPanelChrome={false}
      />
    );
  }

  if (appId === "app12") {
    const SemanticSearchIcon = APP_PANEL_ICONS.app12;

    return (
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-1 gap-2 p-4 pb-0">
          <Button
            variant="ghost"
            className={sectionActionButtonClass}
            onClick={() => setIsSemanticSearchFormOpen(true)}
          >
            <SemanticSearchIcon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block break-words text-sm font-medium text-foreground">Busca SemÃ¢ntica</span>
              <span className="block break-words text-xs text-muted-foreground">{parameterAppMeta.app12.description}</span>
            </span>
          </Button>
        </div>
        {isSemanticSearchFormOpen ? (
          <div className="min-h-0 flex-1">
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
          </div>
        ) : null}
      </div>
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
          if (selectedTableVerbeteAction === "word") {
            void onRunVerbetografiaOpenTableWord();
            break;
          }
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
        ? selectedTableVerbeteAction === "word"
          ? isRunningVerbetografiaOpenTableWord
          : isRunningVerbetografiaOpenTable
        : selectedVerbetografiaAction === "app8"
          ? isRunningVerbeteDefinologia
          : selectedVerbetografiaAction === "app11"
            ? isRunningVerbeteFraseEnfatica
            : selectedVerbetografiaAction === "app9"
              ? isRunningVerbeteSinonimologia
              : selectedVerbetografiaAction === "app10"
                ? isRunningVerbeteFatologia
                : false;
    const selectedVerbetografiaSystemPrompt = (
      selectedVerbetografiaAction === "app8"
      || selectedVerbetografiaAction === "app9"
      || selectedVerbetografiaAction === "app10"
      || selectedVerbetografiaAction === "app11"
    )
      ? getActionSystemPrompt(aiActionSystemPrompts, selectedVerbetografiaAction)
      : "";
    const TableVerbeteIcon = APP_PANEL_ICONS.app7;
    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          {selectedVerbetografiaAction ? (
            selectedVerbetografiaAction === "app7" ? (
              <div className="min-h-0 flex-1">
                <VerbetografiaPanel
                  title={parameterAppMeta.app7.title}
                  description={parameterAppMeta.app7.description}
                  extraContent={(
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="ghost"
                        className={`${sectionActionButtonClass} ${selectedTableVerbeteAction === "editor" ? "border border-blue-200 bg-blue-50/80" : ""}`}
                        onClick={() => setSelectedTableVerbeteAction("editor")}
                      >
                        <TableVerbeteIcon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block break-words text-sm font-medium text-foreground">Abre Tabela no Editor</span>
                          <span className="block break-words text-xs text-muted-foreground">Carrega a tabela HTML no editor.</span>
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        className={`${sectionActionButtonClass} ${selectedTableVerbeteAction === "word" ? "border border-blue-200 bg-blue-50/80" : ""}`}
                        onClick={() => setSelectedTableVerbeteAction("word")}
                      >
                        <TableVerbeteIcon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block break-words text-sm font-medium text-foreground">Abre Tabela no Word</span>
                          <span className="block break-words text-xs text-muted-foreground">Baixa a tabela DOCX e abre no Word.</span>
                        </span>
                      </Button>
                    </div>
                  )}
                  actionLabel={selectedTableVerbeteAction === "word" ? "Abre Tabela no Word" : "Abre Tabela no Editor"}
                  verbeteTitle={verbetografiaTitle}
                  specialty={verbetografiaSpecialty}
                  onVerbeteTitleChange={onVerbetografiaTitleChange}
                  onSpecialtyChange={onVerbetografiaSpecialtyChange}
                  onRun={handleRunSelectedVerbetografiaAction}
                  isRunning={isSelectedVerbetografiaActionRunning}
                  showActionButton={selectedTableVerbeteAction !== null}
                  showActionSectionTitle={false}
                  showPanelChrome={false}
                />
              </div>
            ) : (
          <VerbetografiaPanel
            title={selectedVerbetografiaAction ? parameterAppMeta[selectedVerbetografiaAction].title : "SeÃ§Ãµes do Verbete"}
            description={selectedVerbetografiaAction ? parameterAppMeta[selectedVerbetografiaAction].description : "Informe Titulo para habilitar as acoes. Especialidade opcional."}
            actionLabel={selectedVerbetografiaAction ? parameterAppMeta[selectedVerbetografiaAction].title : undefined}
            verbeteTitle={verbetografiaTitle}
            specialty={verbetografiaSpecialty}
            onVerbeteTitleChange={onVerbetografiaTitleChange}
            onSpecialtyChange={onVerbetografiaSpecialtyChange}
            onRun={selectedVerbetografiaAction ? handleRunSelectedVerbetografiaAction : undefined}
            isRunning={isSelectedVerbetografiaActionRunning}
            showActionButton={Boolean(selectedVerbetografiaAction)}
            showActionSectionTitle={false}
            showPanelChrome={false}
          />
            )
          ) : (
            <VerbetografiaPanel
              title="SeÃ§Ãµes do Verbete"
              description="Informe Titulo para habilitar as acoes. Especialidade opcional."
              verbeteTitle={verbetografiaTitle}
              specialty={verbetografiaSpecialty}
              onVerbeteTitleChange={onVerbetografiaTitleChange}
              onSpecialtyChange={onVerbetografiaSpecialtyChange}
              showActionButton={false}
              showActionSectionTitle={false}
              showPanelChrome={false}
            />
          )}
        </div>
        {isAiActionsConfigOpen ? (
          <div className="min-h-0 overflow-y-auto border-t border-border p-4 pr-3">
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
              includeEditorContextInLlm={includeEditorContextInLlm}
              onToggleIncludeEditorContextInLlm={onToggleIncludeEditorContextInLlm}
              canToggleIncludeEditorContextInLlm={hasDocumentOpen}
              extraContent={(
                selectedVerbetografiaAction === "app8"
                || selectedVerbetografiaAction === "app9"
                || selectedVerbetografiaAction === "app10"
                || selectedVerbetografiaAction === "app11"
              ) ? (
                <div className="space-y-2">
                  <Label className="w-36 shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">System Prompt da AÃ§Ã£o</Label>
                  <textarea
                    value={selectedVerbetografiaSystemPrompt}
                    onChange={(event) => {
                      if (
                        selectedVerbetografiaAction === "app8"
                        || selectedVerbetografiaAction === "app9"
                        || selectedVerbetografiaAction === "app10"
                        || selectedVerbetografiaAction === "app11"
                      ) {
                        onAiActionSystemPromptChange(selectedVerbetografiaAction, event.target.value);
                      }
                    }}
                    rows={CONFIG_PROMPT_ROWS}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-[11px] text-foreground outline-none resize-none overflow-y-auto"
                  />
                </div>
              ) : null}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground" />;
};

export default AppsParameterSection;

