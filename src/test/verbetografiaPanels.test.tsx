import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ParameterPanelToolbar from "@/features/ghost-writer/components/ParameterPanelToolbar";
import AppsParameterSection from "@/features/ghost-writer/components/AppsParameterSection";
import { ActionSystemPromptId } from "@/features/ghost-writer/config/actionSystemPrompts";

const baseAppsProps = {
  appPanelScope: "verbetografia" as const,
  isAiActionsConfigOpen: false,
  selectedRefBook: "EXP" as const,
  refBookPages: "",
  isRunningInsertRefBook: false,
  verbeteInput: "",
  isRunningInsertRefVerbete: false,
  biblioGeralAuthor: "",
  biblioGeralTitle: "",
  biblioGeralYear: "",
  biblioGeralExtra: "",
  isRunningBiblioGeral: false,
  biblioExternaAuthor: "",
  biblioExternaTitle: "",
  biblioExternaYear: "",
  biblioExternaJournal: "",
  biblioExternaPublisher: "",
  biblioExternaIdentifier: "",
  biblioExternaExtra: "",
  biblioExternaFreeText: "",
  isRunningBiblioExterna: false,
  isBiblioExternaConfigOpen: false,
  biblioExternaLlmModel: "gpt-5.4",
  biblioExternaLlmTemperature: 0,
  biblioExternaLlmMaxOutputTokens: 500,
  biblioExternaLlmVerbosity: "low",
  biblioExternaLlmEffort: "none",
  biblioExternaLlmSystemPrompt: "",
  lexicalBooks: [],
  selectedLexicalBook: "",
  lexicalTerm: "",
  lexicalMaxResults: 10,
  isRunningLexicalSearch: false,
  selectedSemanticSearchIndexId: "",
  semanticSearchIndexes: [],
  isLoadingSemanticSearchIndexes: false,
  semanticSearchQuery: "",
  semanticSearchMaxResults: 10,
  isRunningSemanticSearch: false,
  verbeteSearchAuthor: "",
  verbeteSearchTitle: "",
  verbeteSearchArea: "",
  verbeteSearchText: "",
  verbeteSearchMaxResults: 10,
  isRunningVerbeteSearch: false,
  verbetografiaTitle: "Autopesquisa",
  verbetografiaSpecialty: "Parapercepciologia",
  isRunningVerbetografiaOpenTable: false,
  isRunningVerbeteDefinologia: false,
  isRunningVerbeteFraseEnfatica: false,
  isRunningVerbeteSinonimologia: false,
  isRunningVerbeteFatologia: false,
  aiActionsLlmModel: "gpt-5.4",
  aiActionsLlmTemperature: 0,
  aiActionsLlmMaxOutputTokens: 500,
  aiActionsLlmVerbosity: "low",
  aiActionsLlmEffort: "none",
  aiActionsSelectedVectorStoreId: "",
  aiActionVectorStoreOptions: [],
  uploadedChatFiles: [],
  isUploadingChatFiles: false,
  onSelectRefBook: vi.fn(),
  onRefBookPagesChange: vi.fn(),
  onRunInsertRefBook: vi.fn(),
  onVerbeteInputChange: vi.fn(),
  onRunInsertRefVerbete: vi.fn(),
  onBiblioGeralAuthorChange: vi.fn(),
  onBiblioGeralTitleChange: vi.fn(),
  onBiblioGeralYearChange: vi.fn(),
  onBiblioGeralExtraChange: vi.fn(),
  onRunBiblioGeral: vi.fn(),
  onBiblioExternaAuthorChange: vi.fn(),
  onBiblioExternaTitleChange: vi.fn(),
  onBiblioExternaYearChange: vi.fn(),
  onBiblioExternaJournalChange: vi.fn(),
  onBiblioExternaPublisherChange: vi.fn(),
  onBiblioExternaIdentifierChange: vi.fn(),
  onBiblioExternaExtraChange: vi.fn(),
  onBiblioExternaFreeTextChange: vi.fn(),
  onRunBiblioExterna: vi.fn(),
  onToggleBiblioExternaConfig: vi.fn(),
  onBiblioExternaLlmModelChange: vi.fn(),
  onBiblioExternaLlmTemperatureChange: vi.fn(),
  onBiblioExternaLlmMaxOutputTokensChange: vi.fn(),
  onBiblioExternaLlmVerbosityChange: vi.fn(),
  onBiblioExternaLlmEffortChange: vi.fn(),
  onBiblioExternaLlmSystemPromptChange: vi.fn(),
  onSelectedLexicalBookChange: vi.fn(),
  onLexicalTermChange: vi.fn(),
  onLexicalMaxResultsChange: vi.fn(),
  onRunLexicalSearch: vi.fn(),
  onSelectedSemanticSearchIndexIdChange: vi.fn(),
  onSemanticSearchQueryChange: vi.fn(),
  onSemanticSearchMaxResultsChange: vi.fn(),
  onRunSemanticSearch: vi.fn(),
  onVerbeteSearchAuthorChange: vi.fn(),
  onVerbeteSearchTitleChange: vi.fn(),
  onVerbeteSearchAreaChange: vi.fn(),
  onVerbeteSearchTextChange: vi.fn(),
  onVerbeteSearchMaxResultsChange: vi.fn(),
  onRunVerbeteSearch: vi.fn(),
  onRunVerbetografiaOpenTable: vi.fn(),
  onRunVerbeteDefinologia: vi.fn(),
  onRunVerbeteFraseEnfatica: vi.fn(),
  onRunVerbeteSinonimologia: vi.fn(),
  onRunVerbeteFatologia: vi.fn(),
  onVerbetografiaTitleChange: vi.fn(),
  onVerbetografiaSpecialtyChange: vi.fn(),
  onAiActionsLlmModelChange: vi.fn(),
  onAiActionsLlmTemperatureChange: vi.fn(),
  onAiActionsLlmMaxOutputTokensChange: vi.fn(),
  onAiActionsLlmVerbosityChange: vi.fn(),
  onAiActionsLlmEffortChange: vi.fn(),
  onAiActionsSelectedVectorStoreIdChange: vi.fn(),
  onUploadFiles: vi.fn(),
  onRemoveUploadedFile: vi.fn(),
};

describe("verbetografia panels", () => {
  it("uses the top toolbar as selector only for the current verbetografia actions", () => {
    const onSelectVerbetografiaAction = vi.fn();
    const onRunAppAction = vi.fn();

    render(
      <ParameterPanelToolbar
        parameterPanelTarget={{ section: "apps", id: null }}
        appPanelScope="verbetografia"
        isLoading={false}
        isAiActionsConfigOpen={false}
        hasVerbetografiaRequiredFields={true}
        onToggleAiActionsConfig={vi.fn()}
        onOpenAiActionParameters={vi.fn()}
        onSelectVerbetografiaAction={onSelectVerbetografiaAction}
        onRunAppAction={onRunAppAction}
      />,
    );

    expect(screen.queryByRole("button", { name: /tabela verbete/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /definologia/i }));

    expect(onSelectVerbetografiaAction).toHaveBeenCalledWith("app8");
    expect(onRunAppAction).not.toHaveBeenCalled();
  });

  it("keeps the verbetografia body empty until a section button is selected", () => {
    render(
      <AppsParameterSection
        hasDocumentOpen={false} includeEditorContextInLlm={false} onToggleIncludeEditorContextInLlm={function (): void {
          throw new Error("Function not implemented.");
        } } aiActionSystemPrompts={undefined} onAiActionSystemPromptChange={function (actionId: ActionSystemPromptId, value: string): void {
          throw new Error("Function not implemented.");
        } } {...baseAppsProps}
        appId={null}      />,
    );

    expect(screen.queryByDisplayValue("Autopesquisa")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Parapercepciologia")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tabela automatizada/i })).not.toBeInTheDocument();
  });

  it("shows the verbetografia form and final green action button after selection", () => {
    const onRunVerbetografiaOpenTable = vi.fn();

    render(
      <AppsParameterSection
        hasDocumentOpen={false} includeEditorContextInLlm={false} onToggleIncludeEditorContextInLlm={function (): void {
          throw new Error("Function not implemented.");
        } } aiActionSystemPrompts={undefined} onAiActionSystemPromptChange={function (actionId: ActionSystemPromptId, value: string): void {
          throw new Error("Function not implemented.");
        } } {...baseAppsProps}
        appId="app7"
        onRunVerbetografiaOpenTable={onRunVerbetografiaOpenTable}      />,
    );

    const openButton = screen.getByRole("button", { name: /tabela automatizada/i });
    expect(openButton).toBeInTheDocument();

    fireEvent.click(openButton);

    expect(screen.getByDisplayValue("Autopesquisa")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Parapercepciologia")).toBeInTheDocument();

    const actionButton = screen.getByRole("button", { name: /abre tabela no editor/i });
    expect(actionButton.className).toContain("border-green-300");

    fireEvent.click(actionButton);
    expect(onRunVerbetografiaOpenTable).toHaveBeenCalledTimes(1);
  });

  it("shows semantic search fields only after clicking the main panel button", () => {
    render(
      <AppsParameterSection
        hasDocumentOpen={false}
        includeEditorContextInLlm={false}
        onToggleIncludeEditorContextInLlm={function (): void {
          throw new Error("Function not implemented.");
        }}
        aiActionSystemPrompts={undefined}
        onAiActionSystemPromptChange={function (actionId: ActionSystemPromptId, value: string): void {
          throw new Error("Function not implemented.");
        }}
        {...baseAppsProps}
        appId="app12"
        appPanelScope={null}
        semanticSearchIndexes={[{
          id: "idx-1",
          label: "Indice 1",
          sourceRows: 10,
          model: "text-embedding-3-large",
          dimensions: 3072,
          embeddingDtype: "float32",
          sourceFile: ""
        }]}
        selectedSemanticSearchIndexId="idx-1"
      />,
    );

    expect(screen.getByRole("button", { name: /busca semântica/i })).toBeInTheDocument();
    expect(screen.queryByText("Base Vetorial")).not.toBeInTheDocument();
    expect(screen.queryByText("Query")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /busca semântica/i }));

    expect(screen.getByText("Base Vetorial")).toBeInTheDocument();
    expect(screen.getByText("Query")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buscar/i })).toBeInTheDocument();
  });
});
