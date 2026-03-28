import { describe, expect, it } from "vitest";
import { buildLexicalSearchHistoryResponsePayload, buildSemanticSearchHistoryResponsePayload, resolveSemanticSearchIndexLabel } from "@/features/ghost-writer/utils/historySearchResponses";

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
          data: { area: "Mentalsomatologia" },
        },
      ],
    });

    expect(payload.markdown).toContain("Texto principal");
    expect(payload.markdown).toContain("(**Lexico de Ortopensatas**; Autopensenidade)");
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
          data: {},
        },
      ],
    });

    expect(payload.markdown).toBe("");
  });

  it("resolves semantic index label from match before selected index fallback", () => {
    const label = resolveSemanticSearchIndexLabel({
      selectedIndexId: "LO",
      indexes: [{ id: "LO", label: "Indice LO", sourceFile: "", sourceRows: 0, model: "", dimensions: 0, embeddingDtype: "" }],
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
      indexes: [{ id: "DAC", label: "Indice DAC", sourceFile: "", sourceRows: 0, model: "", dimensions: 0, embeddingDtype: "" }],
      query,
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
    expect(payload.markdown).toContain("(**Indice DAC**; Tema semantico)");
    expect(payload.querySummary).toBe(`Base: Indice DAC | Consulta: ${"x".repeat(117)}... | Total: 1`);
  });
});
