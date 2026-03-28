import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ParameterPanelToolbar from "@/features/ghost-writer/components/ParameterPanelToolbar";
import AiActionsParameterSection from "@/features/ghost-writer/components/AiActionsParameterSection";

describe("AI actions panels", () => {
  it("uses the command toolbar button as a selector instead of executing immediately", () => {
    const onOpenAiActionParameters = vi.fn();

    render(
      <ParameterPanelToolbar
        parameterPanelTarget={{ section: "actions", id: "ai_command" }}
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

  it("keeps the AI action body empty until an action is selected", () => {
    render(
      <AiActionsParameterSection
        section="actions"
        actionId={null}
        isAiCommandSelectionPending={false}
        actionText=""
        aiCommandQuery=""
        translateLanguage="en"
        isLoading={false}
        hasDocumentOpen={true}
        isConfigOpen={false}
        aiActionsLlmModel="gpt-5.4"
        aiActionsLlmTemperature={0}
        aiActionsLlmMaxOutputTokens={500}
        aiActionsLlmVerbosity="low"
        aiActionsLlmEffort="none"
        aiActionsSelectedVectorStoreId=""
        aiActionVectorStoreOptions={[]}
        uploadedChatFiles={[]}
        isUploadingChatFiles={false}
        onActionTextChange={vi.fn()}
        onAiCommandQueryChange={vi.fn()}
        onTranslateLanguageChange={vi.fn()}
        onRetrieveSelectedText={vi.fn()}
        onApplyAction={vi.fn()}
        onAiActionsLlmModelChange={vi.fn()}
        onAiActionsLlmTemperatureChange={vi.fn()}
        onAiActionsLlmMaxOutputTokensChange={vi.fn()}
        onAiActionsLlmVerbosityChange={vi.fn()}
        onAiActionsLlmEffortChange={vi.fn()}
        onAiActionsSelectedVectorStoreIdChange={vi.fn()}
        onUploadFiles={vi.fn()}
        onRemoveUploadedFile={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows the command form only after the top selector is chosen", () => {
    const props = {
      section: "actions" as const,
      actionId: "ai_command" as const,
      actionText: "",
      aiCommandQuery: "Teste",
      translateLanguage: "en" as const,
      isLoading: false,
      hasDocumentOpen: true,
      isConfigOpen: false,
      aiActionsLlmModel: "gpt-5.4",
      aiActionsLlmTemperature: 0,
      aiActionsLlmMaxOutputTokens: 500,
      aiActionsLlmVerbosity: "low",
      aiActionsLlmEffort: "none",
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
      onAiActionsSelectedVectorStoreIdChange: vi.fn(),
      onUploadFiles: vi.fn(),
      onRemoveUploadedFile: vi.fn(),
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

  it("renders the green action button after the text input area", () => {
    render(
      <AiActionsParameterSection
        section="rewriting"
        actionId="rewrite"
        isAiCommandSelectionPending={false}
        actionText="Texto base"
        aiCommandQuery=""
        translateLanguage="en"
        isLoading={false}
        hasDocumentOpen={true}
        isConfigOpen={false}
        aiActionsLlmModel="gpt-5.4"
        aiActionsLlmTemperature={0}
        aiActionsLlmMaxOutputTokens={500}
        aiActionsLlmVerbosity="low"
        aiActionsLlmEffort="none"
        aiActionsSelectedVectorStoreId=""
        aiActionVectorStoreOptions={[]}
        uploadedChatFiles={[]}
        isUploadingChatFiles={false}
        onActionTextChange={vi.fn()}
        onAiCommandQueryChange={vi.fn()}
        onTranslateLanguageChange={vi.fn()}
        onRetrieveSelectedText={vi.fn()}
        onApplyAction={vi.fn()}
        onAiActionsLlmModelChange={vi.fn()}
        onAiActionsLlmTemperatureChange={vi.fn()}
        onAiActionsLlmMaxOutputTokensChange={vi.fn()}
        onAiActionsLlmVerbosityChange={vi.fn()}
        onAiActionsLlmEffortChange={vi.fn()}
        onAiActionsSelectedVectorStoreIdChange={vi.fn()}
        onUploadFiles={vi.fn()}
        onRemoveUploadedFile={vi.fn()}
      />,
    );

    const textarea = screen.getByDisplayValue("Texto base");
    const submitButton = screen.getByRole("button", { name: /reescrever/i });

    expect(textarea.compareDocumentPosition(submitButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
