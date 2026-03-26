import { useRef } from "react";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { sectionActionButtonClass } from "@/styles/buttonStyles";
import type { UploadedLlmFile } from "@/lib/openai";

interface SourcesPanelProps {
  onUploadFiles: (files: File[]) => void;
  bookSources: Array<{ id: string; label: string }>;
  vectorStoreSources: Array<{ id: string; label: string }>;
  selectedBookSourceIds: string[];
  onToggleBookSource: (id: string, checked: boolean) => void;
  uploadedFiles: UploadedLlmFile[];
  onRemoveUploadedFile: (id: string) => void;
  isUploadingFiles?: boolean;
}

const SourcesPanel = ({
  onUploadFiles,
  bookSources,
  vectorStoreSources,
  selectedBookSourceIds,
  onToggleBookSource,
  uploadedFiles,
  onRemoveUploadedFile,
  isUploadingFiles = false,
}: SourcesPanelProps) => {
  const uploadInputRef = useRef<HTMLInputElement>(null);
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
    <div className="h-full overflow-y-auto p-3">
      <div className="flex h-full flex-col space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Fontes</p>
          <p className="text-xs text-muted-foreground">Selecione a origem do conhecimento da LLM.</p>
        </div>

        <Separator />

        <div className="min-h-0 flex-1 space-y-3" aria-label="Dados-Fontes">
          <>
            {/*<Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados-Fontes</Label>*/}
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

              <div className="py-3">
                <Separator />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Arquivos Anexados</p>
                <Button
                  variant="ghost"
                  className={sectionActionButtonClass}
                  onClick={() => {
                    uploadInputRef.current?.click();
                  }}
                >
                  <Upload className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block break-words text-sm font-medium text-foreground">Upload Arquivos</span>
                  </span>
                </Button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onClick={(event) => {
                    event.currentTarget.value = "";
                  }}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length > 0) onUploadFiles(files);
                  }}
                />
                {isUploadingFiles ? (
                  <div className="rounded border border-border bg-white px-2 py-2 text-xs text-muted-foreground">
                    Enviando arquivos para a OpenAI...
                  </div>
                ) : null}
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="rounded border border-border bg-white px-2 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-xs font-medium text-foreground">{file.filename}</p>
                            <p className="text-[11px] text-muted-foreground">{file.bytes} bytes</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => onRemoveUploadedFile(file.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-border bg-white px-2 py-2 text-xs text-muted-foreground">
                    Nenhum arquivo anexado
                  </div>
                )}
              </div>
            </div>
            <div className="py-2">
              <Separator />
            </div>
            <div className="min-h-0 flex-1" />
          </>
        </div>
      </div>
    </div>
  );
};

export default SourcesPanel;
