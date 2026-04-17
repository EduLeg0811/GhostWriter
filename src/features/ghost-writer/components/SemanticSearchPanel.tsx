import { useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Play, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { primaryActionButtonClass } from "@/styles/buttonStyles";
import { panelsTopMenuBarBgClass } from "@/styles/backgroundColors";
import type { SemanticIndexOption } from "@/features/ghost-writer/types";

interface SemanticSearchPanelProps {
  title: string;
  description: string;
  selectedIndexId: string;
  availableIndexes: SemanticIndexOption[];
  isLoadingIndexes: boolean;
  onSelectedIndexChange: (value: string) => void;
  query: string;
  maxResults: number;
  minScore: number;
  onQueryChange: (value: string) => void;
  onMaxResultsChange: (value: number) => void;
  onMinScoreChange: (value: number) => void;
  onRunSearch: () => void;
  isRunning: boolean;
  onClose?: () => void;
  showPanelChrome?: boolean;
}

const SemanticSearchPanel = ({
  title,
  description,
  selectedIndexId,
  availableIndexes,
  isLoadingIndexes,
  onSelectedIndexChange,
  query,
  maxResults,
  minScore,
  onQueryChange,
  onMaxResultsChange,
  onMinScoreChange,
  onRunSearch,
  isRunning,
  onClose,
  showPanelChrome = true,
}: SemanticSearchPanelProps) => {
  const queryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedIndex = availableIndexes.find((item) => item.id === selectedIndexId) ?? null;

  const resizeQueryTextarea = () => {
    const el = queryTextareaRef.current;
    if (!el) return;
    el.style.height = "72px";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resizeQueryTextarea();
  }, [query]);

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
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Query</Label>
          <Textarea
            ref={queryTextareaRef}
            className="min-h-[72px] resize-none rounded-md border border-input bg-white px-3 py-2 text-xs leading-relaxed text-foreground"
            rows={3}
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              resizeQueryTextarea();
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Limite</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={String(maxResults)}
            onChange={(e) => {
              const raw = Number.parseInt(e.target.value || "10", 10);
              const next = Number.isFinite(raw) ? Math.max(1, Math.min(50, raw)) : 10;
              onMaxResultsChange(next);
            }}
            className="h-8 bg-white !text-xs text-right"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score Min</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={Number.isFinite(minScore) ? minScore.toFixed(2) : "0.25"}
            onChange={(e) => {
              const normalized = e.target.value.replace(",", ".").trim();
              const raw = Number.parseFloat(normalized || "0");
              const next = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0;
              onMinScoreChange(next);
            }}
            className="h-8 bg-white !text-xs text-right"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base Vetorial</Label>
          <Select value={selectedIndexId} onValueChange={onSelectedIndexChange} disabled={isLoadingIndexes || availableIndexes.length <= 0}>
            <SelectTrigger className="h-9 bg-white text-xs">
              <SelectValue placeholder={isLoadingIndexes ? "Carregando bases..." : "Selecione uma base"} />
            </SelectTrigger>
            <SelectContent>
              {availableIndexes.map((item) => (
                <SelectItem key={item.id} value={item.id} className="text-xs">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedIndex ? (
            <div className="space-y-1">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {selectedIndex.sourceRows} itens | {selectedIndex.model} | {selectedIndex.dimensions} dims | {selectedIndex.embeddingDtype}
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Score recomendado para esta base: {selectedIndex.suggestedMinScore.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {isLoadingIndexes ? "Carregando indices semanticos disponiveis." : "Nenhum indice semantico disponivel."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className={primaryActionButtonClass}
            onClick={onRunSearch}
            disabled={isRunning || !selectedIndexId}
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

export default SemanticSearchPanel;
