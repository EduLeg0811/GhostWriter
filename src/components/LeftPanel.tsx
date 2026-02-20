import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UploadedFileMeta } from "@/lib/backend-api";
import { TextStats } from "@/hooks/useTextStats";
import {
  AlignLeft,
  BookOpen,
  FileText,
  Hash,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  Search,
  Type,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { primaryActionButtonClass, sectionActionButtonClass } from "@/styles/buttonStyles";

interface LeftPanelProps {
  stats: TextStats;
  onWordFileUpload: (file: File) => Promise<UploadedFileMeta>;
  onCreateBlankDocument: () => Promise<void>;
  onOpenParameterSection: (section: "actions" | "apps" | "macros") => void;
  onRunRandomPensata: () => Promise<void> | void;
  onOpenBookSearch: () => void;
  isLoading: boolean;
  hasDocumentOpen: boolean;
  onRefreshStats?: () => void;
}

type LeftPanelActionId = "actions" | "apps" | "macros";

const LeftPanel = ({
  stats,
  onWordFileUpload,
  onCreateBlankDocument,
  onOpenParameterSection,
  onRunRandomPensata,
  onOpenBookSearch,
  isLoading,
  hasDocumentOpen,
  onRefreshStats,
}: LeftPanelProps) => {
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [activeActionId, setActiveActionId] = useState<LeftPanelActionId | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const actionDisabled = isLoading;

  useEffect(() => {
    if (!isLoading) setActiveActionId(null);
  }, [isLoading]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    setFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!["docx", "pdf"].includes(ext)) {
        throw new Error("Formato nao suportado. Use DOCX ou PDF.");
      }
      await onWordFileUpload(file);
      toast.success(ext === "pdf" ? "PDF convertido para DOCX e aberto no editor." : "Documento aberto no editor.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar arquivo.");
      setFileName("");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const statCards = [
    { icon: FileText, label: "Páginas", value: stats.pages },
    { icon: AlignLeft, label: "Parágrafos", value: stats.paragraphs },
    { icon: Type, label: "Palavras", value: stats.words },
    { icon: Hash, label: "Caracteres", value: stats.characters },
    { icon: Sparkles, label: "Logias", value: stats.logiaWords },
    { icon: BookOpen, label: "Sesquipedais", value: stats.sesquipedal },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-[hsl(var(--panel-header))] px-4 py-4">
        <h1 className="text-sm font-semibold text-foreground">Parapreceptor • Ghost Writer Editor</h1>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento</Label>
            <Button
              variant="secondary"
              size="sm"
              className={primaryActionButtonClass}
              onClick={() => void onCreateBlankDocument()}
              disabled={isLoading || importing}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Novo Documento em Branco</span>
            </Button>
          </div>

          <div className="space-y-2.5">
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.pdf"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />

            {!fileName ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-border bg-sky-50 p-2 text-center hover:bg-muted/30"
              >
                {importing ? (
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-sm text-foreground">Arraste ou selecione</span>
                <span className="mt-1 text-xs text-muted-foreground"> DOCX ou PDF</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm text-foreground">{fileName}</span>
                <button
                  type="button"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={() => setFileName("")}
                  aria-label="Remover arquivo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <Separator className="my-1" />

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estatisticas</Label>
              {onRefreshStats && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRefreshStats} title="Atualizar">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {statCards.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-md bg-muted/50 px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <div className="text-sm font-semibold text-[hsl(var(--stat-value))]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-1" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ferramentas IA</Label>
            <div className="space-y-1.5">
              
              
              <Button
                variant="ghost"
                className={sectionActionButtonClass}
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
                className={sectionActionButtonClass}
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


              <Button
                variant="ghost"
                className={sectionActionButtonClass}
                onClick={onOpenBookSearch}
                disabled={actionDisabled}
              >
                <Search className="mr-2 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">Busca de Termos</span>
                  <span className="block break-words text-xs text-muted-foreground">Busca termos em livros</span>
                </span>
              </Button>

              
            </div>
          </div>



               

          {/*<Separator className="my-1" />*/}

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edição de Texto</Label>
            <div className="space-y-1.5">
              <Button
                variant="ghost"
                className={sectionActionButtonClass}
                onClick={() => {
                  setActiveActionId("macros");
                  onOpenParameterSection("macros");
                }}
                disabled={actionDisabled || !hasDocumentOpen}
              >
                {isLoading && activeActionId === "macros" ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <Hash className="mr-2 h-4 w-4 shrink-0 text-primary" />
                )}
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">Edição do texto</span>
                  <span className="block break-words text-xs text-muted-foreground">Ações de edição no documento</span>
                </span>
              </Button>
            </div>
          </div>

        </div>
      </div>
      
      <div className="space-y-3 border-t border-border bg-[hsl(var(--panel-header))] px-4 py-3">


        <div className="space-y-2.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aplicativos IA</Label>


          <div className="space-y-1.5">
            <Button
              variant="ghost"
              className={`${sectionActionButtonClass} group flex items-center justify-between rounded-xl border border-orange-200 bg-white px-4 py-2 text-blue-600 shadow-sm transition hover:brightness-110`}
              onClick={() => void onRunRandomPensata()}
              disabled={actionDisabled}
            >
              <img src="/LO.png" alt="LO" className="h-16 w-16 shrink-0 object-contain" />
              <span className="min-w-0 flex-1 text-left">
                <span className="text-normal font-semibold tracking-wide text-orange-600 shadow-lg">Pensata do Dia</span>
                <p className="text-[11px] leading-tight text-blue-600 shadow-lg">Bibliomancia Digital</p>
              </span>
            </Button>
          </div>
      

          <a
            href="https://cons-ia.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-orange-200 bg-white px-4 py-2 text-blue-600 shadow-sm transition hover:brightness-110"
            title="Abrir Cons-IA em nova aba"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <img src="/cons-ia.png" alt="Cons-IA" className="h-16 w-16 rounded-md" />
                <div className="flex flex-col">
                  <span className="text-normal font-semibold tracking-wide text-orange-600 shadow-lg">Cons-IA</span>
                  <p className="text-[11px] leading-tight text-blue-600 shadow-lg">Toolbox de IA da Conscienciologia</p>
                </div>
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
