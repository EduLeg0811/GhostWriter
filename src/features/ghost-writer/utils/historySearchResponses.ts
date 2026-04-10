import { buildHistorySearchCardsMarkdown, replaceHistorySearchInlineBreaks, type HistorySearchCardInput, type HistorySearchCardMetadata } from "@/lib/historySearchCards";
import { BOOK_OPTION_LABELS } from "@/features/ghost-writer/config/metadata";
import type { LexicalHistoryMatch, LexicalOverviewHistoryGroup, LexicalOverviewHistoryPayload, SemanticIndexOption, SemanticOverviewHistoryGroup, SemanticOverviewHistoryPayload } from "@/features/ghost-writer/types";
import { buildLexicalHistorySearchMetadata, buildSemanticHistorySearchMetadata } from "@/features/ghost-writer/utils/historySearch";

type HistorySearchResponsePayload = {
  markdown: string;
  querySummary: string;
};

type LexicalOverviewResponsePayload = HistorySearchResponsePayload & {
  payload: LexicalOverviewHistoryPayload;
};

type SemanticOverviewResponsePayload = HistorySearchResponsePayload & {
  payload: SemanticOverviewHistoryPayload;
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

const isQuestMatch = (match: LexicalHistoryMatch): boolean =>
  (match.book || "").trim().toUpperCase() === "QUEST" || Boolean((match.data?.quest || "").trim());

const normalizeQuestAnswer = (value: string): string =>
  (value || "")
    .trim()
    .replace(/^(?:(?:\*{0,2})?W:(?:\*{0,2})?\s*)+/i, "")
    .trim();

const formatQuestMatchText = (match: LexicalHistoryMatch): string => {
  const rawText = (match.text || "").trim();
  if (!rawText) return rawText;

  const quest = (match.data?.quest || "").trim();
  const separatorIndex = rawText.indexOf("|");
  if (separatorIndex < 0) {
    const question = quest || rawText;
    return `**${question}**`;
  }

  const question = quest || rawText.slice(0, separatorIndex).trim();
  const answer = String(match.data?.answer || rawText.slice(separatorIndex + 1) || "").trim();
  const normalizedAnswer = normalizeQuestAnswer(answer);
  return `**${question}** | **W:** ${normalizedAnswer}`.trim();
};

const formatLexicalMatchText = (match: LexicalHistoryMatch): string => {
  const text = (match.text || "").trim();
  if (!text) return text;
  return isQuestMatch(match) ? formatQuestMatchText(match) : text;
};

export const buildLexicalSearchHistoryResponsePayload = (params: {
  book: string;
  term: string;
  totalFound: number;
  maxResults: number;
  matches: LexicalHistoryMatch[];
}): HistorySearchResponsePayload => {
  const { book, term, totalFound, maxResults, matches } = params;
  const markdown = buildHistorySearchCards(matches, {
    getTextParagraphs: (item) => {
      const text = replaceHistorySearchInlineBreaks(formatLexicalMatchText(item));
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

export const buildLexicalOverviewGroupMarkdown = (group: Pick<LexicalOverviewHistoryGroup, "matches">): string => buildHistorySearchCardsFromCards(matchesToCards(group.matches));

const matchesToCards = (matches: LexicalHistoryMatch[]): HistorySearchCardInput[] =>
  matches
    .map((match) => ({
      textParagraphs: normalizeParagraphs([replaceHistorySearchInlineBreaks(formatLexicalMatchText(match)) || Object.values(match.data || {}).filter(Boolean).join(" | ")]),
      metadata: buildLexicalHistorySearchMetadata(match, match.book),
    }))
    .filter((item) => item.textParagraphs.length > 0);

const buildHistorySearchCardsFromCards = (cards: HistorySearchCardInput[]): string => buildHistorySearchCardsMarkdown(cards);

const buildLexicalOverviewFallbackContent = (payload: LexicalOverviewHistoryPayload): string =>
  payload.groups
    .map((group) => {
      const header = `## ${group.bookLabel} (${group.shownCount}/${group.totalFound})`;
      const body = buildLexicalOverviewGroupMarkdown(group);
      return [header, body].filter(Boolean).join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");

export const buildLexicalOverviewHistoryResponsePayload = (params: {
  term: string;
  limit: number;
  totalBooks: number;
  totalFound: number;
  groups: LexicalOverviewHistoryGroup[];
}): LexicalOverviewResponsePayload => {
  const groups = params.groups.map((group) => ({
    ...group,
    matches: group.matches.map((match) => {
      const page = (match.pagina || "").trim();
      const text = formatLexicalMatchText(match);
      const textWithPage = text && page ? `${text} (p. ${page})` : text;
      return {
        ...match,
        text: textWithPage,
      };
    }),
  }));

  const payload: LexicalOverviewHistoryPayload = {
    kind: "lexical_overview",
    term: params.term,
    limit: params.limit,
    totalBooks: params.totalBooks,
    totalFound: params.totalFound,
    groups,
  };

  return {
    payload,
    markdown: buildLexicalOverviewFallbackContent(payload),
    querySummary: `Termo: ${params.term} | Total: ${params.totalFound} | Livros: ${params.totalBooks} | Limite por livro: ${params.limit}`,
  };
};

export const buildSemanticOverviewGroupMarkdown = (group: Pick<SemanticOverviewHistoryGroup, "matches">): string => buildHistorySearchCardsFromCards(
  group.matches
    .map((match) => ({
      textParagraphs: normalizeParagraphs([(match.text || "").trim()]),
      metadata: buildSemanticHistorySearchMetadata(match, match.index_label),
    }))
    .filter((item) => item.textParagraphs.length > 0),
);

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

export const buildSemanticOverviewHistoryResponsePayload = (params: {
  term: string;
  limit: number;
  totalIndexes: number;
  totalFound: number;
  groups: SemanticOverviewHistoryGroup[];
}): SemanticOverviewResponsePayload => {
  const payload: SemanticOverviewHistoryPayload = {
    kind: "semantic_overview",
    term: params.term,
    limit: params.limit,
    totalIndexes: params.totalIndexes,
    totalFound: params.totalFound,
    groups: params.groups,
  };

  const markdown = payload.groups
    .map((group) => {
      const header = `## ${group.indexLabel} (${group.shownCount}/${group.totalFound})`;
      const body = buildSemanticOverviewGroupMarkdown(group);
      return [header, body].filter(Boolean).join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return {
    payload,
    markdown,
    querySummary: `Termo: ${params.term} | Total: ${params.totalFound} | Bases: ${params.totalIndexes} | Limite global: ${params.limit}`,
  };
};
