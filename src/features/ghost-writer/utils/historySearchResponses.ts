import { buildHistorySearchCardsMarkdown, type HistorySearchCardInput, type HistorySearchCardMetadata } from "@/lib/historySearchCards";
import { BOOK_OPTION_LABELS } from "@/features/ghost-writer/config/metadata";
import type { SemanticIndexOption } from "@/features/ghost-writer/types";
import { buildLexicalHistorySearchMetadata, buildSemanticHistorySearchMetadata } from "@/features/ghost-writer/utils/historySearch";

type HistorySearchResponsePayload = {
  markdown: string;
  querySummary: string;
};

type LexicalSearchMatch = {
  book: string;
  row: number;
  number: number | null;
  title: string;
  text: string;
  data: Record<string, string>;
};

type SemanticSearchMatch = {
  book: string;
  index_id: string;
  index_label: string;
  row: number;
  text: string;
  metadata: Record<string, unknown>;
  score: number;
};

const normalizeParagraphs = (paragraphs: Array<string | null | undefined>): string[] =>
  paragraphs
    .map((paragraph) => (paragraph || "").trim())
    .filter(Boolean);

const buildHistorySearchCards = <TMatch>(
  matches: TMatch[],
  options: {
    getTextParagraphs: (match: TMatch) => Array<string | null | undefined>;
    getMetadata: (match: TMatch) => HistorySearchCardMetadata;
  },
): string => {
  const cards: HistorySearchCardInput[] = matches
    .map((match) => ({
      textParagraphs: normalizeParagraphs(options.getTextParagraphs(match)),
      metadata: options.getMetadata(match),
    }))
    .filter((item) => item.textParagraphs.length > 0);

  return buildHistorySearchCardsMarkdown(cards);
};

const truncateQuery = (query: string, maxLength: number): string =>
  query.length > maxLength ? `${query.slice(0, maxLength - 3)}...` : query;

export const buildLexicalSearchHistoryResponsePayload = (params: {
  book: string;
  term: string;
  totalFound: number;
  maxResults: number;
  matches: LexicalSearchMatch[];
}): HistorySearchResponsePayload => {
  const { book, term, totalFound, maxResults, matches } = params;
  const markdown = buildHistorySearchCards(matches, {
    getTextParagraphs: (item) => {
      const text = (item.text || "").trim();
      const fallbackBody = Object.values(item.data || {}).filter(Boolean).join(" | ");
      return [text || fallbackBody];
    },
    getMetadata: (item) => buildLexicalHistorySearchMetadata(item, book),
  });
  const shownInfo = totalFound > maxResults ? ` | Exibidos: ${maxResults}` : "";

  return {
    markdown,
    querySummary: `Livro: ${BOOK_OPTION_LABELS[book] ?? book} | Termo: ${term} | Total: ${totalFound}${shownInfo}`,
  };
};

export const resolveSemanticSearchIndexLabel = (params: {
  matches: SemanticSearchMatch[];
  selectedIndexId: string;
  indexes: SemanticIndexOption[];
}): string =>
  params.matches[0]?.index_label?.trim() ||
  params.indexes.find((item) => item.id === params.selectedIndexId)?.label ||
  params.selectedIndexId;

export const buildSemanticSearchHistoryResponsePayload = (params: {
  selectedIndexId: string;
  indexes: SemanticIndexOption[];
  query: string;
  matches: SemanticSearchMatch[];
}): HistorySearchResponsePayload => {
  const { selectedIndexId, indexes, query, matches } = params;
  const indexLabel = resolveSemanticSearchIndexLabel({ matches, selectedIndexId, indexes });
  const markdown = buildHistorySearchCards(matches, {
    getTextParagraphs: (item) => [(item.text || "").trim()],
    getMetadata: (item) => buildSemanticHistorySearchMetadata(item, indexLabel),
  });

  return {
    markdown,
    querySummary: `Base: ${indexLabel} | Consulta: ${truncateQuery(query, 120)} | Total: ${matches.length}`,
  };
};
