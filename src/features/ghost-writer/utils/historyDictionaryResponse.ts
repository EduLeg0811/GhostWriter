type OnlineDictionaryResult = {
  term: string;
  sources_total: number;
  sources_ok: number;
  sources_failed: number;
  elapsed_ms: number;
  summary: {
    definitions: string[];
    synonyms: string[];
    examples: string[];
    etymology: string | null;
  };
  results: Array<{
    source: string;
    ok: boolean;
    url: string | null;
    elapsed_ms: number;
    quality_score: number;
    definitions: string[];
    synonyms: string[];
    examples: string[];
    etymology: string | null;
    query_term: string | null;
    retry_without_accents: boolean;
    error: string | null;
  }>;
};

type HistoryDictionaryResponsePayload = {
  querySummary: string;
  markdown: string;
};

const asBulletList = (items: string[], limit: number): string[] =>
  items.slice(0, limit).map((item) => `- ${item}`);

export const buildOnlineDictionaryHistoryResponsePayload = (
  result: OnlineDictionaryResult,
): HistoryDictionaryResponsePayload => {
  const summaryDefinitions = asBulletList(result.summary.definitions, 6);
  const summarySynonyms = asBulletList(result.summary.synonyms, 10);
  const summaryExamples = asBulletList(result.summary.examples, 4);

  const sections: string[] = [
    `**Consulta Dict**`,
    `- **Termo**: ${result.term}`,
    `- **Fontes válidas**: ${result.sources_ok}/${result.sources_total}`,
    `- **Latência total**: ${result.elapsed_ms} ms`,
    "",
    `**Definições priorizadas**`,
    ...(summaryDefinitions.length > 0 ? summaryDefinitions : ["- Nenhuma definição consolidada."]),
  ];

  if (summarySynonyms.length > 0) {
    sections.push("", `**Sinônimos**`, ...summarySynonyms);
  }
  if (result.summary.etymology) {
    sections.push("", `**Etimologia**`, result.summary.etymology);
  }
  if (summaryExamples.length > 0) {
    sections.push("", `**Exemplos**`, ...summaryExamples);
  }

  sections.push("", `**Fontes consultadas**`);

  for (const item of result.results) {
    sections.push("", `### ${item.source}`);
    sections.push(`- **Status**: ${item.ok ? "OK" : "Falha"}`);
    sections.push(`- **Score**: ${item.quality_score}`);
    sections.push(`- **Latência**: ${item.elapsed_ms} ms`);
    if (item.query_term) {
      sections.push(`- **Termo consultado**: ${item.query_term}${item.retry_without_accents ? " (retry sem acento)" : ""}`);
    }

    if (item.ok) {
      const sourceDefinitions = asBulletList(item.definitions, 3);
      sections.push(`- **Definições**:`);
      sections.push(...(sourceDefinitions.length > 0 ? sourceDefinitions : ["- Nenhuma definição aproveitável."]));
      if (item.synonyms.length > 0) {
        sections.push(`- **Sinônimos**: ${item.synonyms.slice(0, 8).join(", ")}`);
      }
      if (item.etymology) {
        sections.push(`- **Etimologia**: ${item.etymology}`);
      }
      if (item.examples.length > 0) {
        sections.push(`- **Exemplos**: ${item.examples.slice(0, 3).join(" | ")}`);
      }
    } else {
      sections.push(`- **Falha na consulta**: ${item.error || "nenhuma definição extraída"}`);
    }

    if (item.url) {
      sections.push(`- **URL**: ${item.url}`);
    }
  }

  return {
    querySummary: `Termo: ${result.term} | Fontes válidas: ${result.sources_ok}/${result.sources_total}`,
    markdown: sections.join("\n"),
  };
};
