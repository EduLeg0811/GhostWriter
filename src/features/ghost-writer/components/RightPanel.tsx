import { MouseEvent, useCallback, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Clock, Copy, FileText, Info, Languages, ListOrdered, Loader2, MessageSquare, Paperclip, PenLine, Repeat2, RotateCcw, Search, SendHorizontal, Settings, Trash2 } from "lucide-react";
import { historyHtmlToPlainText, isHistorySearchResponseType, renderHistoryResponseAppendBodyHtml, renderHistoryResponseCopyHtml, renderHistoryResponseEditorHtml } from "@/features/ghost-writer/utils/historyResponseHtml";
import { buttonsPrimarySolidBgClass, cardsBgClass, chatSectionBgClass, panelsBgClass, panelsTopMenuBarBgClass } from "@/styles/backgroundColors";
import type { AIResponse } from "@/features/ghost-writer/types";

const HISTORY_FONT_DEFAULT = 0.75;
const HISTORY_FONT_STEP = 0.05;
const historyToolbarButtonBaseClass = "h-8 w-8";
const historyToolbarButtonInactiveClass = "text-muted-foreground hover:text-foreground";
const historyToolbarButtonActiveClass = "bg-green-100 text-blue-700 ring-1 ring-green-300/70 hover:bg-green-200 hover:text-blue-800";
const historyToolbarSeparatorClass = "mx-1.5 h-6 w-px bg-zinc-400/90 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]";

const typeLabels: Record<AIResponse["type"], { label: string; icon: React.ReactNode }> = {
  define: { label: "Definologia", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  synonyms: { label: "Sinonímia", icon: <Repeat2 className="h-3.5 w-3.5 text-primary" /> },
  etymology: { label: "Etimologia", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  dictionary: { label: "Dicionário", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  epigraph: { label: "Epígrafe", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  rewrite: { label: "Reescrever", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  summarize: { label: "Resumir", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  translate: { label: "Traduzir", icon: <Languages className="h-3.5 w-3.5 text-primary" /> },
  dict_lookup: { label: "Consulta Dicionários", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  ai_command: { label: "Comando IA", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  analogies: { label: "Analogias", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  comparisons: { label: "Comparações", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  examples: { label: "Exemplos", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  counterpoints: { label: "Contrapontos", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  neoparadigma: { label: "Neoparadigma", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  chat: { label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5 text-primary" /> },
  pensatas: { label: "Pensatas LO", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_ref_book: { label: "Bibliografia de Livros", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  app_ref_verbete_list: { label: "Listagem de Verbetes", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  app_ref_verbete_biblio: { label: "Bibliografia de Verbetes", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  app_biblio_geral: { label: "Bibliografia Autores", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_biblio_externa: { label: "Bibliografia Externa", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_random_pensata: { label: "Pensata Sorteada", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  app_book_search: { label: "Lexical Search", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_semantic_search: { label: "Semantic Search", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_verbete_search: { label: "Busca em Verbetes", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_verbete_definologia: { label: "Definologia", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  app_verbete_frase_enfatica: { label: "Frase Enfática", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  app_verbete_sinonimologia: { label: "Sinonimologia", icon: <Repeat2 className="h-3.5 w-3.5 text-primary" /> },
  app_verbete_fatologia: { label: "Fatologia", icon: <ListOrdered className="h-3.5 w-3.5 text-primary" /> },
};

interface RightPanelProps {
  responses: AIResponse[];
  enableHistoryNumbering?: boolean;
  enableHistoryReferences?: boolean;
  enableHistoryMetadata?: boolean;
  onToggleHistoryNumbering?: () => void;
  onToggleHistoryReferences?: () => void;
  onToggleHistoryMetadata?: () => void;
  onClear: () => void;
  onSendMessage: (message: string) => Promise<void> | void;
  onCleanConversation?: () => void | Promise<void>;
  onToggleChatConfig?: () => void | Promise<void>;
  isChatConfigOpen?: boolean;
  onAppendToEditor?: (html: string) => Promise<void> | void;
  onNotify?: (message: string) => void;
  showAppendToEditor?: boolean;
  isSending?: boolean;
  chatDisabled?: boolean;
  chatDisabledReason?: string;
  historyNotice?: string | null;
  includeEditorContextInLlm?: boolean;
  canToggleIncludeEditorContextInLlm?: boolean;
  onToggleIncludeEditorContextInLlm?: () => void;
}

const RightPanel = ({
  responses,
  enableHistoryNumbering = true,
  enableHistoryReferences = true,
  enableHistoryMetadata = true,
  onToggleHistoryNumbering,
  onToggleHistoryReferences,
  onToggleHistoryMetadata,
  onClear,
  onSendMessage,
  onCleanConversation,
  onToggleChatConfig,
  isChatConfigOpen = false,
  onAppendToEditor,
  onNotify,
  showAppendToEditor = false,
  isSending = false,
  chatDisabled = false,
  chatDisabledReason,
  historyNotice,
  includeEditorContextInLlm = false,
  canToggleIncludeEditorContextInLlm = true,
  onToggleIncludeEditorContextInLlm,
}: RightPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const [historyFontScale, setHistoryFontScale] = useState(HISTORY_FONT_DEFAULT);
  const historyFontMin = 0.6;
  const historyFontMax = 1.4;
  const historyFontStyle = { fontSize: `${historyFontScale}em`, lineHeight: 1.5 };

  const decreaseHistoryFont = () => {
    setHistoryFontScale((prev) => Math.max(historyFontMin, Number((prev - HISTORY_FONT_STEP).toFixed(2))));
  };

  const increaseHistoryFont = () => {
    setHistoryFontScale((prev) => Math.min(historyFontMax, Number((prev + HISTORY_FONT_STEP).toFixed(2))));
  };

  const resetHistoryFont = () => {
    setHistoryFontScale(HISTORY_FONT_DEFAULT);
  };

  const triggerPdfDownload = useCallback(async (urlText: string) => {
    const url = (urlText || "").trim();
    if (!/^https?:\/\/\S+$/i.test(url)) return;

    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error(`Falha ao baixar PDF (${response.status})`);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const fallbackLink = document.createElement("a");
      fallbackLink.href = url;
      fallbackLink.download = "";
      fallbackLink.target = "_blank";
      fallbackLink.rel = "noopener noreferrer";
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      fallbackLink.remove();
    }
  }, []);

  const handlePdfIconClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a[data-pdf-download-url]") as HTMLAnchorElement | null;
    const url = anchor?.dataset.pdfDownloadUrl?.trim() || "";
    if (!anchor || !url) return;

    event.preventDefault();
    event.stopPropagation();
    void triggerPdfDownload(url);
  }, [triggerPdfDownload]);

  const renderQuerySubtitle = (response: AIResponse): React.ReactNode => {
    if (response.type === "app_random_pensata") return "Léxico de Ortopensatas (2a ed., 2019)";
    if (response.type !== "app_book_search" && response.type !== "app_verbete_search") return response.query;

    const query = response.query || "";
    const match = query.match(/^Livro:\s*(.+?)(\s*\|.*)?$/i);
    if (!match) return query;

    const bookName = (match[1] || "").trim();
    const rest = match[2] || "";
    return (
      <>
        Livro: <strong>{bookName}</strong>
        {rest}
      </>
    );
  };

  const copyToClipboard = async (response: AIResponse) => {
    const html = renderHistoryResponseCopyHtml(response, {
      applyNumbering: enableHistoryNumbering,
      applyReferences: enableHistoryReferences,
      applyMetadata: enableHistoryMetadata,
    });
    const text = historyHtmlToPlainText(html);

    if (window.ClipboardItem && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    onNotify?.("Conteudo copiado.");
  };

  const buildAppendHtml = (response: AIResponse): string => (
    isHistorySearchResponseType(response.type)
      ? renderHistoryResponseCopyHtml(response, {
          applyNumbering: enableHistoryNumbering,
          applyReferences: enableHistoryReferences,
          applyMetadata: enableHistoryMetadata,
        })
      : renderHistoryResponseAppendBodyHtml(response, {
          applyNumbering: enableHistoryNumbering,
          applyReferences: enableHistoryReferences,
          applyMetadata: enableHistoryMetadata,
        })
  );

  const submit = async () => {
    const message = prompt.trim();
    if (!message || chatDisabled || isSending) return;
    await onSendMessage(message);
    setPrompt("");
  };

  const canSend = !chatDisabled && !isSending && prompt.trim().length > 0;

  return (
    <div className={`flex h-full flex-col ${panelsBgClass}`}>
      <div className={`flex items-center justify-between border-b border-border ${panelsTopMenuBarBgClass} px-4 py-3`}>
        <h2 className="text-sm font-semibold text-foreground">Histórico ({responses.length})</h2>
        <div className="flex flex-1 items-center justify-center">
          {historyNotice ? (
            <div className="inline-flex min-h-7 items-center justify-center rounded-md bg-red-100 px-3 py-1 text-center text-[11px] font-medium leading-tight text-red-800 sm:text-xs">
              <span>{historyNotice}</span>
            </div>
          ) : isSending ? (
            <div className="inline-flex h-7 items-center gap-2 rounded-full border border-green-200 bg-green-100 px-5 text-sm font-simibold leading-none text-blue-700 ring-0 ring-green-200 shadow-sm">
              <Loader2 className="h-4 w-5 shrink-0 animate-spin text-blue-700" />
              <span className="leading-none">Processando</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`${historyToolbarButtonBaseClass} ${enableHistoryNumbering ? historyToolbarButtonActiveClass : historyToolbarButtonInactiveClass}`}
            onClick={onToggleHistoryNumbering}
            title="Numerar Resultados"
            aria-label="Numerar Resultados"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${historyToolbarButtonBaseClass} ${enableHistoryReferences ? historyToolbarButtonActiveClass : historyToolbarButtonInactiveClass}`}
            onClick={onToggleHistoryReferences}
            title="Inserir Referências"
            aria-label="Inserir Referências"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${historyToolbarButtonBaseClass} ${enableHistoryMetadata ? historyToolbarButtonActiveClass : historyToolbarButtonInactiveClass}`}
            onClick={onToggleHistoryMetadata}
            title="Inserir Metadados"
            aria-label="Inserir Metadados"
          >
            <Info className="h-3.5 w-3.5" />
          </Button>
          <div className={historyToolbarSeparatorClass} aria-hidden="true" />
          <Button
            variant="ghost"
            size="icon"
            className={`${historyToolbarButtonBaseClass} ${historyToolbarButtonInactiveClass} text-sm font-bold`}
            onClick={decreaseHistoryFont}
            title="Diminuir fonte dos cards"
            disabled={historyFontScale <= historyFontMin}
          >
            A-
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${historyToolbarButtonBaseClass} ${historyToolbarButtonInactiveClass} text-sm font-bold`}
            onClick={increaseHistoryFont}
            title="Aumentar fonte dos cards"
            disabled={historyFontScale >= historyFontMax}
          >
            A+
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${historyToolbarButtonBaseClass} ${historyToolbarButtonInactiveClass}`}
            onClick={resetHistoryFont}
            title="Resetar fonte dos cards (xs)"
            disabled={historyFontScale === HISTORY_FONT_DEFAULT}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className={`${historyToolbarButtonBaseClass} ${historyToolbarButtonInactiveClass} hover:text-destructive`} onClick={onClear} title="Limpar histórico">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="scrollbar-thin flex-1 overflow-y-auto">
        {responses.length === 0 ? (
          <div className="flex h-full min-h-52 items-center justify-center p-6 text-center text-muted-foreground">
            <div>
              <Clock className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" />
              <p className="text-sm">As respostas da IA aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3">
            {responses.map((response) => {
              const meta = typeLabels[response.type];
              return (
                <div key={response.id} className={`space-y-2 rounded-lg border border-border ${cardsBgClass} p-3`}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary" style={historyFontStyle}>
                    {meta.icon}
                    {meta.label}
                    <span className="ml-auto font-normal text-muted-foreground">
                      {response.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {(response.query || response.type === "app_random_pensata") && (
                    <p className="line-clamp-2 border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground" style={historyFontStyle}>
                      {renderQuerySubtitle(response)}
                    </p>
                  )}

                  <div
                    className={`prose prose-sm max-w-none text-xs text-foreground ${response.type === "app_verbete_frase_enfatica" ? "uppercase" : ""}`}
                    style={historyFontStyle}
                    onClick={response.type === "app_verbete_search" ? handlePdfIconClick : undefined}
                    dangerouslySetInnerHTML={{
                      __html: renderHistoryResponseEditorHtml(response, {
                        applyNumbering: enableHistoryNumbering,
                        applyReferences: enableHistoryReferences,
                        applyMetadata: enableHistoryMetadata,
                      }),
                    }}
                  />

                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void copyToClipboard(response)} title="Copiar resposta">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {showAppendToEditor && onAppendToEditor ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => void onAppendToEditor(buildAppendHtml(response))}
                        title="Inserir no editor"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className={`border-t border-border px-3 py-4 ${chatSectionBgClass}`}>
        <div className="flex items-end gap-2">
          <div className={`flex flex-1 items-end gap-2 rounded-xl border border-border ${cardsBgClass} p-2`}>
            <textarea
              rows={2}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder={chatDisabled ? (chatDisabledReason || "Chat indisponível no momento.") : "Pergunte algo para a IA..."}
              className="flex-1 resize-none bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              disabled={chatDisabled || isSending}
            />
            <Button
              type="button"
              size="icon"
              className={`h-10 w-10 rounded-lg ${buttonsPrimarySolidBgClass} text-green-900 hover:bg-green-400`}
              onClick={() => void submit()}
              disabled={!canSend}
              title="Enviar"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => void onCleanConversation?.()}
            title="Nova conversa sem contexto anterior"
            aria-label="Nova conversa sem contexto anterior"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-lg border border-border bg-amber-50 text-muted-foreground shadow-sm transition hover:bg-zinc-50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSending}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={`h-10 w-10 shrink-0 self-center rounded-lg border border-border shadow-sm ${
              includeEditorContextInLlm
                ? "bg-pink-200 text-pink-800 ring-1 ring-pink-300/80 hover:bg-pink-300 hover:text-pink-900"
                : "bg-transparent text-muted-foreground hover:bg-white/30 hover:text-foreground"
            }`}
            title={canToggleIncludeEditorContextInLlm ? (includeEditorContextInLlm ? "Desativar envio do texto do editor para a LLM" : "Ativar envio do texto do editor para a LLM") : "Disponivel apenas com documento aberto no editor"}
            aria-label={canToggleIncludeEditorContextInLlm ? (includeEditorContextInLlm ? "Desativar envio do texto do editor para a LLM" : "Ativar envio do texto do editor para a LLM") : "Disponivel apenas com documento aberto no editor"}
            onClick={onToggleIncludeEditorContextInLlm}
            disabled={isSending || !canToggleIncludeEditorContextInLlm}
          >
            <Paperclip className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => void onToggleChatConfig?.()}
            title={isChatConfigOpen ? "Ocultar configurações do chat" : "Mostrar configurações do chat"}
            aria-label={isChatConfigOpen ? "Ocultar configurações do chat" : "Mostrar configurações do chat"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm transition hover:bg-zinc-50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSending}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
