import { MouseEvent, useCallback, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Clock, Copy, FileText, Languages, ListOrdered, Loader2, MessageSquare, PenLine, Repeat2, RotateCcw, Search, SendHorizontal, Trash2 } from "lucide-react";
import { renderHistorySearchCardsHtml } from "@/lib/historySearchCards";
import { markdownToEditorHtml, normalizeHistoryContentToMarkdown } from "@/lib/markdown";
import { buttonsPrimarySolidBgClass, cardsBgClass, chatSectionBgClass, panelsBgClass, panelsTopMenuBarBgClass } from "@/styles/backgroundColors";

// DESTAQUE: fonte padrao (inicial + reset) dos cards do Historico.
const HISTORY_FONT_DEFAULT = 0.75;
// DESTAQUE: incremento/decremento aplicado nos botoes A- e A+.
const HISTORY_FONT_STEP = 0.05;
const RESULT_LINE_INDENT_PX = 28;

export interface AIResponse {
  id: string;
  type:
    | "define"
    | "synonyms"
    | "epigraph"
    | "rewrite"
    | "summarize"
    | "translate"
    | "ai_command"
    | "chat"
    | "pensatas"
    | "app_ref_book"
    | "app_ref_verbete_list"
    | "app_ref_verbete_biblio"
    | "app_biblio_geral"
    | "app_biblio_externa"
    | "app_random_pensata"
    | "app_book_search"
    | "app_semantic_search"
    | "app_verbete_search"
    | "app_verbete_definologia"
    | "app_verbete_frase_enfatica"
    | "app_verbete_sinonimologia"
    | "app_verbete_fatologia";
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
  ai_command: { label: "Comando IA", icon: <PenLine className="h-3.5 w-3.5 text-primary" /> },
  chat: { label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5 text-primary" /> },
  pensatas: { label: "Pensatas LO", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_ref_book: { label: "Bibliografia de Livros", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  app_ref_verbete_list: { label: "Listagem de Verbetes", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  app_ref_verbete_biblio: { label: "Bibliografia de Verbetes", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
  app_biblio_geral: { label: "Bibliografia Autores", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_biblio_externa: { label: "Bibliografia Externa", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
  app_random_pensata: { label: "Pensata Sorteada", icon: <BookOpen className="h-3.5 w-3.5 text-primary" /> },
  app_book_search: { label: "Book Search", icon: <Search className="h-3.5 w-3.5 text-primary" /> },
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
  onToggleHistoryNumbering?: () => void;
  onToggleHistoryReferences?: () => void;
  onClear: () => void;
  onSendMessage: (message: string) => Promise<void> | void;
  onCleanConversation?: () => Promise<void> | void;
  onAppendToEditor?: (html: string) => Promise<void> | void;
  onNotify?: (message: string) => void;
  showAppendToEditor?: boolean;
  isSending?: boolean;
  chatDisabled?: boolean;
  chatDisabledReason?: string;
  historyNotice?: string | null;
}

const RightPanel = ({
  responses,
  enableHistoryNumbering = true,
  enableHistoryReferences = true,
  onToggleHistoryNumbering,
  onToggleHistoryReferences,
  onClear,
  onSendMessage,
  onCleanConversation,
  onAppendToEditor,
  onNotify,
  showAppendToEditor = false,
  isSending = false,
  chatDisabled = false,
  chatDisabledReason,
  historyNotice,
}: RightPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const [historyFontScale, setHistoryFontScale] = useState(HISTORY_FONT_DEFAULT);
  const HISTORY_FONT_MIN = 0.6;
  const HISTORY_FONT_MAX = 1.4;
  const historyFontStyle = { fontSize: `${historyFontScale}em`, lineHeight: 1.5 };
  const decreaseHistoryFont = () => {
    setHistoryFontScale((prev) => Math.max(HISTORY_FONT_MIN, Number((prev - HISTORY_FONT_STEP).toFixed(2))));
  };
  const increaseHistoryFont = () => {
    setHistoryFontScale((prev) => Math.min(HISTORY_FONT_MAX, Number((prev + HISTORY_FONT_STEP).toFixed(2))));
  };
  const resetHistoryFont = () => {
    setHistoryFontScale(HISTORY_FONT_DEFAULT);
  };
  const isHttpUrlText = (value: string): boolean => /^https?:\/\/\S+$/i.test((value || "").trim());
  const triggerPdfDownload = useCallback(async (urlText: string) => {
    const url = (urlText || "").trim();
    if (!isHttpUrlText(url)) return;

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

  const applyExternalLinkLineStyle = (block: Element, urlText: string, doc: Document): void => {
    const htmlBlock = block as HTMLElement;
    htmlBlock.style.fontSize = "0.9em";
    htmlBlock.style.color = "rgba(115,115,115,0.5)";
    const a = doc.createElement("a");
    a.href = urlText;
    a.dataset.pdfDownloadUrl = urlText;
    a.setAttribute("aria-label", "Baixar PDF");
    a.setAttribute("download", "");
    a.style.color = "inherit";
    a.style.textDecoration = "none";
    a.style.display = "inline-flex";
    a.style.alignItems = "center";
    a.style.justifyContent = "center";
    a.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" fill="#ef4444"/>
        <path d="M14 2v5h5" fill="#fca5a5"/>
        <path d="M8 17h8M8 13h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`;
    block.innerHTML = "";
    block.appendChild(a);
  };

  const appendExternalLinkIconToHeader = (block: Element, urlText: string, doc: Document): void => {
    const anchor = doc.createElement("a");
    anchor.href = urlText;
    anchor.dataset.pdfDownloadUrl = urlText;
    anchor.setAttribute("aria-label", "Baixar PDF");
    anchor.setAttribute("download", "");
    anchor.style.display = "inline-flex";
    anchor.style.alignItems = "center";
    anchor.style.justifyContent = "center";
    anchor.style.verticalAlign = "baseline";
    anchor.style.marginLeft = "12px";
    anchor.style.textDecoration = "none";
    anchor.style.textIndent = "0";
    anchor.style.position = "relative";
    anchor.style.top = "1px";

    anchor.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" fill="#ef4444"/>
        <path d="M14 2v5h5" fill="#fca5a5"/>
        <path d="M8 17h8M8 13h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`;

    block.appendChild(anchor);
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

  const styleNumberedListItemsHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return html;

    const blocks = Array.from(root.querySelectorAll("p, li"));
    const numberedPattern = /^\s*(\d{1,2})\.\s*/;
    const numberedBlocks = blocks
      .map((block) => {
        const text = (block.textContent || "").replace(/\u00a0/g, " ");
        const match = text.match(numberedPattern);
        if (!match) return null;
        return { block, index: Number(match[1]) };
      })
      .filter((item): item is { block: Element; index: number } => item !== null);

    const shouldPad = numberedBlocks.length >= 10;

    for (const item of numberedBlocks) {
      const block = item.block;
      const normalizedIndex = shouldPad && item.index < 10 ? `0${item.index}` : String(item.index);

      const firstStrong = block.querySelector("strong");
      if (firstStrong && /^\s*\d{1,2}\.\s*$/.test((firstStrong.textContent || "").replace(/\u00a0/g, " "))) {
        firstStrong.textContent = `${normalizedIndex}. `;
      } else if (block.firstChild && block.firstChild.nodeType === Node.TEXT_NODE) {
        const raw = (block.firstChild.nodeValue || "").replace(/\u00a0/g, " ");
        block.firstChild.nodeValue = raw.replace(/^\s*\d{1,2}\.\s*/, `${normalizedIndex}. `);
      }

      // Hanging indent: index stays on the left, wrapped lines align with item text.
      applyHangingIndent(block, RESULT_LINE_INDENT_PX);
      (block as HTMLElement).style.marginTop = "0.2em";
      (block as HTMLElement).style.marginBottom = "0.2em";
    }

    return root.innerHTML;
  };

  const styleVerbeteSearchResultItemsHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return html;

    const blocks = Array.from(root.querySelectorAll("p")).filter((block) => {
      const text = (block.textContent || "").replace(/\u00a0/g, " ").trim();
      if (!text) return false;
      const hasHeaderShape =
        block.querySelector("strong") !== null &&
        block.querySelector("em") !== null &&
        text.includes("#");
      return hasHeaderShape;
    });

    const shouldPad = blocks.length >= 10;

    blocks.forEach((block, index) => {
      const normalizedIndex = shouldPad && index + 1 < 10 ? `0${index + 1}` : String(index + 1);
      const prefix = `${normalizedIndex}. `;

      if (block.firstChild?.nodeType === Node.TEXT_NODE) {
        block.firstChild.nodeValue = (block.firstChild.nodeValue || "").replace(/^\s*\d{1,2}\.\s*/, "");
      }

      block.insertBefore(doc.createTextNode(prefix), block.firstChild);
      applyHangingIndent(block, RESULT_LINE_INDENT_PX);
      (block as HTMLElement).style.marginTop = "0.2em";
      (block as HTMLElement).style.marginBottom = "0.2em";
    });

    return root.innerHTML;
  };

  const removeNumberingFromHistoryHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return html;

    for (const list of Array.from(root.querySelectorAll("ol"))) {
      const htmlList = list as HTMLOListElement;
      htmlList.style.listStyle = "none";
      htmlList.style.paddingLeft = "0";
      htmlList.style.marginLeft = "0";
    }

    const blocks = Array.from(root.querySelectorAll("p, li"));
    for (const block of blocks) {
      const firstStrong = block.querySelector("strong");
      if (firstStrong) {
        const normalizedStrongText = (firstStrong.textContent || "").replace(/\u00a0/g, " ");
        if (/^\s*\d{1,2}\.\s*$/.test(normalizedStrongText)) {
          firstStrong.remove();
          const next = block.firstChild;
          if (next?.nodeType === Node.TEXT_NODE) {
            next.nodeValue = (next.nodeValue || "").replace(/^\s+/, "");
          }
        } else if (/^\s*\d{1,2}\.\s+/.test(normalizedStrongText)) {
          firstStrong.textContent = normalizedStrongText.replace(/^\s*\d{1,2}\.\s+/, "");
        }
      }

      if (block.firstChild?.nodeType === Node.TEXT_NODE) {
        block.firstChild.nodeValue = (block.firstChild.nodeValue || "").replace(/^\s*\d{1,2}\.\s*/, "");
      }

      (block as HTMLElement).style.paddingLeft = "0";
      (block as HTMLElement).style.textIndent = "0";
    }

    return root.innerHTML;
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
  const styleVerbeteSearchHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body.firstElementChild as HTMLDivElement | null;
    if (!root) return html;

    const blocks = Array.from(root.querySelectorAll("p"));
    if (blocks.length === 0) return html;

    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];
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

        for (let lookAhead = index + 1; lookAhead < blocks.length; lookAhead += 1) {
          const candidateBlock = blocks[lookAhead];
          const candidateText = (candidateBlock.textContent || "").trim();
          const candidateHasHeaderShape =
            candidateBlock.querySelector("strong") !== null &&
            candidateBlock.querySelector("em") !== null &&
            candidateText.includes("#");
          if (candidateHasHeaderShape) break;

          const candidateAnchor = candidateBlock.querySelector("a") as HTMLAnchorElement | null;
          const candidateHref = (candidateAnchor?.href || "").trim();
          const candidateIsUrl = isHttpUrlText(candidateText);
          const candidateHasExternalHref = Boolean(candidateHref) && isHttpUrlText(candidateHref);
          const candidateUrl = candidateIsUrl ? candidateText : candidateHasExternalHref ? candidateHref : "";

          if (candidateUrl) {
            appendExternalLinkIconToHeader(block, candidateUrl, doc);
            candidateBlock.remove();
            break;
          }
        }
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

  const responseToEditorHtml = (
    response: AIResponse,
    applyHistoryNumbering = true,
    applyHistoryReferences = true,
  ): string => {
    const { content, type, query } = response;
    const markdown = normalizeHistoryContentToMarkdown(content).replace(/\u00a0/g, " ");
    if (type === "app_book_search" || type === "app_semantic_search") {
      const renderedHtml = renderHistorySearchCardsHtml(markdown, {
        applyNumbering: applyHistoryNumbering,
        showMetadata: applyHistoryReferences,
      });
      return type === "app_book_search" ? highlightBookSearchHtml(renderedHtml, query) : renderedHtml;
    }
    const html = markdownToEditorHtml(markdown);
    if (type === "app_verbete_search") {
      const formattedHtml = styleVerbeteSearchHtml(highlightBookSearchHtml(html, query));
      return applyHistoryNumbering ? styleVerbeteSearchResultItemsHtml(formattedHtml) : removeNumberingFromHistoryHtml(formattedHtml);
    }
    return applyHistoryNumbering ? styleNumberedListItemsHtml(html) : removeNumberingFromHistoryHtml(html);
  };

  const responseToAppendBodyHtml = (response: AIResponse): string => {
    const { content, type, query } = response;
    const markdown = normalizeHistoryContentToMarkdown(content).replace(/\u00a0/g, " ").replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n");
    if (type === "app_book_search" || type === "app_semantic_search") {
      const renderedHtml = renderHistorySearchCardsHtml(markdown, { applyNumbering: false, showMetadata: true });
      return type === "app_book_search" ? highlightBookSearchHtml(renderedHtml, query) : renderedHtml;
    }
    const html = markdownToEditorHtml(markdown);
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
    onNotify?.("Conteudo copiado.");
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
    const bodyHtml = responseToAppendBodyHtml(response);
    return bodyHtml;
  };

  const canSend = !chatDisabled && !isSending && prompt.trim().length > 0;

  const submit = async () => {
    const message = prompt.trim();
    if (!message || chatDisabled || isSending) return;
    await onSendMessage(message);
    setPrompt("");
  };

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
            className={`${enableHistoryNumbering ? "bg-green-300 text-green-950 hover:bg-green-400" : "bg-transparent text-muted-foreground hover:bg-muted"} h-7 w-7`}
            onClick={onToggleHistoryNumbering}
            title="Numerar Resultados"
            aria-label="Numerar Resultados"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${enableHistoryReferences ? "bg-green-300 text-green-950 hover:bg-green-400" : "bg-transparent text-muted-foreground hover:bg-muted"} h-7 w-7`}
            onClick={onToggleHistoryReferences}
            title="Inserir Referências"
            aria-label="Inserir Referências"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[11px] font-semibold"
            onClick={decreaseHistoryFont}
            title="Diminuir fonte dos cards"
            disabled={historyFontScale <= HISTORY_FONT_MIN}
          >
            A-
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[11px] font-semibold"
            onClick={increaseHistoryFont}
            title="Aumentar fonte dos cards"
            disabled={historyFontScale >= HISTORY_FONT_MAX}
          >
            A+
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={resetHistoryFont}
            title="Resetar fonte dos cards (xs)"
            disabled={historyFontScale === HISTORY_FONT_DEFAULT}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
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
              const shouldApplyNumberingToCard = enableHistoryNumbering;
              const shouldApplyReferencesToCard = enableHistoryReferences;
              return (
                <div key={r.id} className={`space-y-2 rounded-lg border border-border ${cardsBgClass} p-3`}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary" style={historyFontStyle}>
                    {meta.icon}
                    {meta.label}
                    <span className="ml-auto font-normal text-muted-foreground">
                      {r.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {(r.query || r.type === "app_random_pensata") && (
                    <p className="line-clamp-2 border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground" style={historyFontStyle}>
                      {renderQuerySubtitle(r)}
                    </p>
                  )}

                  <div
                    className={`prose prose-sm max-w-none text-xs text-foreground ${r.type === "app_verbete_frase_enfatica" ? "uppercase" : ""}`}
                    style={historyFontStyle}
                    onClick={r.type === "app_verbete_search" ? handlePdfIconClick : undefined}
                    dangerouslySetInnerHTML={{ __html: responseToEditorHtml(r, shouldApplyNumberingToCard, shouldApplyReferencesToCard) }}
                  />

                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void copyToClipboard(r)} title="Copiar resposta">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {showAppendToEditor && onAppendToEditor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => void onAppendToEditor(responseToAppendHtml(r))}
                        title="Inserir no editor ao final"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder={chatDisabled ? (chatDisabledReason || "Chat indisponivel no momento.") : "Pergunte algo para a IA..."}
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
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-lg border border-border bg-amber-50 text-muted-foreground shadow-sm transition hover:bg-zinc-50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={isSending}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;











