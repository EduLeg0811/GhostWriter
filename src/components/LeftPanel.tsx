import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UploadedFileMeta } from "@/lib/backend-api";
import { TextStats } from "@/hooks/useTextStats";
import {
  AlignLeft,
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  FileText,
  Hash,
  Loader2,
  MessageSquare,
  PenLine,
  RefreshCw,
  Repeat2,
  Search,
  Server,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { primaryActionButtonClass } from "@/styles/buttonStyles";


const DEFAULT_ONLYOFFICE_SERVER_URL = "http://localhost:8080";

interface LeftPanelProps {
  stats: TextStats;
  onWordFileUpload: (file: File) => Promise<UploadedFileMeta>;
  onCreateBlankDocument: () => Promise<void>;
  onAction: (type: "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "highlight") => void;
  onActionMacros: (type: "macro1" | "macro2") => void;
  onActionApps: (type: "app1" | "app2") => void;
  actionText: string;
  onActionTextChange: (text: string) => void;
  onRetrieveSelectedText: () => Promise<void>;
  onSelectAllContent: () => Promise<void>;
  onTriggerSave: () => Promise<void>;
  isLoading: boolean;
  openAiReady: boolean;
  hasVectorStoreLO: boolean;
  hasDocumentOpen: boolean;
  onlyOfficeReady: boolean;
  onRefreshStats?: () => void;
}

const actionItems = [
  {
    id: "define" as const,
    icon: BookOpen,
    title: "Definir",
    description: "Definologia conscienciológica",
  },
  {
    id: "synonyms" as const,
    icon: Repeat2,
    title: "Sinonímia",
    description: "Sinonimologia (10 itens)",
  },

  {
    id: "epigraph" as const,
    icon: Search,
    title: "Epígrafe",
    description: "Sugerir epígrafe",
  },

  {
    id: "pensatas" as const,
    icon: Search,
    title: "Pensatas LO",
    description: "Pensatas afins (10 itens)",
  },
  {
    id: "rewrite" as const,
    icon: PenLine,
    title: "Reescrever",
    description: "Melhora clareza e fluidez",
  },
  {
    id: "summarize" as const,
    icon: FileText,
    title: "Resumir",
    description: "Síntese concisa",
  },
];



const actionItemsMacros = [
  {
    id: "macro1" as const,
    icon: BookOpen,
    title: "Macro1",
    description: "Description Macro1",
  },
  {
    id: "macro2" as const,
    icon: Repeat2,
    title: "Macro2",
    description: "Description Macro2",
  },
];


const actionItemsApps = [
  {
    id: "app1" as const,
    icon: BookOpen,
    title: "Bibliografia de Livros",
    description: "Cria Bibliografia de Livros",
  },
  {
    id: "app2" as const,
    icon: Repeat2,
    title: "Bibliografia de Verbetes",
    description: "Cria Bibliografia de verbetes",
  },
]; 




type LeftPanelActionId =
  | (typeof actionItems)[number]["id"]
  | (typeof actionItemsMacros)[number]["id"]
  | (typeof actionItemsApps)[number]["id"];

const LeftPanel = ({
  stats,
  onWordFileUpload,
  onCreateBlankDocument,
  onAction,
  onActionMacros,
  onActionApps,
  actionText,
  onActionTextChange,
  onRetrieveSelectedText,
  onSelectAllContent,
  onTriggerSave,
  isLoading,
  openAiReady,
  hasVectorStoreLO,
  hasDocumentOpen,
  onlyOfficeReady,
  onRefreshStats,
}: LeftPanelProps) => {
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [activeActionId, setActiveActionId] = useState<LeftPanelActionId | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectionNeeded = !actionText.trim();
  const actionDisabled = isLoading || !openAiReady;

  useEffect(() => {
    if (!isLoading) setActiveActionId(null);
  }, [isLoading]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    setFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!["docx", "doc", "rtf", "odt", "pdf"].includes(ext)) {
        throw new Error("Formato nao suportado. Use DOCX, DOC, RTF, ODT ou PDF.");
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
    { icon: Type, label: "Palavras", value: stats.words },
    { icon: Hash, label: "Caracteres", value: stats.characters },
    { icon: AlignLeft, label: "Paragrafos", value: stats.paragraphs },
    { icon: MessageSquare, label: "Frases", value: stats.sentences },
    { icon: BookOpen, label: "Sesquipedais", value: stats.sesquipedal },
    { icon: Sparkles, label: "Logias", value: stats.logiaWords },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-[hsl(var(--panel-header))] px-4 py-4">
        <h1 className="text-sm font-semibold text-foreground">Parapreceptor  ● Ghost Writer Editor</h1>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento</Label>
            <Button
              variant="secondary"
              size="sm"
              className={primaryActionButtonClass}
              onClick={() => void onCreateBlankDocument()}
              disabled={isLoading || importing}
            >
              <FileText className="mr-1 h-3.5 w-3.5 text-black relative z-10" />
              <span className="relative z-10 text-blue-500">Novo Documento em Branco</span>
            </Button>
          </div>

          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.doc,.rtf,.odt,.pdf"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />

            {!fileName ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-border p-2 text-center hover:bg-muted/30 bg-sky-50"
              >
                {importing ? (
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-sm text-foreground">Arraste ou selecione</span>
                <span className="mt-1 text-xs text-muted-foreground"> DOCX, PDF</span>
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

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estatísticas</Label>
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

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Texto de entrada</Label>
            <div className="grid grid-cols-1 gap-1.5">

            <Button
              variant="secondary"
              size="sm"
              className={primaryActionButtonClass}
              onClick={() => void onRetrieveSelectedText()}
              disabled={isLoading || !hasDocumentOpen}
            >
              <ArrowDown className="mr-1 h-3.5 w-3.5 text-black relative z-10" />
              <span className="relative z-10 text-blue-500">Select & Import</span>
            </Button>

           {/*  <Button
              variant="secondary"
              size="sm"
              className={primaryActionButtonClass}
              onClick={() => void onTriggerSave()}
              disabled={isLoading || !hasDocumentOpen}
            >
              <ArrowRight className="mr-1 h-3.5 w-3.5 text-black relative z-10" />
              <span className="relative z-10 text-blue-500">Insert</span>
            </Button> */}


            </div>
            <textarea
              rows={4}
              value={actionText}
              onChange={(e) => onActionTextChange(e.target.value)}
              placeholder="Select text in the document and click to get selection."
              className="min-h-[80px] w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações IA</Label>
            {actionItems.map((item) => {
              const Icon = item.icon;
              const busy = isLoading && activeActionId === item.id;
              const disabled = actionDisabled || selectionNeeded || (item.id === "pensatas" && !hasVectorStoreLO);
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="h-auto w-full justify-start px-3 py-2 hover:bg-primary/5"
                  onClick={() => {
                    setActiveActionId(item.id);
                    onAction(item.id);
                  }}
                  disabled={disabled}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Icon className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="text-left">
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Button>
              );
            })}
          </div>


          
          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Apps</Label>
            {actionItemsApps.map((item) => {
              const Icon = item.icon;
              const busy = isLoading && activeActionId === item.id;
              const disabled = isLoading;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="h-auto w-full justify-start px-3 py-2 hover:bg-primary/5"
                  onClick={() => {
                    setActiveActionId(item.id);
                    onActionApps(item.id);
                  }}
                  disabled={disabled}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Icon className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="text-left">
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Button>
              );
            })}
          </div>


          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Macros Word</Label>
            {actionItemsMacros.map((item) => {
              const Icon = item.icon;
              const busy = isLoading && activeActionId === item.id;
              const disabled = isLoading;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="h-auto w-full justify-start px-3 py-2 hover:bg-primary/5"
                  onClick={() => {
                    setActiveActionId(item.id);
                    onActionMacros(item.id);
                  }}
                  disabled={disabled}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Icon className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="text-left">
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Button>
              );
            })}
          </div>








        </div>
      </div>
    </div>
  );
};

export default LeftPanel;

