import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, Loader2, X } from "lucide-react";
import { DEFAULT_MARKDOWN_PLACEHOLDER_HTML, renderBasicMarkdown } from "@/lib/markdown";
import { primaryActionButtonClass } from "@/styles/buttonStyles";

interface BiblioGeralPanelProps {
  title: string;
  description: string;
  author: string;
  titleField: string;
  year: string;
  extra: string;
  onAuthorChange: (value: string) => void;
  onTitleFieldChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onExtraChange: (value: string) => void;
  onRun: () => void;
  resultMarkdown: string;
  isRunning: boolean;
  onClose: () => void;
}

const BiblioGeralPanel = ({
  title,
  description,
  author,
  titleField,
  year,
  extra,
  onAuthorChange,
  onTitleFieldChange,
  onYearChange,
  onExtraChange,
  onRun,
  resultMarkdown,
  isRunning,
  onClose,
}: BiblioGeralPanelProps) => {
  const resultHtml = useMemo(
    () => (resultMarkdown ? renderBasicMarkdown(resultMarkdown) : DEFAULT_MARKDOWN_PLACEHOLDER_HTML),
    [resultMarkdown],
  );
  const canRun = (author.trim() || titleField.trim() || year.trim() || extra.trim()) && !isRunning;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--panel-header))] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar Parameters">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Label className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Autor</Label>
            <Input value={author} onChange={(e) => onAuthorChange(e.target.value)} className="h-8 text-xs bg-white" />
          </div>

          <div className="flex items-center gap-2">
            <Label className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Titulo</Label>
            <Input value={titleField} onChange={(e) => onTitleFieldChange(e.target.value)} className="h-8 text-xs bg-white" />
          </div>

          <div className="flex items-center gap-2">
            <Label className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ano</Label>
            <Input value={year} onChange={(e) => onYearChange(e.target.value)} className="h-8 text-xs bg-white" />
          </div>

          <div className="flex items-center gap-2">
            <Label className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Extra</Label>
            <Input value={extra} onChange={(e) => onExtraChange(e.target.value)} className="h-8 text-xs bg-white" />
          </div>

          <Button variant="secondary" size="sm" className={primaryActionButtonClass} onClick={onRun} disabled={!canRun}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-black relative z-10" />
                <span className="relative z-10 text-blue-500">Buscando</span>
              </>
            ) : (
              <>
                <ArrowDown className="mr-1 h-3.5 w-3.5 text-black relative z-10" />
                <span className="relative z-10 text-blue-500">Bibliografia</span>
              </>
            )}
          </Button>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bibliografia</Label>
            <div
              className="min-h-20 rounded-md border border-input bg-white px-3 py-2 text-xs leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: resultHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiblioGeralPanel;
