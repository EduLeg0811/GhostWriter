import type { Editor } from "@tiptap/react";

export interface HtmlEditorSelectionSnapshot {
  text: string;
  selectionType: string;
  changedAt: number;
}

type SelectionListener = (snapshot: HtmlEditorSelectionSnapshot) => void;

const SPACING_SUFFIX_MAP = {
  normal_single: " ",
  normal_double: "  ",
  nbsp_single: "\u00A0",
  nbsp_double: "\u00A0\u00A0",
} as const;

const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: "#fef08a",
  green: "#86efac",
  cyan: "#a5f3fc",
  magenta: "#f5d0fe",
  blue: "#bfdbfe",
  red: "#fecaca",
};

function documentStatsFromText(text: string) {
  const raw = text || "";
  const trimmed = raw.trim();
  const paragraphs = trimmed
    ? trimmed.split(/\n+/).map((item) => item.trim()).filter(Boolean).length
    : 0;
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const symbolsWithSpaces = raw.length;
  const symbols = raw.replace(/\s+/g, "").length;
  const pages = symbolsWithSpaces > 0 ? Math.max(1, Math.ceil(symbolsWithSpaces / 3000)) : 0;
  return { pages, paragraphs, words, symbols, symbolsWithSpaces };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveHighlightColor(color: string): string {
  const key = (color || "").trim().toLowerCase();
  if (!key) return HIGHLIGHT_COLOR_MAP.yellow;
  return HIGHLIGHT_COLOR_MAP[key] || color;
}

function highlightInHtml(html: string, term: string, color: string): { html: string; matches: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html || ""}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLDivElement | null;
  if (!root) return { html, matches: 0 };

  const regex = new RegExp(escapeRegExp(term), "gi");
  let matches = 0;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (!textNode.nodeValue) continue;
    const parentTag = textNode.parentElement?.tagName?.toLowerCase();
    if (parentTag === "mark") continue;
    nodes.push(textNode);
  }

  for (const textNode of nodes) {
    const value = textNode.nodeValue || "";
    regex.lastIndex = 0;
    if (!regex.test(value)) continue;

    const fragment = doc.createDocumentFragment();
    let lastIndex = 0;
    value.replace(regex, (match, offset) => {
      if (offset > lastIndex) {
        fragment.appendChild(doc.createTextNode(value.slice(lastIndex, offset)));
      }
      const mark = doc.createElement("mark");
      mark.setAttribute("data-color", color || "yellow");
      mark.textContent = match;
      fragment.appendChild(mark);
      lastIndex = offset + match.length;
      matches += 1;
      return match;
    });
    if (lastIndex < value.length) {
      fragment.appendChild(doc.createTextNode(value.slice(lastIndex)));
    }
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return { html: root.innerHTML, matches };
}

function clearHighlightInHtml(html: string, term: string): { html: string; matches: number; cleared: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html || ""}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLDivElement | null;
  if (!root) return { html, matches: 0, cleared: 0 };

  const regex = new RegExp(escapeRegExp(term), "i");
  const marks = Array.from(root.querySelectorAll("mark"));
  let matches = 0;
  let cleared = 0;

  for (const mark of marks) {
    const text = mark.textContent || "";
    if (!regex.test(text)) continue;
    matches += 1;
    const textNode = doc.createTextNode(text);
    mark.parentNode?.replaceChild(textNode, mark);
    cleared += 1;
  }

  return { html: root.innerHTML, matches, cleared };
}

function countOccurrencesInHtml(html: string, term: string): number {
  const normalizedTerm = (term || "").trim();
  if (!normalizedTerm) return 0;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html || ""}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLDivElement | null;
  if (!root) return 0;

  const regex = new RegExp(escapeRegExp(normalizedTerm), "gi");
  let matches = 0;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const value = textNode.nodeValue || "";
    if (!value) continue;
    regex.lastIndex = 0;
    const found = value.match(regex);
    if (found?.length) {
      matches += found.length;
    }
  }

  return matches;
}

function normalizeAppendHtml(html: string): string {
  const raw = (html || "").trim();
  if (!raw) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${raw}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLDivElement | null;
  if (!root) return raw;

  const isEmptyParagraph = (el: Element): boolean => {
    if (el.tagName.toLowerCase() !== "p") return false;
    const text = (el.textContent || "").replace(/\u00a0/g, " ").trim();
    const hasMedia = Boolean(el.querySelector("img,video,audio,iframe,table,ul,ol,blockquote,pre,hr"));
    return !text && !hasMedia;
  };

  // Remove paragrafos vazios para evitar quebras extras antes/depois do bloco colado.
  for (const child of Array.from(root.children)) {
    if (isEmptyParagraph(child)) child.remove();
  }

  return root.innerHTML.trim();
}

function normalizeAppendText(text: string): string {
  return (text || "").replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n").trim();
}

export class HtmlEditorControlApi {
  private editor: Editor;
  private listeners = new Set<SelectionListener>();
  private lastSelection: HtmlEditorSelectionSnapshot = {
    text: "",
    selectionType: "none",
    changedAt: Date.now(),
  };

  constructor(editor: Editor) {
    this.editor = editor;
  }

  init(): void {
    this.editor.on("selectionUpdate", this.emitSelectionChange);
    this.emitSelectionChange();
  }

  destroy(): void {
    this.editor.off("selectionUpdate", this.emitSelectionChange);
    this.listeners.clear();
  }

  onSelectionChanged(listener: SelectionListener): () => void {
    this.listeners.add(listener);
    listener(this.lastSelection);
    return () => this.listeners.delete(listener);
  }

  async getSelectedText(): Promise<string> {
    const { from, to, empty } = this.editor.state.selection;
    if (empty) return "";
    return this.editor.state.doc.textBetween(from, to, "\n").trim();
  }

  async selectAllContent(): Promise<void> {
    this.editor.commands.focus();
    this.editor.commands.selectAll();
    this.emitSelectionChange();
  }

  async getDocumentStats(): Promise<{ pages: number; paragraphs: number; words: number; symbols: number; symbolsWithSpaces: number }> {
    return documentStatsFromText(this.editor.getText({ blockSeparator: "\n" }));
  }

  async getDocumentText(): Promise<string> {
    return this.editor.getText({ blockSeparator: "\n" });
  }

  async getDocumentHtml(): Promise<string> {
    return this.editor.getHTML();
  }

  async replaceSelectionRich(text: string, html: string): Promise<void> {
    const htmlContent = (html || "").trim();
    const textContent = (text || "").trim();
    if (!htmlContent && !textContent) throw new Error("Texto vazio para substituir.");

    this.editor.commands.focus();
    if (htmlContent) {
      this.editor.commands.insertContent(htmlContent);
    } else {
      this.editor.commands.insertContent(textContent);
    }
    this.emitSelectionChange();
  }

  async appendRichWithBlankLine(html: string, text = ""): Promise<void> {
    const htmlContent = normalizeAppendHtml(html);
    const textContent = normalizeAppendText(text);
    if (!htmlContent && !textContent) throw new Error("Conteudo vazio para inserir.");

    this.editor
      .chain()
      .focus("end")
      // Insere 1 linha em branco antes do bloco colado.
      .insertContent("<p> </p>")
      .insertContent("<p>_________________________________________________________</p>")
      .insertContent("<p> </p>")

      .insertContent(htmlContent || textContent)
      .run();
    this.emitSelectionChange();
  }

  async runMacro1HighlightDocument(text: string, color = "yellow"): Promise<{ terms: number; matches: number; highlighted: number; color: string }> {
    const term = (text || "").trim();
    if (!term) throw new Error("Informe o Texto de entrada para a Macro1.");

    const resolvedColor = resolveHighlightColor(color);
    const { html, matches } = highlightInHtml(this.editor.getHTML(), term, resolvedColor);
    this.editor.commands.setContent(html, { emitUpdate: true });
    return { terms: 1, matches, highlighted: matches, color: resolvedColor };
  }

  async clearMacro1HighlightDocument(text: string): Promise<{ terms: number; matches: number; cleared: number }> {
    const term = (text || "").trim();
    if (!term) throw new Error("Informe o Texto de entrada para limpar marcacoes da Macro1.");

    const { html, matches, cleared } = clearHighlightInHtml(this.editor.getHTML(), term);
    this.editor.commands.setContent(html, { emitUpdate: true });
    return { terms: 1, matches, cleared };
  }

  async countOccurrencesInDocument(term: string): Promise<number> {
    return countOccurrencesInHtml(this.editor.getHTML(), term);
  }

  async runMacro2ManualNumberingSelection(
    spacingMode: "normal_single" | "normal_double" | "nbsp_single" | "nbsp_double" = "nbsp_double",
  ): Promise<{ converted: number; hadNumbering: number }> {
    const { state, view } = this.editor;
    const { from, to } = state.selection;

    const selectedParagraphStarts: number[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name !== "paragraph") return;
      if (!node.textContent.trim()) return;
      selectedParagraphStarts.push(pos + 1);
    });

    if (selectedParagraphStarts.length === 0) {
      throw new Error("Selecione uma lista no editor.");
    }

    const suffix = SPACING_SUFFIX_MAP[spacingMode] || SPACING_SUFFIX_MAP.nbsp_double;
    const useLeadingZero = selectedParagraphStarts.length > 9;
    let tr = state.tr;

    // Insert from bottom to top so previously inserted prefixes don't shift upcoming positions.
    for (let i = selectedParagraphStarts.length - 1; i >= 0; i -= 1) {
      const itemNumber = i + 1;
      const number = useLeadingZero ? String(itemNumber).padStart(2, "0") : String(itemNumber);
      tr = tr.insertText(`${number}.${suffix}`, selectedParagraphStarts[i], selectedParagraphStarts[i]);
    }

    if (tr.docChanged) {
      view.dispatch(tr);
    }

    return { converted: selectedParagraphStarts.length, hadNumbering: selectedParagraphStarts.length };
  }

  private emitSelectionChange = () => {
    const { from, to, empty } = this.editor.state.selection;
    const text = empty ? "" : this.editor.state.doc.textBetween(from, to, "\n");
    const snapshot: HtmlEditorSelectionSnapshot = {
      text,
      selectionType: empty ? "none" : "range",
      changedAt: Date.now(),
    };
    this.lastSelection = snapshot;
    for (const listener of this.listeners) listener(snapshot);
  };
}
