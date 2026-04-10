import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Braces, FileText, Languages, Loader2, PenLine, Search, Settings } from "lucide-react";
import { sectionActionButtonClass } from "@/styles/buttonStyles";
import { panelsTopMenuBarBgClass } from "@/styles/backgroundColors";

interface LeftPanelProps {
  onOpenParameterSection: (section: "document" | "sources" | "actions" | "rewriting" | "translation" | "customized_prompts" | "ai_command" | "apps" | "applications") => void;
  onOpenVerbetografiaTable: () => void;
  onOpenBookSearch: () => void;
  onOpenSemanticSearch: () => void;
  onOpenVerbetografia: () => void;
  onToggleJsonPanel: () => void;
  isJsonPanelOpen: boolean;
  isLoading: boolean;
}

type LeftPanelActionId = "document" | "sources" | "actions" | "rewriting" | "translation" | "customized_prompts" | "ai_command" | "verbetografia_table" | "apps" | "applications";

const GHOST_VIDEO_PLAYBACK_RATE = 0.50;
const GHOST_VIDEO_REPLAY_DELAY_MS = 30000;
const GHOST_VIDEO_INITIAL_DELAY_MS = 15000;

const LeftPanel = ({
  onOpenParameterSection,
  onOpenVerbetografiaTable,
  onOpenBookSearch,
  onOpenSemanticSearch,
  onOpenVerbetografia,
  onToggleJsonPanel,
  isJsonPanelOpen,
  isLoading,
}: LeftPanelProps) => {
  const [activeActionId, setActiveActionId] = useState<LeftPanelActionId | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const actionDisabled = isLoading;

  useEffect(() => {
    if (!isLoading) setActiveActionId(null);
  }, [isLoading]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let replayTimeoutId: number | null = null;
    let cancelled = false;

    const scheduleReplay = (delayMs: number) => {
      if (cancelled) return;
      if (replayTimeoutId !== null) {
        window.clearTimeout(replayTimeoutId);
      }
      replayTimeoutId = window.setTimeout(() => {
        if (cancelled) return;
        video.currentTime = 0;
        video.playbackRate = GHOST_VIDEO_PLAYBACK_RATE;
        void video.play().catch(() => {
          scheduleReplay(GHOST_VIDEO_REPLAY_DELAY_MS);
        });
      }, delayMs);
    };

    const handleEnded = () => {
      video.pause();
      video.currentTime = 0;
      scheduleReplay(GHOST_VIDEO_REPLAY_DELAY_MS);
    };

    const handleLoadedMetadata = () => {
      video.playbackRate = GHOST_VIDEO_PLAYBACK_RATE;
      scheduleReplay(GHOST_VIDEO_INITIAL_DELAY_MS);
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      cancelled = true;
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      if (replayTimeoutId !== null) {
        window.clearTimeout(replayTimeoutId);
      }
      video.pause();
      video.currentTime = 0;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`border-b border-border ${panelsTopMenuBarBgClass} px-4 py-4`}>
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-sm font-semibold text-foreground">Parapreceptor  ●   Ghost Writer Editor</h1>
            <p className="text-[11px] text-muted-foreground">Toolbox de escrita conscienciológica.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/55 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm">
            <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
            <video
              ref={videoRef}
              src="/Ghost_Witter_v0.mp4"
              muted
              playsInline
              preload="metadata"
              className="block h-24 w-full object-cover object-center opacity-95"
              aria-label="Animação decorativa do Ghost Writer"
            />
          </div>
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documentos</Label>
            <Button
              variant="ghost"
              className={`${sectionActionButtonClass} border-0 shadow-none`}
              onClick={() => {
                setActiveActionId("document");
                onOpenParameterSection("document");
              }}
              disabled={actionDisabled}
              title="Documento"
              aria-label="Documento"
            >
              <FileText className="mr-2 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Documento</span>
                <span className="block break-words text-xs text-muted-foreground">Novo, abrir e editar documento</span>
              </span>
            </Button>
          </div>

          <Separator className="mx-[-1rem] my-3 h-[2px] w-[calc(100%+2rem)] bg-border/80" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lexicografia IA</Label>
            <div className="space-y-1.5">
              <Button
                variant="default"
                className={`${sectionActionButtonClass} border-0 shadow-none`}
                onClick={() => {
                  setActiveActionId("actions");
                  onOpenParameterSection("actions");
                }}
                disabled={actionDisabled}
              >
                {isLoading && activeActionId === "actions" ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <BookOpen className="mr-2 h-4 w-4 shrink-0 text-primary" />
                )}
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">Termos & Conceitos</span>
                  <span className="block break-words text-xs text-muted-foreground">Definir, Sinônimos, Etimologia, etc</span>
                </span>
              </Button>

              <Button
                variant="ghost"
                className={`${sectionActionButtonClass} border-0 shadow-none`}
                onClick={() => {
                  setActiveActionId("rewriting");
                  onOpenParameterSection("rewriting");
                }}
                disabled={actionDisabled}
              >
                {isLoading && activeActionId === "rewriting" ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <FileText className="mr-2 h-4 w-4 shrink-0 text-primary" />
                )}
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">Trechos & Parágrafos</span>
                  <span className="block break-words text-xs text-muted-foreground">Reescrever, Resumir, Epígrafe</span>
                </span>
              </Button>

              <Button
                variant="ghost"
                className={`${sectionActionButtonClass} border-0 shadow-none`}
                onClick={() => {
                  setActiveActionId("translation");
                  onOpenParameterSection("translation");
                }}
                disabled={actionDisabled}
              >
                {isLoading && activeActionId === "translation" ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <Languages className="mr-2 h-4 w-4 shrink-0 text-primary" />
                )}
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">Tradução & Dicionário</span>
                  <span className="block break-words text-xs text-muted-foreground">Traduzir texto e consultar termos</span>  
                </span>
              </Button>
            </div>

            <Button
              variant="ghost"
              className={`${sectionActionButtonClass} border-0 shadow-none`}
              onClick={() => {
                setActiveActionId("customized_prompts");
                onOpenParameterSection("customized_prompts");
              }}
              disabled={actionDisabled}
            >
              {isLoading && activeActionId === "customized_prompts" ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <PenLine className="mr-2 h-4 w-4 shrink-0 text-primary" />
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Customized Prompts</span>
                <span className="block break-words text-xs text-muted-foreground">Prompts customizados</span>
              </span>
            </Button>
          </div>

          <Separator className="mx-[-1rem] my-3 h-[2px] w-[calc(100%+2rem)] bg-border/80" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verbetografia IA</Label>

            <Button variant="ghost" className={`${sectionActionButtonClass} border-0 shadow-none`} onClick={onOpenVerbetografia} disabled={actionDisabled}>
              <FileText className="mr-2 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Seções do Verbete</span>
                <span className="block break-words text-xs text-muted-foreground">Escreve seções com auxílio da IA</span>
              </span>
            </Button>

            <Button
              variant="ghost"
              className={`${sectionActionButtonClass} border-0 shadow-none`}
              onClick={() => {
                setActiveActionId("verbetografia_table");
                onOpenVerbetografiaTable();
              }}
              disabled={actionDisabled}
            >
              {isLoading && activeActionId === "verbetografia_table" ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <FileText className="mr-2 h-4 w-4 shrink-0 text-primary" />
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Tabela Verbete</span>
                <span className="block break-words text-xs text-muted-foreground">Abre tabela Word e editor HTML</span>
              </span>
            </Button>
          </div>

          <Separator className="mx-[-1rem] my-3 h-[2px] w-[calc(100%+2rem)] bg-border/80" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ferramentas de Busca</Label>

            <Button variant="ghost" className={`${sectionActionButtonClass} border-0 shadow-none`} onClick={onOpenBookSearch} disabled={actionDisabled}>
              <Search className="mr-2 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Lexical Search</span>
                <span className="block break-words text-xs text-muted-foreground">Busca léxica nos livros e verbetes</span>
              </span>
            </Button>

            <Button variant="ghost" className={`${sectionActionButtonClass} border-0 shadow-none`} onClick={onOpenSemanticSearch} disabled={actionDisabled}>
              <Search className="mr-2 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Semantic Search</span>
                <span className="block break-words text-xs text-muted-foreground">Busca por afinidade semântica</span>
              </span>
            </Button>

            <Button
              variant="ghost"
              className={`${sectionActionButtonClass} border-0 shadow-none`}
              onClick={() => {
                setActiveActionId("apps");
                onOpenParameterSection("apps");
              }}
              disabled={actionDisabled}
            >
              {isLoading && activeActionId === "apps" ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <FileText className="mr-2 h-4 w-4 shrink-0 text-primary" />
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Bibliografia</span>
                <span className="block break-words text-xs text-muted-foreground">Busca as referências bibliográficas</span>
              </span>
            </Button>
          </div>

          <Separator className="mx-[-1rem] my-3 h-[2px] w-[calc(100%+2rem)] bg-border/80" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurações</Label>
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                className={`${sectionActionButtonClass} border-0 shadow-none`}
                onClick={() => {
                  setActiveActionId("sources");
                  onOpenParameterSection("sources");
                }}
                disabled={actionDisabled}
                title="LLM Sources"
                aria-label="LLM Sources"
              >
                <Settings className="mr-2 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">LLM Sources</span>
                  <span className="block break-words text-xs text-muted-foreground">Vector stores e arquivos</span>
                </span>
              </Button>
              <button
                type="button"
                onClick={onToggleJsonPanel}
                disabled={actionDisabled}
                title={isJsonPanelOpen ? "Ocultar JSON Logs" : "Mostrar JSON Logs"}
                aria-label={isJsonPanelOpen ? "Ocultar JSON Logs" : "Mostrar JSON Logs"}
                className="mt-2 inline-flex h-8 w-8 shrink-0 items-center justify-center text-primary transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Braces className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Separator className="mx-[-1rem] my-3 h-[2px] w-[calc(100%+2rem)] bg-border/80" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aplicativos</Label>
            <Button
              variant="ghost"
              className={`${sectionActionButtonClass} border-0 shadow-none`}
              onClick={() => {
                setActiveActionId("applications");
                onOpenParameterSection("applications");
              }}
              disabled={actionDisabled}
            >
              <FileText className="mr-2 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Abrir Apps</span>
                <span className="block break-words text-xs text-muted-foreground">Bibliomancia, Cons-IA e outros</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
