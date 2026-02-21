import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Clock, Copy, FileText, Languages, Loader2, MessageSquare, PenLine, Repeat2, Search, SendHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { markdownToEditorHtml, normalizeHistoryContentToMarkdown } from "@/lib/markdown";

export interface AIResponse {
  id: string;
  type:
    | "define"
    | "synonyms"
    | "epigraph"
    | "rewrite"
    | "summarize"
    | "translate"
    | "chat"
    | "pensatas"
    | "app_ref_book"
    | "app_ref_verbete_list"
    | "app_ref_verbete_biblio"
    | "app_biblio_geral"
    | "app_biblio_externa"
    | "app_random_pensata"
    | "app_book_search"
    | "app_verbete_search";
  query: string;
  content: string;
  timestamp: Date;
}

const typeLabels: Record<AIResponse["type"], { label: string; icon: React.ReactNode }> = {
  define: { label: "Definir", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  synonyms: { label: "SinonÃ­mia", icon: <Repeat2 className="h-3.5 w-3.5 text-primary" /> },
  epigraph: { label: "EpÃ­grafe", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  rewrite: { label: "Reescrever", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  summarize: { label: "Resumir", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  translate: { label: "Traduzir", icon: <Languages className="h-3.5 w-3.5 text-primary" /> },
  chat: { label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5 text-primary" /> },
  pensatas: { label: "Pensatas LO", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_ref_book: { label: "Bibliografia de Livros", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  app_ref_verbete_list: { label: "Listagem de Verbetes", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  app_ref_verbete_biblio: { label: "Bibliografia de Verbetes", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  app_biblio_geral: { label: "Bibliografia Autores", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_biblio_externa: { label: "Bibliografia Externa", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_random_pensata: { label: "Pensata Sorteada", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  app_book_search: { label: "Book Search", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_verbete_search: { label: "Busca em Verbetes", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
};

interface RightPanelProps {
  responses: AIResponse[];
  onClear: () => void;
  onSendMessage: (message: string) => Promise<void> | void;
  onAppendToEditor?: (html: string) => Promise<void> | void;
  showAppendToEditor?: boolean;
  isSending?: boolean;
  chatDisabled?: boolean;
}

const RightPanel = ({
  responses,
  onClear,
  onSendMessage,
  onAppendToEditor,
  showAppendToEditor = false,
  isSending = false,
  chatDisabled = false,
}: RightPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const isHttpUrlText = (value: string): boolean => /^https?:\/\/\S+$/i.test((value || "").trim());

  const applyExternalLinkLineStyle = (block: Element, urlText: string, doc: Document): void => {
    const htmlBlock = block as HTMLElement;
    htmlBlock.style.fontSize = "0.8em";
    htmlBlock.style.color = "rgba(22, 184, 70, 1)";
    const a = doc.createElement("a");
    a.href = urlText;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "PDF";
    a.style.color = "inherit";
    a.style.textDecoration = "none";
    block.innerHTML = "";
    block.appendChild(a);
  };

  const applyHangingIndent = (block: Element, px = 19): void => {
    const htmlBlock = block as HTMLElement;
    htmlBlock.style.paddingLeft = `${px}px`;
    htmlBlock.style.textIndent = `${-px}px`;
  };

  const applyIndentedLine = (block: Element, px = 19): void => {
    const htmlBlock = block as HTMLElement;
    htmlBlock.style.paddingLeft = `${px}px`;
  };

  const escapeHtml = (value: string): string =>
    (value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const extractBookSearchQuery = (query: string): string => {
    const raw = query || "";
    const withTotal = raw.match(/Termo:\s*([\s\S]*?)\s*\|\s*Total:/i);
    if (withTotal?.[1]) return withTotal[1].trim();
    const legacyWithMax = raw.match(/Termo:\s*([\s\S]*?)\s*\|\s*Max:/i);
    if (legacyWithMax?.[1]) return legacyWithMax[1].trim();
    const fallback = raw.match(/Termo:\s*([\s\S]*?)$/i);
    return (fallback?.[1] || "").trim();
  };

  const extractHighlightTerms = (query: string): string[] => {
    const raw = extractBookSearchQuery(query);
    if (!raw) return [];
    const tokens = raw.match(/"[^"]+"|\S+/g) || [];
    const cleaned = tokens
      .map((token) => {
        const quoted = token.startsWith("\"") && token.endsWith("\"") && token.length >= 2;
        const core = quoted ? token.slice(1, -1) : token;
        return core.replace(/[!&|()]/g, "").replace(/\*/g, "").trim();
      })
      .filter((token) => token.length >= 2);
    return Array.from(new Set(cleaned)).sort((a, b) => b.length - a.length);
  };

  const highlightBookSearchHtml = (html: string, query: string): string => {
    const terms = extractHighlightTerms(query);
    if (terms.length === 0) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return html;

    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      if (node.parentElement?.tagName.toLowerCase() === "mark") continue;
      textNodes.push(node);
    }

    const pattern = new RegExp(terms.map((term) => escapeRegExp(term)).join("|"), "gi");

    for (const node of textNodes) {
      const value = node.nodeValue || "";
      pattern.lastIndex = 0;
      if (!pattern.test(value)) continue;

      const fragment = doc.createDocumentFragment();
      let lastIndex = 0;
      value.replace(pattern, (match, offset) => {
        if (offset > lastIndex) {
          fragment.appendChild(doc.createTextNode(value.slice(lastIndex, offset)));
        }
        const mark = doc.createElement("mark");
        mark.setAttribute("style", "background-color:#fef08a;padding:0 .08em;");
        mark.textContent = match;
        fragment.appendChild(mark);
        lastIndex = offset + match.length;
        return match;
      });

      if (lastIndex < value.length) {
        fragment.appendChild(doc.createTextNode(value.slice(lastIndex)));
      }
      node.parentNode?.replaceChild(fragment, node);
    }

    return root.innerHTML;
  };

  const styleBookSearchSourceRefHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return html;

    const blocks = Array.from(root.querySelectorAll("p, li"));
    const sourceRefPattern = /(\(<strong>[^<]+<\/strong>;[\s\S]*\))\s*$/;

    for (const block of blocks) {
      const current = block.innerHTML || "";
      const next = current.replace(
        sourceRefPattern,
        '<span style="font-size:0.85em;color:#909090;">$1</span>',
      );
      if (next !== current) block.innerHTML = next;
    }

    return root.innerHTML;
  };

  const styleVerbeteSearchHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return html;

    const blocks = Array.from(root.querySelectorAll("p"));
    if (blocks.length === 0) return html;

    for (const block of blocks) {
      const rawText = (block.textContent || "").trim();
      const hasExternalHref = Array.from(block.querySelectorAll("a")).some((a) => isHttpUrlText(a.getAttribute("href") || ""));
      const hasHeaderShape =
        block.querySelector("strong") !== null &&
        block.querySelector("em") !== null &&
        rawText.includes("#");

      if (hasHeaderShape) {
        block.style.color = "#1e3a8a";
        block.style.fontWeight = "700";
        applyHangingIndent(block);
      } else {
        applyIndentedLine(block);
      }

      const isUrl = isHttpUrlText(rawText);
      if (isUrl) {
        applyExternalLinkLineStyle(block, rawText, doc);
      } else if (hasExternalHref) {
        const anchor = block.querySelector("a");
        const href = (anchor as HTMLAnchorElement | null)?.href?.trim() || "";
        if (href) applyExternalLinkLineStyle(block, href, doc);
      }
    }

    return root.innerHTML;
  };

  const removeVerbeteLinkLineHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return html;

    const blocks = Array.from(root.querySelectorAll("p, li"));
    for (const block of blocks) {
      const text = (block.textContent || "").trim();
      const isUrl = isHttpUrlText(text);
      const isPdfLabel = /^pdf$/i.test(text);
      const hasExternalHref = Array.from(block.querySelectorAll("a")).some((a) => isHttpUrlText(a.getAttribute("href") || ""));
      if (isUrl || isPdfLabel || hasExternalHref) block.remove();
    }

    return root.innerHTML;
  };

  const responseToEditorHtml = (response: AIResponse): string => {
    const { content, type, query } = response;
    const markdown = normalizeHistoryContentToMarkdown(content);
    const html = markdownToEditorHtml(markdown);
    if (type === "app_book_search") return styleBookSearchSourceRefHtml(highlightBookSearchHtml(html, query));
    if (type === "app_verbete_search") return styleVerbeteSearchHtml(highlightBookSearchHtml(html, query));
    return html;
  };

  const responseToAppendBodyHtml = (response: AIResponse): string => {
    const { content, type, query } = response;
    const markdown = normalizeHistoryContentToMarkdown(content).replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n");
    const html = markdownToEditorHtml(markdown);
    if (type === "app_book_search") return highlightBookSearchHtml(html, query);
    if (type === "app_verbete_search") return removeVerbeteLinkLineHtml(highlightBookSearchHtml(html, query));
    return html;
  };

  const htmlToPlainText = (html: string): string => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return (temp.textContent || "").replace(/\u00a0/g, " ").trim();
  };

  const copyToClipboard = async (response: AIResponse) => {
    const html = response.type === "app_verbete_search"
      ? removeVerbeteLinkLineHtml(responseToEditorHtml(response))
      : responseToEditorHtml(response);
    const text = htmlToPlainText(html);

    if (window.ClipboardItem && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    toast.success("Conteudo copiado.");
  };

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

  const getQuerySubtitleText = (response: AIResponse): string => {
    if (response.type === "app_random_pensata") return "Léxico de Ortopensatas (2a ed., 2019)";
    return (response.query || "").trim();
  };

  const responseToAppendHtml = (response: AIResponse): string => {
    const title = typeLabels[response.type]?.label || "";
    const subtitle = getQuerySubtitleText(response);
    const bodyHtml = responseToAppendBodyHtml(response);
    const titleHtml = title ? `<p><strong>${escapeHtml(title)}</strong></p>` : "";
    const subtitleHtml = subtitle ? `<p>${escapeHtml(subtitle)}</p>` : "";
    return `${titleHtml}${subtitleHtml}${bodyHtml}`;
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
        <h2 className="text-sm font-semibold text-foreground">Histórico({responses.length})</h2>
        <div className="flex flex-1 items-center justify-center">
          {isSending && (
            <div className="inline-flex h-9 items-center gap-2 rounded-full border border-green-300 bg-green-100 px-5 text-sm font-bold leading-none text-blue-700 ring-1 ring-green-200 shadow-sm">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-700" />
              <span className="leading-none">Processando</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={onClear} title="Limpar histórico">
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

                  {(r.query || r.type === "app_random_pensata") && (
                    <p className="line-clamp-2 border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground">
                      {renderQuerySubtitle(r)}
                    </p>
                  )}

                  <div className="prose prose-sm max-w-none text-xs text-foreground" dangerouslySetInnerHTML={{ __html: responseToEditorHtml(r) }} />

                  <div className="flex justify-end">
                    {showAppendToEditor && onAppendToEditor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => void onAppendToEditor(responseToAppendHtml(r))}
                        title="Inserir no editor ao final"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void copyToClipboard(r)} title="Copiar resposta">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border px-3 py-4 bg-background">
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
            placeholder="Pergunte algo para a IA..."
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



