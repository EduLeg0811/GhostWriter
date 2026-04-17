import { useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Play, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { primaryActionButtonClass } from "@/styles/buttonStyles";
import { panelsTopMenuBarBgClass } from "@/styles/backgroundColors";
import type { SemanticIndexOption, SemanticSearchRagContext } from "@/features/ghost-writer/types";

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
  useRagContext: boolean;
  ragContext: SemanticSearchRagContext | null;
  selectedVectorStoreLabel: string;
  onQueryChange: (value: string) => void;
  onMaxResultsChange: (value: number) => void;
  onMinScoreChange: (value: number) => void;
  onUseRagContextChange: (value: boolean) => void;
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
  useRagContext,
  ragContext,
  selectedVectorStoreLabel,
  onQueryChange,
  onMaxResultsChange,
  onMinScoreChange,
  onUseRagContextChange,
  onRunSearch,
  isRunning,
  onClose,
  showPanelChrome = true,
}: SemanticSearchPanelProps) => {
  const queryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedIndex = availableIndexes.find((item) => item.id === selectedIndexId) ?? null;
  const currentQuery = query.trim();
  const visibleRagContext = ragContext && (ragContext.sourceQuery || "").trim() === currentQuery ? ragContext : null;

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

        <div className="space-y-2 rounded-lg border border-border/60 bg-slate-50/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RAG Conscienciológico</Label>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Usa o vector store atual das Configurações para contextualizar a query antes do embedding.
              </p>
            </div>
            <Switch checked={useRagContext} onCheckedChange={onUseRagContextChange} />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Vector store atual: {selectedVectorStoreLabel || "nenhum selecionado"}
          </p>
          {useRagContext ? (
            visibleRagContext ? (
              <div className="space-y-2 rounded-md border border-blue-100 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-900">
                  Contexto aplicado na ultima busca
                </p>
                {visibleRagContext.error ? (
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    A pré-busca conscienciológica falhou e a busca seguiu apenas com a query normal: {visibleRagContext.error}
                  </p>
                ) : null}
                {visibleRagContext.keyTerms.length > 0 ? (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Termos-chave:</span> {visibleRagContext.keyTerms.join(", ")}
                  </p>
                ) : null}
                {visibleRagContext.definitions.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-foreground">Definições:</p>
                    <div className="space-y-1">
                      {visibleRagContext.definitions.map((item) => (
                        <p key={`${item.term}:${item.meaning}`} className="text-[11px] leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">{item.term}:</span> {item.meaning}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {visibleRagContext.relatedTerms.length > 0 ? (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Termos adicionais:</span> {visibleRagContext.relatedTerms.join(", ")}
                  </p>
                ) : null}
                {visibleRagContext.disambiguatedQuery ? (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Query expandida:</span> {visibleRagContext.disambiguatedQuery}
                  </p>
                ) : null}
                {visibleRagContext.references.length > 0 ? (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Referências RAG:</span> {visibleRagContext.references.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Execute a busca para visualizar quais definições e termos adicionais foram usados na expansão da query.
              </p>
            )
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Etapa desabilitada. A busca usa apenas a query digitada e as expansões semânticas locais.
            </p>
          )}
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
