import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Play, X } from "lucide-react";
import { primaryActionButtonClass } from "@/styles/buttonStyles";
import { panelsTopMenuBarBgClass } from "@/styles/backgroundColors";
import { Switch } from "@/components/ui/switch";
import type { SemanticSearchRagContext } from "@/features/ghost-writer/types";

interface LexicalOverviewPanelProps {
  title: string;
  description: string;
  term: string;
  maxResults: number;
  minScore?: number;
  queryLabel?: string;
  useRagContext?: boolean;
  ragContext?: SemanticSearchRagContext | null;
  selectedVectorStoreLabel?: string;
  onTermChange: (value: string) => void;
  onMaxResultsChange: (value: number) => void;
  onMinScoreChange?: (value: number) => void;
  onUseRagContextChange?: (value: boolean) => void;
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
  minScore,
  queryLabel = "Termo",
  useRagContext,
  ragContext,
  selectedVectorStoreLabel,
  onTermChange,
  onMaxResultsChange,
  onMinScoreChange,
  onUseRagContextChange,
  onRunSearch,
  isRunning,
  onClose,
  showPanelChrome = true,
}: LexicalOverviewPanelProps) => {
  const termTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const currentQuery = term.trim();
  const visibleRagContext = ragContext && (ragContext.sourceQuery || "").trim() === currentQuery ? ragContext : null;

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

        {typeof minScore === "number" && onMinScoreChange ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score Min</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={Number.isFinite(minScore) ? minScore.toFixed(2) : "0.25"}
                onChange={(event) => {
                  const normalized = event.target.value.replace(",", ".").trim();
                  const raw = Number.parseFloat(normalized || "0");
                  const next = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0;
                  onMinScoreChange(next);
                }}
                className="h-8 bg-white !text-xs text-right"
              />
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Piso global. No Semantic Overview, cada base ainda aplica o score calibrado proprio quando ele for maior.
            </p>
          </div>
        ) : null}

        {typeof useRagContext === "boolean" && onUseRagContextChange ? (
          <div className="space-y-2 rounded-lg border border-border/60 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RAG Conscienciologico</Label>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Usa o vector store atual das Configuracoes para contextualizar a query antes do embedding.
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
                      A pre-busca conscienciologica falhou e a busca seguiu apenas com a query normal: {visibleRagContext.error}
                    </p>
                  ) : null}
                  {visibleRagContext.keyTerms.length > 0 ? (
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Termos-chave:</span> {visibleRagContext.keyTerms.join(", ")}
                    </p>
                  ) : null}
                  {visibleRagContext.definitions.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-foreground">Definicoes:</p>
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
                      <span className="font-semibold text-foreground">Referencias RAG:</span> {visibleRagContext.references.join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Execute a busca para visualizar quais definicoes e termos adicionais foram usados na expansao da query.
                </p>
              )
            ) : (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Etapa desabilitada. A busca usa apenas a query digitada e as expansoes semanticas locais.
              </p>
            )}
          </div>
        ) : null}

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
