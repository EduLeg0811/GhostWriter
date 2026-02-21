import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Play, X } from "lucide-react";
import { primaryActionButtonClass } from "@/styles/buttonStyles";

interface VerbetografiaPanelProps {
  title: string;
  description: string;
  verbeteTitle: string;
  specialty: string;
  onVerbeteTitleChange: (value: string) => void;
  onSpecialtyChange: (value: string) => void;
  onOpenTable: () => void;
  isRunning: boolean;
  onClose?: () => void;
  showPanelChrome?: boolean;
}

const VerbetografiaPanel = ({
  title,
  description,
  verbeteTitle,
  specialty,
  onVerbeteTitleChange,
  onSpecialtyChange,
  onOpenTable,
  isRunning,
  onClose,
  showPanelChrome = true,
}: VerbetografiaPanelProps) => {
  const content = (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Label className="w-20 shrink-0 !text-xs font-semibold uppercase tracking-wider text-muted-foreground">Titulo</Label>
          <Input
            value={verbeteTitle}
            onChange={(e) => onVerbeteTitleChange(e.target.value)}
            className="h-9 w-full bg-white !text-xs"
            placeholder="Digite o titulo"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label className="w-20 shrink-0 !text-xs font-semibold uppercase tracking-wider text-muted-foreground">Especialid</Label>
          <Input
            value={specialty}
            onChange={(e) => onSpecialtyChange(e.target.value)}
            className="h-9 w-full bg-white !text-xs"
            placeholder="Digite a especialidade"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          className={primaryActionButtonClass}
          onClick={onOpenTable}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black relative z-10" />
              <span className="relative z-10 text-blue-500">Abrindo</span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4 text-black relative z-10" />
              <span className="relative z-10 text-blue-500">Abrir Tabela</span>
            </>
          )}
        </Button>
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

export default VerbetografiaPanel;
