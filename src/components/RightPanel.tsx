import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Copy, FileText, Languages, MessageSquare, PenLine, Repeat2, Search, SendHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface AIResponse {
  id: string;
  type: "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "translate" | "chat" | "pensatas";
  query: string;
  content: string;
  timestamp: Date;
}

const typeLabels: Record<AIResponse["type"], { label: string; icon: React.ReactNode }> = {
  define: { label: "Definir", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  synonyms: { label: "Sinonímia", icon: <Repeat2 className="h-3.5 w-3.5 text-primary" /> },
  epigraph: { label: "Epígrafe", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  rewrite: { label: "Reescrever", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  summarize: { label: "Resumir", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  translate: { label: "Traduzir", icon: <Languages className="h-3.5 w-3.5 text-primary" /> },
  chat: { label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5 text-primary" /> },
  pensatas: { label: "Pensatas LO", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
};

interface RightPanelProps {
  responses: AIResponse[];
  onClear: () => void;
  onSendMessage: (message: string) => Promise<void> | void;
  isSending?: boolean;
  chatDisabled?: boolean;
}

const RightPanel = ({ responses, onClear, onSendMessage, isSending = false, chatDisabled = false }: RightPanelProps) => {
  const [prompt, setPrompt] = useState("");

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Conteudo copiado.");
  };

  const canSend = !chatDisabled && !isSending && prompt.trim().length > 0;

  const submit = async () => {
    const message = prompt.trim();
    if (!message || chatDisabled || isSending) return;
    await onSendMessage(message);
    setPrompt("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--panel-header))] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Histórico IA ({responses.length})</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={onClear} title="Limpar histórico">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="scrollbar-thin flex-1 overflow-y-auto">
        {responses.length === 0 ? (
          <div className="flex h-full min-h-52 items-center justify-center p-6 text-center text-muted-foreground">
            <div>
              <Clock className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" />
              <p className="text-sm">As respostas das ações IA aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3">
            {responses.map((r) => {
              const meta = typeLabels[r.type];
              return (
                <div key={r.id} className="space-y-2 rounded-lg border border-border bg-white p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    {meta.icon}
                    {meta.label}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {r.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {r.query && (
                    <p className="line-clamp-2 border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground">
                      {r.query}
                    </p>
                  )}

                  <div
                    className="prose prose-sm max-w-none text-xs text-foreground"
                    dangerouslySetInnerHTML={{
                      __html: r.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                        .replace(/\n/g, "<br/>"),
                    }}
                  />

                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void copyToClipboard(r.content)} title="Copiar resposta">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-white p-2">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Pergunte algo para a LLM..."
            className="flex-1 resize-none bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            disabled={chatDisabled || isSending}
          />
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 rounded-lg bg-green-300 text-green-900 hover:bg-green-400"
            onClick={() => void submit()}
            disabled={!canSend}
            title="Enviar"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
