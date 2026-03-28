import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sectionActionButtonClass } from "@/styles/buttonStyles";
import type { UploadedLlmFile } from "@/lib/openai";

interface UploadedFilesListProps {
  title?: string;
  onUploadFiles: (files: File[]) => void;
  uploadedFiles: UploadedLlmFile[];
  onRemoveUploadedFile: (id: string) => void;
  isUploadingFiles?: boolean;
  buttonLabel?: string;
}

const UploadedFilesList = ({
  title = "Arquivos Anexados",
  onUploadFiles,
  uploadedFiles,
  onRemoveUploadedFile,
  isUploadingFiles = false,
  buttonLabel = "Upload Arquivos",
}: UploadedFilesListProps) => {
  const uploadInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <Button
        variant="ghost"
        className={sectionActionButtonClass}
        onClick={() => {
          uploadInputRef.current?.click();
        }}
      >
        <Upload className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
        <span className="min-w-0 flex-1 text-left">
          <span className="block break-words text-sm font-medium text-foreground">{buttonLabel}</span>
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
        <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
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
  );
};

export default UploadedFilesList;
