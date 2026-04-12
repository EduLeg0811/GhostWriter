import AiActionParametersPanel from "@/features/ghost-writer/components/AiActionParametersPanel";
import { parameterActionMeta } from "@/features/ghost-writer/config/metadata";
import { TRANSLATE_LANGUAGE_OPTIONS } from "@/features/ghost-writer/config/options";
import type { ActionSystemPromptId } from "@/features/ghost-writer/config/actionSystemPrompts";
import type { AiActionId, AiPanelScope, SelectOption } from "@/features/ghost-writer/types";
import type { UploadedLlmFile } from "@/lib/openai";

interface AiActionsParameterSectionProps {
  section: AiPanelScope;
  actionId: AiActionId | null;
  actionText: string;
  aiCommandQuery: string;
  translateLanguage: (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"];
  isLoading: boolean;
  hasDocumentOpen: boolean;
  isConfigOpen: boolean;
  isTermsConceptsConscienciografiaEnabled: boolean;
  includeEditorContextInLlm: boolean;
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
  onAiActionsSelectedVectorStoreIdChange: (value: string) => void;
  onUploadFiles: (files: File[]) => void | Promise<void>;
  onRemoveUploadedFile: (fileId: string) => void;
}

const AiActionsParameterSection = ({
  actionId,
  actionText,
  aiCommandQuery,
  translateLanguage,
  isLoading,
  hasDocumentOpen,
  onActionTextChange,
  onAiCommandQueryChange,
  onTranslateLanguageChange,
  onRetrieveSelectedText,
  onApplyAction,
}: AiActionsParameterSectionProps) => {
  const shouldShowActionPanel = Boolean(actionId);

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
            showLanguageSelect={actionId === "translate"}
            languageOptions={TRANSLATE_LANGUAGE_OPTIONS.map((option) => ({ ...option }))}
            selectedLanguage={translateLanguage}
            onSelectedLanguageChange={(value) => onTranslateLanguageChange(value as (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"])}
            showApplyButton
            showConfigButton={false}
            onToggleConfig={undefined}
            isConfigOpen={false}
            showActionTextArea
            showPanelChrome={false}
          />
        ) : (
          <AiActionParametersPanel
            title=""
            description=""
            actionText={actionText}
            onActionTextChange={onActionTextChange}
            onRetrieveSelectedText={() => void onRetrieveSelectedText()}
            onApply={() => {}}
            isLoading={isLoading}
            hasDocumentOpen={hasDocumentOpen}
            showApplyButton={false}
            showConfigButton={false}
            isConfigOpen={false}
            showActionTextArea
            showPanelChrome={false}
          />
        )}
      </div>
    </div>
  );
};

export default AiActionsParameterSection;
