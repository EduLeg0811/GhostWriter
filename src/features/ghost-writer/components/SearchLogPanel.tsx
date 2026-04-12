import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, Search, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchLexicalOverviewProgress,
  fetchSemanticOverviewProgress,
  type SemanticOverviewProgressEvent,
  type SemanticOverviewProgressSnapshot,
} from "@/lib/backend-api";
import { panelsTopMenuBarBgClass } from "@/styles/backgroundColors";

const statusStyles: Record<SemanticOverviewProgressSnapshot["status"], { chip: string; label: string }> = {
  idle: { chip: "bg-slate-100 text-slate-700 ring-slate-200", label: "Idle" },
  running: { chip: "bg-emerald-100 text-emerald-800 ring-emerald-200", label: "Running" },
  completed: { chip: "bg-blue-100 text-blue-800 ring-blue-200", label: "Completed" },
  error: { chip: "bg-rose-100 text-rose-800 ring-rose-200", label: "Error" },
};

const stageStyles: Record<string, string> = {
  started: "border-blue-200 bg-blue-50/80",
  index_started: "border-emerald-200 bg-emerald-50/80",
  index_completed: "border-sky-200 bg-sky-50/80",
  index_skipped: "border-amber-200 bg-amber-50/80",
  completed: "border-blue-200 bg-blue-50/80",
  error: "border-rose-200 bg-rose-50/80",
};

const initialProgress: SemanticOverviewProgressSnapshot = {
  status: "idle",
  events: [],
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
};

const formatScore = (value?: number | null): string => (typeof value === "number" ? value.toFixed(2) : "-");

const formatStageLabel = (stage: string): string => {
  switch (stage) {
    case "index_completed":
      return "resultado";
    case "index_skipped":
      return "sem achados";
    case "index_started":
      return "em andamento";
    case "started":
      return "inicio";
    case "completed":
      return "concluido";
    case "error":
      return "erro";
    default:
      return stage.replace(/_/g, " ");
  }
};

const buildTimelineEntries = (events: SemanticOverviewProgressEvent[]) => {
  const relevantStages = new Set(["index_completed", "index_skipped", "error", "completed"]);
  return events.filter((event) => relevantStages.has(event.stage));
};

interface SearchLogPanelProps {
  onClose?: () => void;
  shouldPoll?: boolean;
  activeSearchType?: "semantic_overview" | "lexical_overview" | null;
  embedded?: boolean;
}

const getSnapshotRank = (snapshot: SemanticOverviewProgressSnapshot | null | undefined): number => {
  if (!snapshot) return -1;
  if (snapshot.status === "running") return 3;
  if (snapshot.status === "error") return 2;
  if (snapshot.status === "completed") return 1;
  return 0;
};

const getSnapshotTime = (snapshot: SemanticOverviewProgressSnapshot | null | undefined): number => {
  const raw = snapshot?.updatedAt || snapshot?.finishedAt || snapshot?.startedAt || "";
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
};

const chooseProgressSnapshot = (
  semantic: SemanticOverviewProgressSnapshot,
  lexical: SemanticOverviewProgressSnapshot,
  activeSearchType: "semantic_overview" | "lexical_overview" | null,
): SemanticOverviewProgressSnapshot => {
  if (activeSearchType === "lexical_overview" && lexical.status !== "idle") return lexical;
  if (activeSearchType === "semantic_overview" && semantic.status !== "idle") return semantic;
  const ranked = [semantic, lexical].sort((a, b) => {
    const rankDiff = getSnapshotRank(b) - getSnapshotRank(a);
    if (rankDiff !== 0) return rankDiff;
    return getSnapshotTime(b) - getSnapshotTime(a);
  });
  return ranked[0] || semantic;
};

const SearchLogPanel = ({ onClose, shouldPoll = false, activeSearchType = null, embedded = false }: SearchLogPanelProps) => {
  const [progress, setProgress] = useState<SemanticOverviewProgressSnapshot>(initialProgress);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    const refresh = async () => {
      try {
        setIsRefreshing(true);
        const [semanticData, lexicalData] = await Promise.all([
          fetchSemanticOverviewProgress(),
          fetchLexicalOverviewProgress(),
        ]);
        if (cancelled) return;
        setProgress(chooseProgressSnapshot(
          semanticData.result || { ...initialProgress, searchType: "semantic_overview" },
          lexicalData.result || { ...initialProgress, searchType: "lexical_overview" },
          activeSearchType,
        ));
        setLoadError(null);
      } catch (error: unknown) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Falha ao carregar Search Log.");
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    };

    void refresh();
    if (shouldPoll) {
      intervalId = window.setInterval(() => {
        void refresh();
      }, 900);
    }

    return () => {
      cancelled = true;
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [activeSearchType, shouldPoll]);

  const statusMeta = statusStyles[progress.status];
  const processedIndexes = Number(progress.processedIndexes || 0);
  const totalIndexes = Number(progress.totalIndexes || 0);
  const isLexical = progress.searchType === "lexical_overview";
  const overviewTitle = isLexical ? "Lexical Overview Monitor" : "Semantic Overview Monitor";
  const overviewSubtitle = isLexical
    ? "Varredura léxica"
    : "Varredura semântica";
  const processedLabel = isLexical ? "Fontes" : "Bases";
  const timelineEntries = buildTimelineEntries(progress.events);
  const statusMessage = loadError || progress.error || progress.message || "Sem atividade recente.";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/40">
      {!embedded ? (
        <div className={`flex items-center justify-between border-b border-border ${panelsTopMenuBarBgClass} px-3 py-2`}>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold leading-none text-foreground">Search Log</h2>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">Monitor em tempo real</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusMeta.chip}`}>
              {statusMeta.label}
            </span>
            {onClose ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
                title="Fechar Search Log"
              >
                <X className="h-3 w-3" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="border-b border-border bg-white/60 px-3 py-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusMeta.chip}`}>
            {statusMeta.label}
          </span>
        </div>
      )}

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-3">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">{overviewTitle}</p>
                    <p className="truncate text-[11px] text-slate-500">{overviewSubtitle}</p>
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-200">
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                {shouldPoll ? (isRefreshing ? "Atualizando" : "Polling") : "Parado"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-2 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Termo</p>
                <p className="max-w-[18rem] truncate text-[11px] font-medium text-slate-900">{progress.term || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-2 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{processedLabel}</p>
                <p className="text-[11px] font-medium text-slate-900">{processedIndexes}/{totalIndexes || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-2 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Achados</p>
                <p className="text-[11px] font-medium text-slate-900">{Number(progress.totalMatchesAccumulated || progress.totalFound || 0)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-2 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Top</p>
                <p className="text-[11px] font-medium text-slate-900">{formatScore(progress.topScore)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-700">{statusMessage}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.45)]">
              <div className="flex items-center gap-1.5">
                {progress.status === "error" ? (
                  <TriangleAlert className="h-3.5 w-3.5 text-rose-700" />
                ) : progress.status === "completed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-700" />
                ) : (
                  <Clock3 className="h-3.5 w-3.5 text-emerald-700" />
                )}
                <p className="text-xs font-semibold text-slate-900">Timeline</p>
              </div>

              <div className="mt-3 space-y-1.5">
                {timelineEntries.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-2.5 py-3 text-[11px] text-slate-500">
                    Nenhum resultado registrado ainda.
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {timelineEntries.map((event, index) => (
                        <li
                          key={`${event.at}-${event.stage}-${event.indexId || index}`}
                          className="border-b border-slate-200/70 pb-1 last:border-b-0 last:pb-0"
                        >
                          <span className="font-medium text-slate-900">
                            {(event.indexId || event.indexLabel || "overview").toUpperCase()}
                          </span>
                          <span>: </span>
                          <span>{typeof event.matchesFound === "number" ? `${event.matchesFound} achados` : formatStageLabel(event.stage)}</span>
                          {typeof event.totalMatchesAccumulated === "number" ? <span>{` | acumulado ${event.totalMatchesAccumulated}`}</span> : null}
                          {typeof event.topScore === "number" ? <span>{` | top ${event.topScore.toFixed(2)}`}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchLogPanel;
