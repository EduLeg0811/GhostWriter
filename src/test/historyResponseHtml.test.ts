import { describe, expect, it } from "vitest";
import { historyHtmlToPlainText, renderHistoryResponseAppendBodyHtml, renderHistoryResponseCopyHtml, renderHistoryResponseEditorHtml } from "@/features/ghost-writer/utils/historyResponseHtml";
import type { AIResponse } from "@/features/ghost-writer/types";

const buildResponse = (type: AIResponse["type"], query: string, content: string, payload?: AIResponse["payload"]): AIResponse => ({
  id: `${type}-1`,
  type,
  query,
  content,
  payload,
  timestamp: new Date("2026-03-27T12:00:00.000Z"),
});

describe("historyResponseHtml", () => {
  it("highlights lexical search terms in rendered history cards", () => {
    const response = buildResponse(
      "app_book_search",
      "Livro: Lexico de Ortopensatas | Termo: recin | Total: 1",
      "Texto com recin destacado\n(**LO**; Autopensenidade)\nLO | Autopensenidade | #1",
    );

    const html = renderHistoryResponseEditorHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });

    expect(html).toContain("<mark");
    expect(html).toContain("recin");
  });

  it("hides highlight when the history highlight toggle is disabled", () => {
    const response = buildResponse(
      "app_book_search",
      "Livro: Lexico de Ortopensatas | Termo: recin | Total: 1",
      "Texto com recin destacado\n(**LO**; Autopensenidade)\nLO | Autopensenidade | #1",
    );

    const html = renderHistoryResponseEditorHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: false,
    });

    expect(html).not.toContain("<mark");
    expect(html).toContain("recin");
  });

  it("copies history search with numbering and optional source line based on references toggle", () => {
    const response = buildResponse(
      "app_book_search",
      "Livro: Lexico de Ortopensatas | Termo: recin | Total: 1",
      [
        "Texto com recin destacado",
        "(**LO**; Autopensenidade)",
        "LO | Autopensenidade | #1",
      ].join("\n"),
    );

    const withReferences = renderHistoryResponseCopyHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: false,
      applyHighlight: true,
    });
    const withoutReferences = renderHistoryResponseCopyHtml(response, {
      applyNumbering: true,
      applyReferences: false,
      applyMetadata: false,
      applyHighlight: true,
    });

    expect(withReferences).toContain("<strong>1.</strong>");
    expect(withReferences).toContain("Texto com <mark");
    expect(withReferences).toContain("<strong>LO</strong>; Autopensenidade");
    expect(withReferences).not.toContain("LO | Autopensenidade | #1");
    expect(historyHtmlToPlainText(withReferences)).toContain("1.  Texto com recin destacado");

    expect(withoutReferences).toContain("<strong>1.</strong>");
    expect(withoutReferences).not.toContain("<strong>LO</strong>; Autopensenidade");
    expect(withoutReferences).not.toContain("LO | Autopensenidade | #1");
  });

  it("renders verbete search with inline pdf download anchor in the history card", () => {
    const response = buildResponse(
      "app_verbete_search",
      "Title: Titulo",
      [
        "**Titulo Base** (*Area Teste*) - *Autor Teste* - # 7 - 2025-01-02",
        "**Definologia.** Texto do verbete.",
        "[PDF](https://example.com/verbete.pdf)",
      ].join("\n"),
    );

    const html = renderHistoryResponseEditorHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });

    expect(html).toContain("data-pdf-download-url=\"https://example.com/verbete.pdf\"");
    expect(html).toContain("display: flex");
    expect(html).toContain("padding-left: 28px");
    expect(html).toContain("Texto do verbete.");
    expect(html).not.toContain(">PDF<");
  });

  it("removes verbete pdf links from append and copy html while keeping text", () => {
    const response = buildResponse(
      "app_verbete_search",
      "Title: Titulo",
      [
        "**Titulo Base** (*Area Teste*) - *Autor Teste* - # 7 - 2025-01-02",
        "**Definologia.** Texto do verbete.",
        "[PDF](https://example.com/verbete.pdf)",
      ].join("\n"),
    );

    const appendHtml = renderHistoryResponseAppendBodyHtml(response);
    const copyHtml = renderHistoryResponseCopyHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });

    expect(appendHtml).toContain("Texto do verbete.");
    expect(appendHtml).not.toContain("data-pdf-download-url");
    expect(appendHtml).not.toContain("https://example.com/verbete.pdf");

    expect(copyHtml).toContain("Texto do verbete.");
    expect(copyHtml).not.toContain("data-pdf-download-url");
    expect(copyHtml).not.toContain("https://example.com/verbete.pdf");
    expect(historyHtmlToPlainText(copyHtml)).toContain("Texto do verbete.");
  });

  it("appends history search respecting numbering, references, and metadata toggle", () => {
    const response = buildResponse(
      "app_semantic_search",
      "Base: LO | Consulta: recin | Total: 1",
      [
        "Texto semantico",
        "(**LO**; Titulo semantico)",
        "LO | Titulo semantico | #4",
      ].join("\n"),
    );

    const withReferencesAndMetadata = renderHistoryResponseAppendBodyHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });
    const withoutReferencesAndMetadata = renderHistoryResponseAppendBodyHtml(response, {
      applyNumbering: false,
      applyReferences: false,
      applyMetadata: false,
      applyHighlight: true,
    });

    expect(withReferencesAndMetadata).toContain("<strong>1.</strong>");
    expect(withReferencesAndMetadata).toContain("<strong>LO</strong>; Titulo semantico");
    expect(withReferencesAndMetadata).toContain("LO | Titulo semantico | #4");

    expect(withoutReferencesAndMetadata).toContain("Texto semantico");
    expect(withoutReferencesAndMetadata).not.toContain("color:#1d4ed8");
    expect(withoutReferencesAndMetadata).not.toContain("<strong>LO</strong>; Titulo semantico");
    expect(withoutReferencesAndMetadata).not.toContain("LO | Titulo semantico | #4");
  });

  it("appends history search metadata only when metadata toggle is enabled", () => {
    const response = buildResponse(
      "app_book_search",
      "Livro: Lexico de Ortopensatas | Termo: recin | Total: 1",
      [
        "Texto com recin destacado",
        "(**LO**; Autopensenidade)",
        "LO | Autopensenidade | argumento: recin | #1",
      ].join("\n"),
    );

    const withMetadata = renderHistoryResponseAppendBodyHtml(response, {
      applyNumbering: false,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });
    const withoutMetadata = renderHistoryResponseAppendBodyHtml(response, {
      applyNumbering: false,
      applyReferences: true,
      applyMetadata: false,
      applyHighlight: true,
    });

    expect(withMetadata).toContain("<strong>LO</strong>; Autopensenidade");
    expect(withMetadata).toContain("LO | Autopensenidade");
    expect(withMetadata).toContain("argumento:");
    expect(withMetadata).toContain("#1");
    expect(withoutMetadata).toContain("<strong>LO</strong>; Autopensenidade");
    expect(withoutMetadata).not.toContain("argumento:");
    expect(withoutMetadata).not.toContain("#1");
  });

  it("renders markdown tables from consulta dict as html table", () => {
    const response = buildResponse(
      "dict_lookup",
      "Termo: casa | Fontes válidas: 1/2",
      [
        "**Consulta Dicionários Online**",
        "",
        "**Fontes consultadas**",
        "",
        "| Nome da Fonte | Score | Definições (resumo) |",
        "| --- | ---: | --- |",
        "| Aulete | 108.40 | Moradia habitual. |",
      ].join("\n"),
    );

    const html = renderHistoryResponseEditorHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });

    expect(html).toContain("<table");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("Aulete");
    expect(html).toContain("Moradia habitual.");
  });

  it("renders regular numbered history items with aligned flex layout", () => {
    const response = buildResponse(
      "summarize",
      "Teste",
      [
        "1. Primeiro item com uma linha",
        "continua na segunda linha",
        "",
        "2. Segundo item",
      ].join("\n"),
    );

    const html = renderHistoryResponseEditorHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });

    expect(html).toContain("display: flex");
    expect(html).toContain(">1.</strong>");
    expect(html).toContain("continua na segunda linha");
  });

  it("renders lexical overview export html with global toggles and highlights", () => {
    const response = buildResponse(
      "app_lexical_overview",
      "Termo: cosmoetica | Total: 3 | Livros: 2 | Limite por livro: 2",
      "fallback",
      {
        kind: "lexical_overview",
        term: "cosmoetica",
        limit: 2,
        totalBooks: 2,
        totalFound: 3,
        groups: [
          {
            bookCode: "LO",
            bookLabel: "Lexico de Ortopensatas",
            fileStem: "LO",
            totalFound: 2,
            shownCount: 2,
            matches: [
              {
                book: "LO",
                row: 1,
                number: 1,
                title: "Cosmoetica",
                text: "Trecho com cosmoetica (p. 41)",
                pagina: "41",
                data: { area: "Mentalsomatologia" },
              },
            ],
          },
          {
            bookCode: "QUEST",
            bookLabel: "QUEST",
            fileStem: "QUEST",
            totalFound: 1,
            shownCount: 1,
            matches: [
              {
                book: "QUEST",
                row: 2,
                number: 2,
                title: "Questao",
                text: "Outro trecho",
                pagina: "",
                data: { author: "E.Q." },
              },
            ],
          },
        ],
      },
    );

    const editorHtml = renderHistoryResponseEditorHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });
    const appendHtml = renderHistoryResponseAppendBodyHtml(response, {
      applyNumbering: true,
      applyReferences: false,
      applyMetadata: false,
      applyHighlight: false,
    });
    const copyHtml = renderHistoryResponseCopyHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });

    expect(editorHtml).toContain("Lexico de Ortopensatas");
    expect(editorHtml).toContain("<mark");
    expect(editorHtml).toContain("p. 41");
    expect(copyHtml).toContain("<strong>1.</strong>");
    expect(copyHtml).not.toContain("display: flex");
    expect(copyHtml).toContain("QUEST");
    expect(appendHtml).toContain("<strong>1.</strong>&nbsp;&nbsp;Trecho com cosmoetica (p. 41)");
    expect(appendHtml).not.toContain("display: flex");
    expect(appendHtml).toContain("Outro trecho");
    expect(appendHtml).not.toContain("Mentalsomatologia");
    expect(historyHtmlToPlainText(copyHtml)).toContain("Trecho com cosmoetica");
  });

  it("preserves QUEST special formatting in editor, append and copy flows", () => {
    const response = buildResponse(
      "app_book_search",
      "Livro: QUEST | Termo: abdicacoes | Total: 1",
      [
        "**\"Pergunta de teste\"**[[HISTORY_SEARCH_BR]]**W:** Resposta de teste",
        "(**QUEST**, 05/11/2014, E.Q., p. 39)",
        "QUEST | Abdicaciologia | date: 05/11/2014 | author: E.Q. | p. 39",
      ].join("\n"),
    );

    const editorHtml = renderHistoryResponseEditorHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });
    const appendHtml = renderHistoryResponseAppendBodyHtml(response, {
      applyNumbering: false,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });
    const copyHtml = renderHistoryResponseCopyHtml(response, {
      applyNumbering: true,
      applyReferences: true,
      applyMetadata: true,
      applyHighlight: true,
    });

    expect(editorHtml).toContain("<strong>\"Pergunta de teste\"</strong>");
    expect(editorHtml).toContain("<strong>W:</strong>");
    expect(editorHtml).toContain("05/11/2014, E.Q., p. 39");
    expect(appendHtml).toContain("<strong>\"Pergunta de teste\"</strong>");
    expect(appendHtml).toContain("<strong>W:</strong>");
    expect(copyHtml).toContain("<strong>\"Pergunta de teste\"</strong>");
    expect(copyHtml).toContain("<strong>W:</strong>");
    expect(copyHtml).toContain("05/11/2014, E.Q., p. 39");
  });
});
