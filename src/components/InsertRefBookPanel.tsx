import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Play, X } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { primaryActionButtonClass } from "@/styles/buttonStyles";

const REF_BOOK_OPTIONS = [
  "Projeções da Consciência",
  "Projeciologia",
  "700 Experimentos da Conscienciologia",
  "Conscienciograma",
  "Manual da Tenepes",
  "Manual da Proéxis",
  "Manual da Dupla Evolutiva",
  "Manual de Redação da Conscienciologia",
  "Manual dos Megapensenes",
  "Temas da Conscienciologia",
  "200 Teáticas da Conscienciologia",
  "Nossa Evolução",
  "Homo sapiens reurbanisatus (HSR)",
  "Homo sapiens pacificus (HSP)",
  "Dicionário de Neologismos",
  "Dicionário de Argumentos (DAC)",
  "Léxico de Ortopensatas (LO - 1a ed.)",
  "Léxico de Ortopensatas (LO - 2a ed.)",
  "Enciclopédia da Conscienciologia (10a ed.)",
  "Enciclopédia da Conscienciologia (novos verbetes)",
] as const;

interface InsertRefBookPanelProps {
  title: string;
  description: string;
  selectedRefBook: string;
  refBookPages: string;
  onSelectRefBook: (value: string) => void;
  onRefBookPagesChange: (value: string) => void;
  onRunInsertRefBook: () => void;
  isRunningInsertRefBook: boolean;
  onClose?: () => void;
  showPanelChrome?: boolean;
}

const InsertRefBookPanel = ({
  title,
  description,
  selectedRefBook,
  refBookPages,
  onSelectRefBook,
  onRefBookPagesChange,
  onRunInsertRefBook,
  isRunningInsertRefBook,
  onClose,
  showPanelChrome = true,
}: InsertRefBookPanelProps) => {
  const content = (
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
                <Play className="mr-2 h-4 w-4 text-black relative z-10" />
                <span className="relative z-10 text-blue-500">Bibliografia</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!showPanelChrome) return content;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--panel-header))] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar Parameters">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {content}
    </div>
  );
};

export default InsertRefBookPanel;