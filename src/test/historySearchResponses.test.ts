import { describe, expect, it } from "vitest";
import { buildLexicalOverviewHistoryResponsePayload, buildLexicalSearchHistoryResponsePayload, buildSemanticSearchHistoryResponsePayload, resolveSemanticSearchIndexLabel } from "@/features/ghost-writer/utils/historySearchResponses";

describe("historySearchResponses", () => {
  it("builds lexical markdown from explicit text and preserves query summary", () => {
    const payload = buildLexicalSearchHistoryResponsePayload({
      book: "LO",
      term: "autopensenidade",
      totalFound: 14,
      maxResults: 10,
      matches: [
        {
          book: "LO",
          row: 7,
          number: 12,
          title: "Autopensenidade",
          text: "Texto principal",
          pagina: "55",
          data: { area: "Mentalsomatologia" },
        },
      ],
    });

    expect(payload.markdown).toContain("Texto principal");
    expect(payload.markdown).toContain("(**Lexico de Ortopensatas**, p. 55)");
    expect(payload.markdown).toContain("p. 55");
    expect(payload.querySummary).toBe("Livro: Lexico de Ortopensatas | Termo: autopensenidade | Total: 14 | Exibidos: 10");
  });

  it("uses lexical fallback body from item data when text is empty", () => {
    const payload = buildLexicalSearchHistoryResponsePayload({
      book: "DAC",
      term: "recin",
      totalFound: 1,
      maxResults: 10,
      matches: [
        {
          book: "DAC",
          row: 3,
          number: null,
          title: "Tema",
          text: "   ",
          pagina: "",
          data: { argumento: "recin", area: "Experimentologia" },
        },
      ],
    });

    expect(payload.markdown).toContain("recin | Experimentologia");
  });

  it("filters out history search cards with empty body", () => {
    const payload = buildLexicalSearchHistoryResponsePayload({
      book: "LO",
      term: "vazio",
      totalFound: 1,
      maxResults: 10,
      matches: [
        {
          book: "LO",
          row: 1,
          number: null,
          title: "Sem corpo",
          text: "",
          pagina: "",
          data: {},
        },
      ],
    });

    expect(payload.markdown).toBe("");
  });

  it("builds lexical overview payload grouped by book and appends page in text", () => {
    const payload = buildLexicalOverviewHistoryResponsePayload({
      term: "cosmoetica",
      limit: 3,
      totalBooks: 2,
      totalFound: 5,
      groups: [
        {
          bookCode: "LO",
          bookLabel: "Lexico de Ortopensatas",
          fileStem: "LO",
          totalFound: 3,
          shownCount: 3,
          matches: [
            {
              book: "LO",
              row: 5,
              number: 1,
              title: "Cosmoetica",
              text: "Trecho do lexico",
              pagina: "41",
              data: { area: "Mentalsomatologia" },
            },
          ],
        },
        {
          bookCode: "QUEST",
          bookLabel: "QUEST",
          fileStem: "QUEST",
          totalFound: 2,
          shownCount: 2,
          matches: [
            {
              book: "QUEST",
              row: 8,
              number: 12,
              title: "Questao",
              text: "Trecho do quest",
              pagina: "",
              data: { author: "E.Q." },
            },
          ],
        },
      ],
    });

    expect(payload.querySummary).toBe("Termo: cosmoetica | Total: 5 | Livros: 2 | Limite por livro: 3");
    expect(payload.payload.kind).toBe("lexical_overview");
    expect(payload.payload.groups[0].matches[0].text).toBe("Trecho do lexico (p. 41)");
    expect(payload.payload.groups[1].bookLabel).toBe("QUEST");
    expect(payload.markdown).toContain("## Lexico de Ortopensatas (3/3)");
    expect(payload.markdown).toContain("Trecho do lexico (p. 41)");
  });

  it("formats QUEST text and references with question bold plus W prefix", () => {
    const payload = buildLexicalSearchHistoryResponsePayload({
      book: "QUEST",
      term: "abdicacoes",
      totalFound: 1,
      maxResults: 10,
      matches: [
        {
          book: "QUEST",
          row: 7,
          number: 2725,
          title: "Abdicaciologia",
          text: "\"Pergunta de teste\" | Resposta de teste",
          pagina: "39",
          data: {
            quest: "\"Pergunta de teste\"",
            answer: "Resposta de teste",
            date: "05/11/2014",
            author: "E.Q.",
          },
        },
      ],
    });

    expect(payload.markdown).toContain("**\"Pergunta de teste\"**[[HISTORY_SEARCH_BR]]**W:** Resposta de teste");
    expect(payload.markdown).toContain("(**QUEST**, 05/11/2014, E.Q., p. 39)");
  });

  it("normalizes QUEST answers that already start with W prefix", () => {
    const payload = buildLexicalSearchHistoryResponsePayload({
      book: "QUEST",
      term: "abdicacoes",
      totalFound: 1,
      maxResults: 10,
      matches: [
        {
          book: "QUEST",
          row: 7,
          number: 2725,
          title: "Abdicaciologia",
          text: "\"Pergunta de teste\" | W: Resposta de teste",
          pagina: "39",
          data: {
            quest: "\"Pergunta de teste\"",
            answer: "W: Resposta de teste",
            date: "05/11/2014",
            author: "E.Q.",
          },
        },
      ],
    });

    expect(payload.markdown).toContain("**\"Pergunta de teste\"**[[HISTORY_SEARCH_BR]]**W:** Resposta de teste");
    expect(payload.markdown).not.toContain("**W:** W:");
  });

  it("prefers QUEST answer metadata and strips repeated W prefixes from fallback text", () => {
    const payload = buildLexicalSearchHistoryResponsePayload({
      book: "QUEST",
      term: "amparadoras",
      totalFound: 1,
      maxResults: 10,
      matches: [
        {
          book: "QUEST",
          row: 48,
          number: 1,
          title: "Amparologia",
          text: "Qual o objetivo? | W: W: Texto contaminado",
          pagina: "",
          data: {
            quest: "Qual o objetivo?",
            answer: "Foi uma miniclarividencia impressionante.",
            date: "06/05/2013",
            author: "L.L.",
          },
        },
      ],
    });

    expect(payload.markdown).toContain("**Qual o objetivo?**[[HISTORY_SEARCH_BR]]**W:** Foi uma miniclarividencia impressionante.");
    expect(payload.markdown).not.toContain("**W:** W:");
    expect(payload.markdown).not.toContain("Texto contaminado");
  });

  it("resolves semantic index label from match before selected index fallback", () => {
    const label = resolveSemanticSearchIndexLabel({
      selectedIndexId: "LO",
      indexes: [{ id: "LO", label: "Indice LO", sourceFile: "", sourceRows: 0, model: "", dimensions: 0, embeddingDtype: "", suggestedMinScore: 0.53 }],
      matches: [
        {
          book: "LO",
          index_id: "LO",
          index_label: "Match Label",
          row: 4,
          text: "Pensata",
          metadata: {},
          score: 0.9,
        },
      ],
    });

    expect(label).toBe("Match Label");
  });

  it("builds semantic markdown with selected index fallback and truncated query", () => {
    const query = "x".repeat(130);
    const payload = buildSemanticSearchHistoryResponsePayload({
      selectedIndexId: "DAC",
      indexes: [{ id: "DAC", label: "Indice DAC", sourceFile: "", sourceRows: 0, model: "", dimensions: 0, embeddingDtype: "", suggestedMinScore: 0.65 }],
      query,
      totalFound: 7,
      requestedMinScore: 0.25,
      recommendedMinScore: 0.65,
      minScore: 0.65,
      lexicalFilteredCount: 2,
      matches: [
        {
          book: "DAC",
          index_id: "DAC",
          index_label: "",
          row: 8,
          text: "Pensata relacionada",
          metadata: { title: "Tema semantico", author: "Autor X" },
          score: 0.82,
        },
      ],
    });

    expect(payload.markdown).toContain("Pensata relacionada");
    expect(payload.markdown).toContain("(**Indice DAC**)");
    expect(payload.markdown).toContain("Indice DAC | Tema semantico | author: Autor X");
    expect(payload.markdown).toContain("score: 0.82");
    expect(payload.querySummary).toBe(`Base: Indice DAC | Consulta: ${"x".repeat(117)}... | Total semantic: 7 | Score minimo efetivo: 0.65 | Calibrado da base: 0.65 | Duplicados lexicos filtrados: 2`);
  });
});
