import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import UploadedFilesList from "@/features/ghost-writer/components/UploadedFilesList";
import type { UploadedLlmFile } from "@/lib/openai";

interface AiAssistantConfigPanelProps {
  llmModel: string;
  onLlmModelChange: (value: string) => void;
  llmTemperature: number;
  onLlmTemperatureChange: (value: number) => void;
  llmMaxOutputTokens: number;
  onLlmMaxOutputTokensChange: (value: number) => void;
  llmVerbosity: string;
  onLlmVerbosityChange: (value: string) => void;
  llmEffort: string;
  onLlmEffortChange: (value: string) => void;
  selectedVectorStoreId: string;
  onSelectedVectorStoreIdChange: (value: string) => void;
  vectorStoreOptions: Array<{ id: string; label: string }>;
  onUploadFiles: (files: File[]) => void;
  uploadedFiles: UploadedLlmFile[];
  onRemoveUploadedFile: (id: string) => void;
  isUploadingFiles?: boolean;
  showVectorStore?: boolean;
  showUploadedFiles?: boolean;
  includeEditorContextInLlm?: boolean;
  onToggleIncludeEditorContextInLlm?: () => void;
  canToggleIncludeEditorContextInLlm?: boolean;
  extraContent?: React.ReactNode;
}

const AiAssistantConfigPanel = ({
  llmModel,
  onLlmModelChange,
  llmTemperature,
  onLlmTemperatureChange,
  llmMaxOutputTokens,
  onLlmMaxOutputTokensChange,
  llmVerbosity,
  onLlmVerbosityChange,
  llmEffort,
  onLlmEffortChange,
  selectedVectorStoreId,
  onSelectedVectorStoreIdChange,
  vectorStoreOptions,
  onUploadFiles,
  uploadedFiles,
  onRemoveUploadedFile,
  isUploadingFiles = false,
  showVectorStore = true,
  showUploadedFiles = true,
  includeEditorContextInLlm = false,
  onToggleIncludeEditorContextInLlm,
  canToggleIncludeEditorContextInLlm = true,
  extraContent,
}: AiAssistantConfigPanelProps) => (
  <div className="space-y-4">
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurações LLM</Label>
      <div className="flex items-center gap-2">
        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Modelo</Label>
        <select value={llmModel} onChange={(e) => onLlmModelChange(e.target.value)} className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none">
          <option value="gpt-4.1-mini">gpt-4.1-mini</option>
          <option value="gpt-5-mini">gpt-5-mini</option>
          <option value="gpt-5.2">gpt-5.2</option>
          <option value="gpt-5.4">gpt-5.4</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Temperatura</Label>
        <Input type="number" step="0.1" min="0" max="2" value={llmTemperature} onChange={(e) => onLlmTemperatureChange(Number(e.target.value))} className="h-8 text-[11px]" />
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Output Tokens</Label>
        <Input type="number" min="1" value={llmMaxOutputTokens} onChange={(e) => onLlmMaxOutputTokensChange(e.target.value ? Number(e.target.value) : 500)} className="h-8 text-[11px]" />
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Verbosity</Label>
        <Input value={llmVerbosity} onChange={(e) => onLlmVerbosityChange(e.target.value)} placeholder="low | medium | high" className="h-8 text-[11px]" />
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Effort</Label>
        <Input value={llmEffort} onChange={(e) => onLlmEffortChange(e.target.value)} placeholder="none | low | medium | high" className="h-8 text-[11px]" />
      </div>
      {showVectorStore ? (
        <div className="space-y-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vector Store</Label>
          <select
            value={selectedVectorStoreId}
            onChange={(e) => onSelectedVectorStoreIdChange(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none"
          >
            <option value="">none</option>
            {vectorStoreOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {extraContent}
      {typeof onToggleIncludeEditorContextInLlm === "function" ? (
        <div className="pt-1">
          <Button
            type="button"
            variant="ghost"
            className={`h-9 w-full justify-start rounded-lg border border-border px-3 text-left text-[11px] font-semibold shadow-sm ${
              includeEditorContextInLlm
                ? "bg-pink-200 text-pink-800 ring-1 ring-pink-300/80 hover:bg-pink-300 hover:text-pink-900"
                : "bg-white text-muted-foreground hover:bg-zinc-50 hover:text-foreground"
            }`}
            title={canToggleIncludeEditorContextInLlm ? (includeEditorContextInLlm ? "Desativar envio do texto do editor para a LLM" : "Ativar envio do texto do editor para a LLM") : "Disponivel apenas com documento aberto no editor"}
            onClick={onToggleIncludeEditorContextInLlm}
            disabled={!canToggleIncludeEditorContextInLlm}
          >
            <Paperclip className="mr-2 h-3.5 w-3.5 shrink-0" />
            <span>Enviar texto do editor</span>
          </Button>
        </div>
      ) : null}
    </div>
    {showUploadedFiles ? (
      <>
        <Separator />
        <UploadedFilesList
          onUploadFiles={onUploadFiles}
          uploadedFiles={uploadedFiles}
          onRemoveUploadedFile={onRemoveUploadedFile}
          isUploadingFiles={isUploadingFiles}
        />
      </>
    ) : null}
  </div>
);

export default AiAssistantConfigPanel;
