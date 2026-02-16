import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, Loader2, X } from "lucide-react";
import { DEFAULT_MARKDOWN_PLACEHOLDER_HTML, renderBasicMarkdown } from "@/lib/markdown";
import { primaryActionButtonClass } from "@/styles/buttonStyles";

interface InsertRefVerbetePanelProps {
  title: string;
  description: string;
  verbeteInput: string;
  onVerbeteInputChange: (value: string) => void;
  onRun: () => void;
  refListResult: string;
  refBiblioResult: string;
  isRunning: boolean;
  onClose: () => void;
}

const InsertRefVerbetePanel = ({
  title,
  description,
  verbeteInput,
  onVerbeteInputChange,
  onRun,
  refListResult,
  refBiblioResult,
  isRunning,
  onClose,
}: InsertRefVerbetePanelProps) => {
  const refListHtml = useMemo(() => (refListResult ? renderBasicMarkdown(refListResult) : DEFAULT_MARKDOWN_PLACEHOLDER_HTML), [refListResult]);
  const refBiblioHtml = useMemo(() => (refBiblioResult ? renderBasicMarkdown(refBiblioResult) : DEFAULT_MARKDOWN_PLACEHOLDER_HTML), [refBiblioResult]);
  const canRun = verbeteInput.trim().length > 0 && !isRunning;

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
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verbetes</Label>
            <p className="text-xs text-muted-foreground">Nomes dos verbetes separados por virgula ou ponto-e-virgula.</p>
            <Textarea
              className="min-h-40 rounded-md border border-input bg-white px-3 py-2 text-xs leading-relaxed text-foreground"
              rows={4}
              value={verbeteInput}
              onChange={(e) => onVerbeteInputChange(e.target.value)}
              placeholder="Ex.: Abertismo Consciencial, Consciex Livre, Localização"
            />
          </div>

          <Button 
          variant="secondary" 
          size="sm" 
          className={primaryActionButtonClass} 
          onClick={onRun} 
          disabled={!canRun}
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-black relative z-10" />
                <span className="relative z-10 text-blue-500">Inserindo</span>
              </>
            ) : (
              <>
              <ArrowDown className="mr-1 h-3.5 w-3.5 text-black relative z-10" />
              <span className="relative z-10 text-blue-500">Criar Referências</span>
              </>
            )}

          

          </Button>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Listagem Ordenada</Label>
            <div
              className="min-h-20 rounded-md border border-input bg-white px-3 py-2 text-xs leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: refListHtml }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bibliografia</Label>
            <div
              className="min-h-20 rounded-md border border-input bg-white px-3 py-2 text-xs leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: refBiblioHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertRefVerbetePanel;
