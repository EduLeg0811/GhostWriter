import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2, X } from "lucide-react";
import { DEFAULT_MARKDOWN_PLACEHOLDER_HTML, renderBasicMarkdown } from "@/lib/markdown";
import { Textarea } from "./ui/textarea";
import { primaryActionButtonClass } from "@/styles/buttonStyles";

const REF_BOOK_OPTIONS = [
  "Projeções da Consciência",
  "Projeciologia",
  "700 Experimentos",
  "Conscienciograma",
  "Tenepes",
  "Proéxis",
  "Dupla",
  "Redação",
  "Megapensenes",
  "Temas",
  "200 Teáticas",
  "Nossa Evolução",
  "HSR",
  "HSP",
  "Neologismos",
  "DAC",
  "LO (1a ed.)",
  "LO (2a ed.)",
  "Enciclopédia (10a ed.)",
  "Enciclopédia (novos verbetes)",
] as const;

interface InsertRefBookPanelProps {
  title: string;
  description: string;
  selectedRefBook: string;
  refBookPages: string;
  onSelectRefBook: (value: string) => void;
  onRefBookPagesChange: (value: string) => void;
  onRunInsertRefBook: () => void;
  onInsertResponseIntoEditor: () => void;
  insertRefBookResult: string;
  isRunningInsertRefBook: boolean;
  onClose: () => void;
}

const InsertRefBookPanel = ({
  title,
  description,
  selectedRefBook,
  refBookPages,
  onSelectRefBook,
  onRefBookPagesChange,
  onRunInsertRefBook,
  onInsertResponseIntoEditor,
  insertRefBookResult,
  isRunningInsertRefBook,
  onClose,
}: InsertRefBookPanelProps) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--panel-header))] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar Parameters">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Livro</Label>
            <div className="space-y-2">
              {REF_BOOK_OPTIONS.map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                  <input
                    type="radio"
                    name="insert-ref-book"
                    value={option}
                    checked={selectedRefBook === option}
                    onChange={() => onSelectRefBook(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Páginas (Opcional)</Label>
            <p className="text-xs text-muted-foreground">Separe por vírgula ou ponto-e-vírgula.</p>
            <Textarea
              className="min-h-10 rounded-md border border-input bg-white px-3 py-1 text-xs leading-relaxed text-foreground"
              rows={2}
              value={refBookPages}
              onChange={(e) => onRefBookPagesChange(e.target.value)}
              placeholder="Ex.: 10, 12-14; 20"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">

            <Button
              variant="secondary"
              size="sm"
              className={primaryActionButtonClass}
              onClick={onRunInsertRefBook}
              disabled={isRunningInsertRefBook}
            >
              {isRunningInsertRefBook ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-black relative z-10" />
                  <span className="relative z-10 text-blue-500">Executando</span>
                </>
              ) : (
                <>
                  <ArrowDown className="mr-1 h-3.5 w-3.5 text-black relative z-10" />
                  <span className="relative z-10 text-blue-500">Criar Referências</span>
                </>
              )}
            </Button>


           {/*  <Button
              variant="secondary"
              size="sm"
              className={primaryActionButtonClass}
              onClick={onInsertResponseIntoEditor}
              disabled={isRunningInsertRefBook}
            >
              <ArrowDown className="mr-1 h-3.5 w-3.5 text-black relative z-10" />
              <span className="relative z-10 text-blue-500">Inserir</span>
            </Button> */}


          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bibliografia</Label>
            <div
              className="min-h-10 rounded-md border border-input bg-white px-3 py-1 text-xs leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: insertRefBookResult ? renderBasicMarkdown(insertRefBookResult) : DEFAULT_MARKDOWN_PLACEHOLDER_HTML }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertRefBookPanel;
