import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Play, X } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { primaryActionButtonClass } from "@/styles/buttonStyles";



export const BOOK_OPTION_LABELS: Record<string, string> = {
  
  "PROJ": "Projeciologia",
  "700EXP": "700 Experimentos da Conscienciologia",
  "CCG": "Conscienciograma",
  "200TEAT": "200 Teáticas da Conscienciologia",
  "TEMAS": "Temas da Conscienciologia",
  "TNP": "Manual da Tenepes",
  "PROEXIS": "Manual da Proéxis",
  "DUPLA": "Manual da Dupla Evolutiva",
  "HSR": "Homo sapiens reurbanisatus (HSR)",
  "HSP": "Homo sapiens pacificus (HSP)",
  "DAC": "Dicionário de Argumentos (DAC)",
  "LO": "Léxico de Ortopensatas (LO)",
  "QUEST": "Questionamentos das Minitertúlias",
};

interface BookSearchPanelProps {
  title: string;
  description: string;
  bookOptions: string[];
  selectedBook: string;
  term: string;
  maxResults: number;
  onSelectBook: (value: string) => void;
  onTermChange: (value: string) => void;
  onMaxResultsChange: (value: number) => void;
  onRunSearch: () => void;
  isRunning: boolean;
  onClose?: () => void;
  showPanelChrome?: boolean;
}

const BookSearchPanel = ({
  title,
  description,
  bookOptions,
  selectedBook,
  term,
  maxResults,
  onSelectBook,
  onTermChange,
  onMaxResultsChange,
  onRunSearch,
  isRunning,
  onClose,
  showPanelChrome = true,
}: BookSearchPanelProps) => {
  const orderedBookOptions = [
    ...Object.keys(BOOK_OPTION_LABELS).filter((key) => bookOptions.includes(key)),
    ...bookOptions.filter((option) => !(option in BOOK_OPTION_LABELS)),
  ];

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
            {orderedBookOptions.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                <input
                  type="radio"
                  name="book-search"
                  value={option}
                  checked={selectedBook === option}
                  onChange={() => onSelectBook(option)}
                />
                <span>{BOOK_OPTION_LABELS[option] ?? option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Termo</Label>
          <Textarea
            className="min-h-10 rounded-md border border-input bg-white px-3 py-1 text-xs leading-relaxed text-foreground"
            rows={2}
            value={term}
            onChange={(e) => onTermChange(e.target.value)}
            placeholder="Digite uma palavra ou termo"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Máximo de resultados</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={String(maxResults)}
            onChange={(e) => {
              const raw = Number.parseInt(e.target.value || "1", 10);
              const next = Number.isFinite(raw) ? Math.max(1, Math.min(100, raw)) : 1;
              onMaxResultsChange(next);
            }}
            className="h-9 text-xs bg-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className={primaryActionButtonClass}
            onClick={onRunSearch}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-black relative z-10" />
                <span className="relative z-10 text-blue-500">Buscando</span>
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4 text-black relative z-10" />
                <span className="relative z-10 text-blue-500">Pesquisar</span>
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

export default BookSearchPanel;
