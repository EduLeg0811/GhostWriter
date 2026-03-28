import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ParameterPanelToolbar from "@/features/ghost-writer/components/ParameterPanelToolbar";
import AppsParameterSection from "@/features/ghost-writer/components/AppsParameterSection";

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
  it("uses the top toolbar as selector only for verbetografia actions", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /tabela verbete/i }));

    expect(onSelectVerbetografiaAction).toHaveBeenCalledWith("app7");
    expect(onRunAppAction).not.toHaveBeenCalled();
  });

  it("keeps the verbetografia body empty until a section button is selected", () => {
    render(
      <AppsParameterSection
        {...baseAppsProps}
        appId={null}
      />,
    );

    expect(screen.queryByDisplayValue("Autopesquisa")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Parapercepciologia")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tabela automatizada/i })).not.toBeInTheDocument();
  });

  it("shows the verbetografia form and final green action button after selection", () => {
    const onRunVerbetografiaOpenTable = vi.fn();

    render(
      <AppsParameterSection
        {...baseAppsProps}
        appId="app7"
        onRunVerbetografiaOpenTable={onRunVerbetografiaOpenTable}
      />,
    );

    expect(screen.getByDisplayValue("Autopesquisa")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Parapercepciologia")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /tabela automatizada/i });
    expect(button.className).toContain("border-green-300");

    fireEvent.click(button);
    expect(onRunVerbetografiaOpenTable).toHaveBeenCalledTimes(1);
  });
});
