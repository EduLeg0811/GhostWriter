import { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Paperclip } from "lucide-react";
import type { UploadedLlmFile } from "@/lib/openai";
import UploadedFilesList from "@/features/ghost-writer/components/UploadedFilesList";

interface SourcesPanelProps {
  onUploadFiles: (files: File[]) => void;
  bookSources: Array<{ id: string; label: string }>;
  vectorStoreSources: Array<{ id: string; label: string }>;
  selectedBookSourceIds: string[];
  onToggleBookSource: (id: string, checked: boolean) => void;
  selectedChatSourceLabel: string;
  uploadedFiles: UploadedLlmFile[];
  onRemoveUploadedFile: (id: string) => void;
  isUploadingFiles?: boolean;
  llmModel: string;
  onLlmModelChange: (value: string) => void;
  llmTemperature: number;
  onLlmTemperatureChange: (value: number) => void;
  llmMaxOutputTokens: number;
  onLlmMaxOutputTokensChange: (value: number) => void;
  llmMaxNumResults: number;
  onLlmMaxNumResultsChange: (value: number) => void;
  llmEditorContextMaxChars: number;
  onLlmEditorContextMaxCharsChange: (value: number) => void;
  llmVerbosity: string;
  onLlmVerbosityChange: (value: string) => void;
  llmEffort: string;
  onLlmEffortChange: (value: string) => void;
  llmSystemPrompt: string;
  onLlmSystemPromptChange: (value: string) => void;
  includeEditorContextInLlm: boolean;
  onToggleIncludeEditorContextInLlm: () => void;
  canToggleIncludeEditorContextInLlm?: boolean;
}

const SourcesPanel = ({
  onUploadFiles,
  bookSources,
  vectorStoreSources,
  selectedBookSourceIds,
  onToggleBookSource,
  selectedChatSourceLabel,
  uploadedFiles,
  onRemoveUploadedFile,
  isUploadingFiles = false,
  llmModel,
  onLlmModelChange,
  llmTemperature,
  onLlmTemperatureChange,
  llmMaxOutputTokens,
  onLlmMaxOutputTokensChange,
  llmMaxNumResults,
  onLlmMaxNumResultsChange,
  llmEditorContextMaxChars,
  onLlmEditorContextMaxCharsChange,
  llmVerbosity,
  onLlmVerbosityChange,
  llmEffort,
  onLlmEffortChange,
  llmSystemPrompt,
  onLlmSystemPromptChange,
  includeEditorContextInLlm,
  onToggleIncludeEditorContextInLlm,
  canToggleIncludeEditorContextInLlm = true,
}: SourcesPanelProps) => {
  const sourceBooks = bookSources;

  const renderSourceItem = (source: { id: string; label: string }) => {
    const checked = selectedBookSourceIds.includes(source.id);
    return (
      <label key={source.id} className="flex cursor-pointer items-start gap-2 px-1 py-1">
        <Checkbox checked={checked} onCheckedChange={(value: CheckedState) => onToggleBookSource(source.id, value === true)} />
        <span className="min-w-0 flex-1 text-left">
          <span className="block break-words text-xs font-medium text-foreground">{source.label}</span>
        </span>
      </label>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col p-3">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Dados-Fontes">
        <div className="space-y-2">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Livros & Tratados</p>
            <div className="space-y-1">
              {sourceBooks.map(renderSourceItem)}
            </div>
          </div>

          <div className="py-3">
            <Separator />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vector Stores</p>
            <div className="space-y-1">
              {vectorStoreSources.map(renderSourceItem)}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border pt-3">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurações LLM Chat</Label>
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
              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Num Results</Label>
              <Input type="number" min="1" max="20" value={llmMaxNumResults} onChange={(e) => onLlmMaxNumResultsChange(e.target.value ? Number(e.target.value) : 5)} className="h-8 text-[11px]" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Context Max Chars</Label>
              <Input type="number" min="500" value={llmEditorContextMaxChars} onChange={(e) => onLlmEditorContextMaxCharsChange(e.target.value ? Number(e.target.value) : 10000)} className="h-8 text-[11px]" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Verbosity</Label>
              <Input value={llmVerbosity} onChange={(e) => onLlmVerbosityChange(e.target.value)} placeholder="low | medium | high" className="h-8 text-[11px]" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPT-5 Effort</Label>
              <Input value={llmEffort} onChange={(e) => onLlmEffortChange(e.target.value)} placeholder="minimal | low | medium | high" className="h-8 text-[11px]" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vector Store</Label>
              <div className="flex min-h-8 w-full items-center rounded-md border border-input bg-muted/30 px-3 text-[11px] text-foreground">
                {selectedChatSourceLabel}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">System Prompt</Label>
              <textarea value={llmSystemPrompt} onChange={(e) => onLlmSystemPromptChange(e.target.value)} rows={8} className="w-full resize-none overflow-y-auto rounded-md border border-input bg-white px-3 py-2 text-[11px] text-foreground outline-none" />
            </div>
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                className={`h-9 w-full justify-start rounded-lg border border-border px-3 text-left text-[11px] font-semibold shadow-sm ${
                  includeEditorContextInLlm
                    ? "bg-pink-200 text-pink-800 ring-1 ring-pink-300/80 hover:bg-pink-300 hover:text-pink-900"
                    : "bg-white text-muted-foreground hover:bg-zinc-50 hover:text-foreground"
                }`}
                title={canToggleIncludeEditorContextInLlm ? (includeEditorContextInLlm ? "Desativar envio do texto do editor para a LLM" : "Ativar envio do texto do editor para a LLM") : "Disponível apenas com documento aberto no editor"}
                onClick={onToggleIncludeEditorContextInLlm}
                disabled={!canToggleIncludeEditorContextInLlm}
              >
                <Paperclip className="mr-2 h-3.5 w-3.5 shrink-0" />
                <span>Enviar texto do Editor</span>
              </Button>
            </div>
          </div>

          <Separator />

          <UploadedFilesList
            onUploadFiles={onUploadFiles}
            uploadedFiles={uploadedFiles}
            onRemoveUploadedFile={onRemoveUploadedFile}
            isUploadingFiles={isUploadingFiles}
          />
        </div>
      </div>
    </div>
  );
};

export default SourcesPanel;
