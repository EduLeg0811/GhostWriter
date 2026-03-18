import { CheckedState } from "@radix-ui/react-checkbox";
import { BookOpen, Database, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { sectionActionButtonClass } from "@/styles/buttonStyles";

type SourcesPanelView = "books" | "vector-store" | "upload" | null;

interface SourcesPanelProps {
  onSelectBooks: () => void;
  onSelectVectorStore: () => void;
  onUploadFiles: () => void;
  activeView: SourcesPanelView;
  bookSources: Array<{ id: string; label: string }>;
  selectedBookSourceIds: string[];
  onToggleBookSource: (id: string, checked: boolean) => void;
}

const SourcesPanel = ({
  onSelectBooks,
  onSelectVectorStore,
  onUploadFiles,
  activeView,
  bookSources,
  selectedBookSourceIds,
  onToggleBookSource,
}: SourcesPanelProps) => {
  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="flex h-full flex-col space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Fontes</p>
          <p className="text-xs text-muted-foreground">Selecione a origem do conhecimento para uso futuro.</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Button variant="ghost" className={sectionActionButtonClass} onClick={onSelectBooks}>
            <BookOpen className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block break-words text-sm font-medium text-foreground">Selecionar Livros</span>
            </span>
          </Button>

          <Button variant="ghost" className={sectionActionButtonClass} onClick={onSelectVectorStore}>
            <Database className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block break-words text-sm font-medium text-foreground">Selecionar Vector Store</span>
            </span>
          </Button>

          <Button variant="ghost" className={sectionActionButtonClass} onClick={onUploadFiles}>
            <Upload className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block break-words text-sm font-medium text-foreground">Upload Arquivos</span>
            </span>
          </Button>
        </div>

        <Separator />

        <div className="min-h-0 flex-1 space-y-3" aria-label="Dados-Fontes">
          {activeView === "books" ? (
            <>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados-Fontes</Label>
              <div className="space-y-2">
                {bookSources.map((source) => {
                  const checked = selectedBookSourceIds.includes(source.id);
                  return (
                    <label key={source.id} className="flex cursor-pointer items-start gap-2 px-1 py-1">
                      <Checkbox checked={checked} onCheckedChange={(value: CheckedState) => onToggleBookSource(source.id, value === true)} />
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block break-words text-xs font-medium text-foreground">{source.label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <Separator className="my-3" />
              <div className="min-h-0 flex-1" />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SourcesPanel;
