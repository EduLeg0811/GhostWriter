import AiActionParametersPanel from "@/features/ghost-writer/components/AiActionParametersPanel";
import AiAssistantConfigPanel from "@/features/ghost-writer/components/AiAssistantConfigPanel";
import { parameterActionMeta } from "@/features/ghost-writer/config/metadata";
import { TRANSLATE_LANGUAGE_OPTIONS } from "@/features/ghost-writer/config/options";
import type { AiActionId, AiPanelScope, SelectOption } from "@/features/ghost-writer/types";
import type { UploadedLlmFile } from "@/lib/openai";

interface AiActionsParameterSectionProps {
  section: AiPanelScope;
  actionId: AiActionId | null;
  isAiCommandSelectionPending: boolean;
  actionText: string;
  aiCommandQuery: string;
  translateLanguage: (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"];
  isLoading: boolean;
  hasDocumentOpen: boolean;
  isConfigOpen: boolean;
  aiActionsLlmModel: string;
  aiActionsLlmTemperature: number;
  aiActionsLlmMaxOutputTokens: number;
  aiActionsLlmVerbosity: string;
  aiActionsLlmEffort: string;
  aiActionsSelectedVectorStoreId: string;
  aiActionVectorStoreOptions: SelectOption[];
  uploadedChatFiles: UploadedLlmFile[];
  isUploadingChatFiles: boolean;
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
  onAiActionsSelectedVectorStoreIdChange: (value: string) => void;
  onUploadFiles: (files: File[]) => void | Promise<void>;
  onRemoveUploadedFile: (fileId: string) => void;
}

const AiActionsParameterSection = ({
  section,
  actionId,
  isAiCommandSelectionPending,
  actionText,
  aiCommandQuery,
  translateLanguage,
  isLoading,
  hasDocumentOpen,
  isConfigOpen,
  aiActionsLlmModel,
  aiActionsLlmTemperature,
  aiActionsLlmMaxOutputTokens,
  aiActionsLlmVerbosity,
  aiActionsLlmEffort,
  aiActionsSelectedVectorStoreId,
  aiActionVectorStoreOptions,
  uploadedChatFiles,
  isUploadingChatFiles,
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
  onAiActionsSelectedVectorStoreIdChange,
  onUploadFiles,
  onRemoveUploadedFile,
}: AiActionsParameterSectionProps) => {
  const shouldShowActionPanel = Boolean(actionId) && !(actionId === "ai_command" && isAiCommandSelectionPending);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        {shouldShowActionPanel && actionId ? (
          <AiActionParametersPanel
            title={parameterActionMeta[actionId].title}
            description={parameterActionMeta[actionId].description}
            actionText={actionText}
            onActionTextChange={onActionTextChange}
            queryText={actionId === "ai_command" ? aiCommandQuery : undefined}
            onQueryTextChange={actionId === "ai_command" ? onAiCommandQueryChange : undefined}
            onRetrieveSelectedText={() => void onRetrieveSelectedText()}
            onApply={() => {
              void onApplyAction(actionId);
            }}
            isLoading={isLoading}
            hasDocumentOpen={hasDocumentOpen}
            showLanguageSelect={actionId === "translate" || section === "translation"}
            languageOptions={TRANSLATE_LANGUAGE_OPTIONS.map((option) => ({ ...option }))}
            selectedLanguage={translateLanguage}
            onSelectedLanguageChange={(value) => onTranslateLanguageChange(value as (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"])}
            showApplyButton
            showConfigButton={false}
            onToggleConfig={undefined}
            isConfigOpen={false}
            showActionTextArea={actionId !== "ai_command"}
            showPanelChrome={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground" />
        )}
      </div>
      {isConfigOpen ? (
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
};

export default AiActionsParameterSection;
