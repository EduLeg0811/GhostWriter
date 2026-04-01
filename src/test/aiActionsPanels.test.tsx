import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ParameterPanelToolbar from "@/features/ghost-writer/components/ParameterPanelToolbar";
import AiActionsParameterSection from "@/features/ghost-writer/components/AiActionsParameterSection";

const buildSectionProps = () => ({
  section: "actions" as const,
  actionId: null,
  isAiCommandSelectionPending: false,
  actionText: "",
  aiCommandQuery: "",
  translateLanguage: "Ingles" as const,
  isLoading: false,
  hasDocumentOpen: true,
  isConfigOpen: false,
  includeEditorContextInLlm: false,
  aiActionsLlmModel: "gpt-5.4",
  aiActionsLlmTemperature: 0,
  aiActionsLlmMaxOutputTokens: 500,
  aiActionsLlmVerbosity: "low",
  aiActionsLlmEffort: "none",
  aiActionSystemPrompts: {},
  aiActionsSelectedVectorStoreId: "",
  aiActionVectorStoreOptions: [],
  uploadedChatFiles: [],
  isUploadingChatFiles: false,
  onActionTextChange: vi.fn(),
  onAiCommandQueryChange: vi.fn(),
  onTranslateLanguageChange: vi.fn(),
  onRetrieveSelectedText: vi.fn(),
  onApplyAction: vi.fn(),
  onAiActionsLlmModelChange: vi.fn(),
  onAiActionsLlmTemperatureChange: vi.fn(),
  onAiActionsLlmMaxOutputTokensChange: vi.fn(),
  onAiActionsLlmVerbosityChange: vi.fn(),
  onAiActionsLlmEffortChange: vi.fn(),
  onAiActionSystemPromptChange: vi.fn(),
  onToggleIncludeEditorContextInLlm: vi.fn(),
  onAiActionsSelectedVectorStoreIdChange: vi.fn(),
  onUploadFiles: vi.fn(),
  onRemoveUploadedFile: vi.fn(),
});

describe("AI actions panels", () => {
  it("uses the command toolbar button as a selector instead of executing immediately", () => {
    const onOpenAiActionParameters = vi.fn();

    render(
      <ParameterPanelToolbar
        parameterPanelTarget={{ section: "ai_command", id: "ai_command" }}
        appPanelScope={null}
        isLoading={false}
        isAiActionsConfigOpen={false}
        hasVerbetografiaRequiredFields={false}
        onToggleAiActionsConfig={vi.fn()}
        onOpenAiActionParameters={onOpenAiActionParameters}
        onSelectVerbetografiaAction={vi.fn()}
        onRunAppAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /comando ia/i }));

    expect(onOpenAiActionParameters).toHaveBeenCalledTimes(1);
    expect(onOpenAiActionParameters).toHaveBeenCalledWith("ai_command");
  });

  it("shows translate first and consulta dict second in the translation toolbar", () => {
    render(
      <ParameterPanelToolbar
        parameterPanelTarget={{ section: "translation", id: "translate" }}
        appPanelScope={null}
        isLoading={false}
        isAiActionsConfigOpen={false}
        hasVerbetografiaRequiredFields={false}
        onToggleAiActionsConfig={vi.fn()}
        onOpenAiActionParameters={vi.fn()}
        onSelectVerbetografiaAction={vi.fn()}
        onRunAppAction={vi.fn()}
      />,
    );

    const translateButton = screen.getByRole("button", { name: /^traduzir\b/i });
    const dictButton = screen.getByRole("button", { name: /^dicionários\b/i });

    expect(translateButton.compareDocumentPosition(dictButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders definologia and sinonimologia in the Definições Cons toolbar", () => {
    render(
      <ParameterPanelToolbar
        parameterPanelTarget={{ section: "definitions_cons", id: null }}
        appPanelScope={null}
        isLoading={false}
        isAiActionsConfigOpen={false}
        hasVerbetografiaRequiredFields={false}
        onToggleAiActionsConfig={vi.fn()}
        onOpenAiActionParameters={vi.fn()}
        onSelectVerbetografiaAction={vi.fn()}
        onRunAppAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /^definologia\b/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sinonimologia\b/i })).toBeInTheDocument();
    expect(screen.queryByText(/lexicologia/i)).not.toBeInTheDocument();
  });

  it("keeps Termos & Conceitos only with lexicologia actions", () => {
    render(
      <ParameterPanelToolbar
        parameterPanelTarget={{ section: "actions", id: null }}
        appPanelScope={null}
        isLoading={false}
        isAiActionsConfigOpen={false}
        hasVerbetografiaRequiredFields={false}
        onToggleAiActionsConfig={vi.fn()}
        onOpenAiActionParameters={vi.fn()}
        onSelectVerbetografiaAction={vi.fn()}
        onRunAppAction={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /^definologia\b/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^sinonimologia\b/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^definição\b/i })).toBeInTheDocument();
    const synonymsButton = screen.getByRole("button", { name: /^sinonímia\b/i });
    const antonymsButton = screen.getByRole("button", { name: /^antonímia\b/i });
    expect(screen.getByRole("button", { name: /^etimologia\b/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^cognatos\b/i })).toBeInTheDocument();
    expect(synonymsButton.compareDocumentPosition(antonymsButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("hides the AI config button when consulta dict is selected", () => {
    render(
      <ParameterPanelToolbar
        parameterPanelTarget={{ section: "translation", id: "dict_lookup" }}
        appPanelScope={null}
        isLoading={false}
        isAiActionsConfigOpen={false}
        hasVerbetografiaRequiredFields={false}
        onToggleAiActionsConfig={vi.fn()}
        onOpenAiActionParameters={vi.fn()}
        onSelectVerbetografiaAction={vi.fn()}
        onRunAppAction={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/configurações ia/i)).not.toBeInTheDocument();
  });

  it("shows the shared import and text area before an AI action is selected", () => {
    render(<AiActionsParameterSection {...buildSectionProps()} />);

    expect(screen.getByRole("button", { name: /select & import/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^definologia\b/i })).not.toBeInTheDocument();
  });

  it("shows the command form only after the top selector is chosen", () => {
    const props = {
      ...buildSectionProps(),
      section: "actions" as const,
      actionId: "ai_command" as const,
      aiCommandQuery: "Teste",
    };

    const { rerender } = render(
      <AiActionsParameterSection
        {...props}
        isAiCommandSelectionPending={true}
      />,
    );

    expect(screen.queryByText("Query")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /comando ia/i })).not.toBeInTheDocument();

    rerender(
      <AiActionsParameterSection
        {...props}
        isAiCommandSelectionPending={false}
      />,
    );

    expect(screen.getByText("Query")).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: /comando ia/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton.className).toContain("border-green-300");
  });

  it("renders dicionários without language select or AI config footer", () => {
    render(
      <AiActionsParameterSection
        {...buildSectionProps()}
        section="translation"
        actionId="dict_lookup"
        actionText="casa"
        isConfigOpen={true}
      />,
    );

    expect(screen.getByRole("button", { name: /dicionários/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("casa")).toBeInTheDocument();
    expect(screen.queryByText(/idioma/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/system prompt da ação/i)).not.toBeInTheDocument();
  });

  it("renders the green action button after the text input area", () => {
    render(
      <AiActionsParameterSection
        {...buildSectionProps()}
        section="rewriting"
        actionId="rewrite"
        actionText="Texto base"
      />,
    );

    const textarea = screen.getByDisplayValue("Texto base");
    const submitButton = screen.getByRole("button", { name: /reescrever/i });

    expect(textarea.compareDocumentPosition(submitButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
