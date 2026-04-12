import { Braces, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { panelsTopMenuBarBgClass } from "@/styles/backgroundColors";
import SourcesPanel from "@/features/ghost-writer/components/SourcesPanel";
import AiConfigsPanel from "@/features/ghost-writer/components/AiConfigsPanel";
import type { AppPanelScope, ConfigPanelTabId, ParameterPanelTarget, SelectOption } from "@/features/ghost-writer/types";
import type { UploadedLlmFile } from "@/lib/openai";
import type { ActionSystemPromptId } from "@/features/ghost-writer/config/actionSystemPrompts";
import { BOOK_SOURCE, VECTOR_STORES_SOURCE } from "@/features/ghost-writer/config/options";

interface ConfigsPanelProps {
  activeTab: ConfigPanelTabId;
  onTabChange: (tab: ConfigPanelTabId) => void;
  onClose: () => void;
  parameterPanelTarget: ParameterPanelTarget;
  appPanelScope: AppPanelScope | null;
  selectedBookSourceIds: string[];
  selectedChatSourceLabel: string;
  uploadedChatFiles: UploadedLlmFile[];
  isUploadingChatFiles: boolean;
  llmModel: string;
  llmTemperature: number;
  llmMaxOutputTokens: number;
  llmMaxNumResults: number;
  llmEditorContextMaxChars: number;
  llmVerbosity: string;
  llmEffort: string;
  llmSystemPrompt: string;
  includeEditorContextInLlm: boolean;
  currentFileId: string;
  aiActionsLlmModel: string;
  aiActionsLlmTemperature: number;
  aiActionsLlmMaxOutputTokens: number;
  aiActionsLlmVerbosity: string;
  aiActionsLlmEffort: string;
  aiActionSystemPrompts: Partial<Record<ActionSystemPromptId, string>>;
  aiActionsSelectedVectorStoreId: string;
  aiActionVectorStoreOptions: SelectOption[];
  isTermsConceptsConscienciografiaEnabled: boolean;
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
  onToggleIncludeEditorContextInLlm: () => void;
  onUploadSourceFiles: (files: File[]) => void | Promise<void>;
  onAiActionsLlmModelChange: (value: string) => void;
  onAiActionsLlmTemperatureChange: (value: number) => void;
  onAiActionsLlmMaxOutputTokensChange: (value: number) => void;
  onAiActionsLlmVerbosityChange: (value: string) => void;
  onAiActionsLlmEffortChange: (value: string) => void;
  onAiActionSystemPromptChange: (actionId: ActionSystemPromptId, value: string) => void;
  onAiActionsSelectedVectorStoreIdChange: (value: string) => void;
}

const tabButtonClass = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
    active
      ? "bg-white text-foreground shadow-sm ring-1 ring-border"
      : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
  }`;

const ConfigsPanel = ({
  activeTab,
  onTabChange,
  onClose,
  parameterPanelTarget,
  appPanelScope,
  selectedBookSourceIds,
  selectedChatSourceLabel,
  uploadedChatFiles,
  isUploadingChatFiles,
  llmModel,
  llmTemperature,
  llmMaxOutputTokens,
  llmMaxNumResults,
  llmEditorContextMaxChars,
  llmVerbosity,
  llmEffort,
  llmSystemPrompt,
  includeEditorContextInLlm,
  currentFileId,
  aiActionsLlmModel,
  aiActionsLlmTemperature,
  aiActionsLlmMaxOutputTokens,
  aiActionsLlmVerbosity,
  aiActionsLlmEffort,
  aiActionSystemPrompts,
  aiActionsSelectedVectorStoreId,
  aiActionVectorStoreOptions,
  isTermsConceptsConscienciografiaEnabled,
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
  onToggleIncludeEditorContextInLlm,
  onUploadSourceFiles,
  onAiActionsLlmModelChange,
  onAiActionsLlmTemperatureChange,
  onAiActionsLlmMaxOutputTokensChange,
  onAiActionsLlmVerbosityChange,
  onAiActionsLlmEffortChange,
  onAiActionSystemPromptChange,
  onAiActionsSelectedVectorStoreIdChange,
}: ConfigsPanelProps) => (
  <div className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/40">
    <div className={`flex items-center justify-between gap-3 border-b border-border ${panelsTopMenuBarBgClass} px-3 py-2.5`}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">Configs</h2>
        <p className="text-[11px] text-muted-foreground">Configuração</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className={tabButtonClass(activeTab === "sources")} onClick={() => onTabChange("sources")}>
          <Settings className="h-3.5 w-3.5" />
          <span>Chat</span>
        </button>
        <button type="button" className={tabButtonClass(activeTab === "ia")} onClick={() => onTabChange("ia")}>
          <Braces className="h-3.5 w-3.5" />
          <span>IA</span>
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar configs">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
    <div className="min-h-0 flex-1">
      {activeTab === "sources" ? (
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
      ) : (
        <AiConfigsPanel
          parameterPanelTarget={parameterPanelTarget}
          appPanelScope={appPanelScope}
          hasDocumentOpen={Boolean(currentFileId)}
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
          onAiActionsLlmModelChange={onAiActionsLlmModelChange}
          onAiActionsLlmTemperatureChange={onAiActionsLlmTemperatureChange}
          onAiActionsLlmMaxOutputTokensChange={onAiActionsLlmMaxOutputTokensChange}
          onAiActionsLlmVerbosityChange={onAiActionsLlmVerbosityChange}
          onAiActionsLlmEffortChange={onAiActionsLlmEffortChange}
          onAiActionSystemPromptChange={onAiActionSystemPromptChange}
          onToggleIncludeEditorContextInLlm={onToggleIncludeEditorContextInLlm}
          onAiActionsSelectedVectorStoreIdChange={onAiActionsSelectedVectorStoreIdChange}
          onUploadFiles={onUploadSourceFiles}
          onRemoveUploadedFile={onRemoveUploadedChatFile}
          onResetAllConfig={onResetAllConfig}
        />
      )}
    </div>
  </div>
);

export default ConfigsPanel;
