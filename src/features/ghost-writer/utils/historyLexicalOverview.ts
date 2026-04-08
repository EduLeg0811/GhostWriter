import { renderHistorySearchCardsHtml } from "@/lib/historySearchCards";
import type { LexicalOverviewHistoryGroup, LexicalOverviewHistoryPayload } from "@/features/ghost-writer/types";
import { buildLexicalOverviewGroupMarkdown } from "@/features/ghost-writer/utils/historySearchResponses";

type LexicalOverviewRenderOptions = {
  applyNumbering: boolean;
  applyReferences: boolean;
  applyMetadata: boolean;
  applyHighlight: boolean;
};

const parseHtmlRoot = (html: string): { doc: Document; root: HTMLDivElement } | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLDivElement | null;
  if (!root) return null;
  return { doc, root };
};

const escapeHtml = (value: string): string =>
  (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractSearchQuery = (query: string): string => {
  const raw = query || "";
  const withTotal = raw.match(/Termo:\s*([\s\S]*?)\s*\|\s*Total:/i);
  if (withTotal?.[1]) return withTotal[1].trim();
  const fallback = raw.match(/Termo:\s*([\s\S]*?)$/i);
  return (fallback?.[1] || "").trim();
};

const extractHighlightTerms = (query: string): string[] => {
  const raw = extractSearchQuery(query);
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

const highlightLexicalOverviewHtml = (html: string, query: string): string => {
  const terms = extractHighlightTerms(query);
  if (terms.length === 0) return html;

  const parsed = parseHtmlRoot(html);
  if (!parsed) return html;
  const { doc, root } = parsed;
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
      if (offset > lastIndex) fragment.appendChild(doc.createTextNode(value.slice(lastIndex, offset)));
      const mark = doc.createElement("mark");
      mark.setAttribute("style", "background-color:#fef08a;padding:0 .08em;");
      mark.textContent = match;
      fragment.appendChild(mark);
      lastIndex = offset + match.length;
      return match;
    });
    if (lastIndex < value.length) fragment.appendChild(doc.createTextNode(value.slice(lastIndex)));
    node.parentNode?.replaceChild(fragment, node);
  }

  return root.innerHTML;
};

const buildGroupSubtitle = (group: LexicalOverviewHistoryGroup): string => {
  const fileStem = (group.fileStem || "").trim();
  const bookCode = (group.bookCode || "").trim();
  if (!fileStem) return `${group.shownCount}/${group.totalFound}`;
  if (fileStem.toUpperCase() === bookCode.toUpperCase()) return `${group.shownCount}/${group.totalFound}`;
  return `${fileStem} · ${group.shownCount}/${group.totalFound}`;
};

export const renderLexicalOverviewGroupHtml = (
  group: LexicalOverviewHistoryGroup,
  query: string,
  options: LexicalOverviewRenderOptions,
): string => {
  const markdown = buildLexicalOverviewGroupMarkdown(group);
  const renderedHtml = renderHistorySearchCardsHtml(markdown, {
    applyNumbering: options.applyNumbering,
    showSourceLine: options.applyReferences,
    showMetadata: options.applyMetadata,
  });
  return options.applyHighlight ? highlightLexicalOverviewHtml(renderedHtml, query) : renderedHtml;
};

export const renderLexicalOverviewPayloadHtml = (
  payload: LexicalOverviewHistoryPayload,
  query: string,
  options: LexicalOverviewRenderOptions,
): string => {
  const parsed = parseHtmlRoot("");
  if (!parsed) return "";
  const { doc, root } = parsed;

  payload.groups.forEach((group) => {
    const section = doc.createElement("section");
    section.style.marginBottom = "1em";

    const header = doc.createElement("p");
    header.innerHTML = `<strong>${escapeHtml(group.bookLabel)}</strong><span style="color:#64748b;"> ${escapeHtml(buildGroupSubtitle(group))}</span>`;
    header.style.margin = "0 0 0.35em 0";
    header.style.color = "#1e3a8a";
    header.style.fontWeight = "700";
    section.appendChild(header);

    const content = doc.createElement("div");
    content.innerHTML = renderLexicalOverviewGroupHtml(group, query, options);
    section.appendChild(content);

    root.appendChild(section);
  });

  return root.innerHTML;
};

export const buildLexicalOverviewPillLabel = (group: LexicalOverviewHistoryGroup): string => group.bookLabel;
