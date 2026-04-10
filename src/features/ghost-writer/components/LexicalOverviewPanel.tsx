import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, X } from "lucide-react";
import { primaryActionButtonClass } from "@/styles/buttonStyles";
import { panelsTopMenuBarBgClass } from "@/styles/backgroundColors";

interface LexicalOverviewPanelProps {
  title: string;
  description: string;
  term: string;
  maxResults: number;
  queryLabel?: string;
  onTermChange: (value: string) => void;
  onMaxResultsChange: (value: number) => void;
  onRunSearch: () => void;
  isRunning: boolean;
  onClose?: () => void;
  showPanelChrome?: boolean;
}

const LexicalOverviewPanel = ({
  title,
  description,
  term,
  maxResults,
  queryLabel = "Termo",
  onTermChange,
  onMaxResultsChange,
  onRunSearch,
  isRunning,
  onClose,
  showPanelChrome = true,
}: LexicalOverviewPanelProps) => {
  const termTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTermTextarea = () => {
    const el = termTextareaRef.current;
    if (!el) return;
    el.style.height = "72px";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resizeTermTextarea();
  }, [term]);

  const content = (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
      <div className="space-y-5">
        {showPanelChrome ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        ) : null}

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{queryLabel}</Label>
          <Textarea
            ref={termTextareaRef}
            className="min-h-[72px] resize-none rounded-md border border-input bg-white px-3 py-2 text-xs leading-relaxed text-foreground"
            rows={3}
            value={term}
            onChange={(event) => {
              onTermChange(event.target.value);
              resizeTermTextarea();
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Limite</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={String(maxResults)}
            onChange={(event) => {
              const raw = Number.parseInt(event.target.value || "1", 10);
              const next = Number.isFinite(raw) ? Math.max(1, Math.min(100, raw)) : 1;
              onMaxResultsChange(next);
            }}
            className="h-8 bg-white !text-xs text-right"
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
                <span className="relative z-10 text-blue-500">Buscar</span>
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
      <div className={`flex items-center justify-between border-b border-border ${panelsTopMenuBarBgClass} px-4 py-3`}>
        <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar Parameters">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {content}
    </div>
  );
};

export default LexicalOverviewPanel;
