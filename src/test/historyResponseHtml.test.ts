import { describe, expect, it } from "vitest";
import { historyHtmlToPlainText, renderHistoryResponseAppendBodyHtml, renderHistoryResponseCopyHtml, renderHistoryResponseEditorHtml } from "@/features/ghost-writer/utils/historyResponseHtml";
import type { AIResponse } from "@/features/ghost-writer/types";

const buildResponse = (type: AIResponse["type"], query: string, content: string): AIResponse => ({
  id: `${type}-1`,
  type,
  query,
  content,
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
    });

    expect(html).toContain("<mark");
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
    });
    const withoutReferences = renderHistoryResponseCopyHtml(response, {
      applyNumbering: true,
      applyReferences: false,
      applyMetadata: false,
    });

    expect(withReferences).toContain("color:#1d4ed8");
    expect(withReferences).toContain("<strong>LO</strong>; Autopensenidade");
    expect(withReferences).not.toContain("LO | Autopensenidade | #1");

    expect(withoutReferences).toContain("color:#1d4ed8");
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
    });

    expect(html).toContain("data-pdf-download-url=\"https://example.com/verbete.pdf\"");
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
    });
    const withoutReferencesAndMetadata = renderHistoryResponseAppendBodyHtml(response, {
      applyNumbering: false,
      applyReferences: false,
      applyMetadata: false,
    });

    expect(withReferencesAndMetadata).toContain("color:#1d4ed8");
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
    });
    const withoutMetadata = renderHistoryResponseAppendBodyHtml(response, {
      applyNumbering: false,
      applyReferences: true,
      applyMetadata: false,
    });

    expect(withMetadata).toContain("<strong>LO</strong>; Autopensenidade");
    expect(withMetadata).toContain("LO | Autopensenidade");
    expect(withMetadata).toContain("argumento:");
    expect(withMetadata).toContain("#1");
    expect(withoutMetadata).toContain("<strong>LO</strong>; Autopensenidade");
    expect(withoutMetadata).not.toContain("argumento:");
    expect(withoutMetadata).not.toContain("#1");
  });
});
