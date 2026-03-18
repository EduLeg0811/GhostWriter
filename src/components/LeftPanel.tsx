import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Braces, ExternalLink, FileText, FolderOpen, Loader2, Search, Settings } from "lucide-react";
import { sectionActionButtonClass } from "@/styles/buttonStyles";
import { aiAppsSectionBgClass, cardsBgClass, panelsTopMenuBarBgClass } from "@/styles/backgroundColors";

interface LeftPanelProps {
  onOpenParameterSection: (section: "document" | "sources" | "actions" | "apps" | "settings") => void;
  onRunRandomPensata: () => Promise<void> | void;
  onOpenBookSearch: () => void;
  onOpenVerbetografia: () => void;
  onToggleJsonPanel: () => void;
  isJsonPanelOpen: boolean;
  isLoading: boolean;
}

type LeftPanelActionId = "document" | "sources" | "actions" | "apps" | "settings";

const LeftPanel = ({ onOpenParameterSection, onRunRandomPensata, onOpenBookSearch, onOpenVerbetografia, onToggleJsonPanel, isJsonPanelOpen, isLoading }: LeftPanelProps) => {
  const [activeActionId, setActiveActionId] = useState<LeftPanelActionId | null>(null);
  const actionDisabled = isLoading;

  useEffect(() => {
    if (!isLoading) setActiveActionId(null);
  }, [isLoading]);

  return (
    <div className="flex h-full flex-col">
      <div className={`border-b border-border ${panelsTopMenuBarBgClass} px-4 py-4`}>
        <h1 className="text-sm font-semibold text-foreground">Parapreceptor • Ghost Writer Editor</h1>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
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
            <Button
              variant="ghost"
              className={`${sectionActionButtonClass} border-0 shadow-none`}
              onClick={() => {
                setActiveActionId("sources");
                onOpenParameterSection("sources");
              }}
              disabled={actionDisabled}
              title="Fontes"
              aria-label="Fontes"
            >
              <FolderOpen className="mr-2 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block break-words text-sm font-medium text-foreground">Fontes</span>
                <span className="block break-words text-xs text-muted-foreground">Livros, vector store e arquivos</span>
              </span>
            </Button>
          </div>

          <Separator className="my-1" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ferramentas IA</Label>
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
                  <span className="block break-words text-sm font-medium text-foreground">Ações IA</span>
                  <span className="block break-words text-xs text-muted-foreground">Definir, Resumir, Traduzir e mais</span>
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
                  <span className="block break-words text-xs text-muted-foreground">Ferramentas de bibliografia</span>
                </span>
              </Button>

              <Button variant="ghost" className={`${sectionActionButtonClass} border-0 shadow-none`} onClick={onOpenBookSearch} disabled={actionDisabled}>
                <Search className="mr-2 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">Busca de Termos</span>
                  <span className="block break-words text-xs text-muted-foreground">Busca termos nos livros e verbetes</span>
                </span>
              </Button>

              <Button variant="ghost" className={`${sectionActionButtonClass} border-0 shadow-none`} onClick={onOpenVerbetografia} disabled={actionDisabled}>
                <FileText className="mr-2 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">Verbetografia</span>
                  <span className="block break-words text-xs text-muted-foreground">Tabela automatizada de verbete</span>
                </span>
              </Button>
            </div>
          </div>

          <Separator className="my-1" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurações</Label>
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                className={`${sectionActionButtonClass} border-0 shadow-none`}
                onClick={() => {
                  setActiveActionId("settings");
                  onOpenParameterSection("settings");
                }}
                disabled={actionDisabled}
                title="Configurações LLM"
                aria-label="Configurações LLM"
              >
                <Settings className="mr-2 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">LLM</span>
                  <span className="block break-words text-xs text-muted-foreground">Modelo e parâmetros</span>
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
        </div>
      </div>

      <div className={`space-y-3 border-t border-border ${aiAppsSectionBgClass} px-4 py-3`}>
        <div className="space-y-2.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aplicativos IA</Label>

          <div className="space-y-1.5">
            <Button
              variant="ghost"
              className={`${sectionActionButtonClass} group flex items-center justify-between rounded-xl border border-orange-200 ${cardsBgClass} px-4 py-2 text-blue-600 shadow-sm transition-all duration-200 hover:!bg-white hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.45),0_3px_8px_-4px_rgba(0,0,0,0.25)]`}
              onClick={() => void onRunRandomPensata()}
              disabled={actionDisabled}
            >
              <img src="/LO.png" alt="LO" className={`h-16 w-16 shrink-0 object-contain ${cardsBgClass}`} />
              <span className="min-w-0 flex-1 text-left">
                <span className="text-sm font-semibold tracking-wide text-orange-600 shadow-lg">Pensata do Dia</span>
                <p className="text-[11px] leading-tight text-blue-600 shadow-lg">Bibliomancia Digital</p>
              </span>
            </Button>
          </div>

          <a
            href="https://cons-ia.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={`group block rounded-xl border border-orange-200 ${cardsBgClass} px-4 py-2 text-blue-600 shadow-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.45),0_3px_8px_-4px_rgba(0,0,0,0.25)]`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <img src="/cons-ia.png" alt="Cons-IA" className="h-16 w-16 rounded-md" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="text-sm font-semibold tracking-wide text-orange-600 shadow-lg">Cons-IA</span>
                  <p className="text-[11px] leading-tight text-blue-600 shadow-lg">Toolbox de IA da Conscienciologia</p>
                </span>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-90 transition group-hover:translate-x-0.5" />
            </div>
          </a>

          <a
            href="https://www.dropbox.com/scl/fo/qh87067rpgc7ndjpv50eb/AGWrUeEVDyDZRlOWqDNcJ00?rlkey=jw6lkzp9fkugkamcx500z0k9g&st=owkldr8v&dl=0"
            target="_blank"
            rel="noopener noreferrer"
            className={`group block rounded-xl border border-orange-200 ${cardsBgClass} px-4 py-2 text-blue-600 shadow-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.45),0_3px_8px_-4px_rgba(0,0,0,0.25)]`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <img src="/Books.png" alt="PDF" className="h-16 w-16 rounded-md" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="text-sm font-semibold tracking-wide text-orange-600 shadow-lg">Livros em PDF</span>
                  <p className="text-[11px] leading-tight text-blue-600 shadow-lg">Download de livros da Conscienciologia</p>
                </span>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-90 transition group-hover:translate-x-0.5" />
            </div>
          </a>

          <a
            href="https://consciencioteca.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`group block rounded-xl border border-orange-200 ${cardsBgClass} px-4 py-2 text-blue-600 shadow-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.45),0_3px_8px_-4px_rgba(0,0,0,0.25)]`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <img src="/WV-Green3.png" alt="Videos" className="h-12 w-16 rounded-md" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="text-sm font-semibold tracking-wide text-orange-600 shadow-lg">Consciencioteca</span>
                  <p className="text-[11px] leading-tight text-blue-600 shadow-lg">Canal de vídeos da Conscienciologia</p>
                </span>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-90 transition group-hover:translate-x-0.5" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
