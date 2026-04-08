import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as backendApi from "@/lib/backend-api";
import Index from "@/pages/Index";

vi.mock("@/lib/backend-api", () => ({
  createBlankDocOnServer: vi.fn(),
  biblioExternaApp: vi.fn(),
  biblioGeralApp: vi.fn(),
  fetchFileContentBuffer: vi.fn(),
  fetchFileText: vi.fn(),
  healthCheck: vi.fn().mockResolvedValue({ openaiConfigured: true }),
  insertRefBookMacro: vi.fn(),
  insertRefVerbeteApp: vi.fn(),
  listSemanticIndexesApp: vi.fn().mockResolvedValue({ result: { indexes: [] } }),
  listLexicalBooksApp: vi.fn().mockResolvedValue({ result: { books: [] } }),
  openVerbetografiaTableApp: vi.fn(),
  openVerbetografiaTableWordApp: vi.fn(),
  randomPensataApp: vi.fn(),
  saveFileText: vi.fn(),
  searchOnlineDictionaryApp: vi.fn(),
  semanticSearchPensatasApp: vi.fn(),
  searchLexicalBookApp: vi.fn(),
  searchLexicalOverviewApp: vi.fn(),
  searchVerbeteApp: vi.fn(),
  uploadFileToServer: vi.fn(),
}));

vi.mock("@/lib/file-parser", () => ({
  cleanupConvertedPdfHeaderHtml: vi.fn((value: string) => value),
  parseDocxArrayBuffer: vi.fn(),
  warmupDocxParser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/openai", () => ({
  executeLLM: vi.fn(),
  ChatMessage: class {},
  CHAT_MODEL: "gpt-5.4",
  CHAT_TEMPERATURE: 0,
  CHAT_GPT5_VERBOSITY: "low",
  CHAT_GPT5_EFFORT: "none",
  CHAT_MAX_OUTPUT_TOKENS: 500,
  CHAT_MAX_NUM_RESULTS: 5,
  CHAT_SYSTEM_PROMPT: "system",
  LLM_VECTOR_STORE_LO: "vs_lo",
  LLM_VECTOR_STORE_TRANSLATE_RAG: "",
  buildDefinePrompt: vi.fn(() => "define"),
  buildSinonimologiaPrompt: vi.fn(() => "sinonimologia"),
  buildSynonymsPrompt: vi.fn(() => "synonyms"),
  buildAntonymsPrompt: vi.fn(() => "antonyms"),
  buildEtymologyPrompt: vi.fn(() => "etymology"),
  buildDictionaryPrompt: vi.fn(() => "dictionary"),
  buildEpigraphPrompt: vi.fn(() => "epigraph"),
  buildRewritePrompt: vi.fn(() => "rewrite"),
  buildSummarizePrompt: vi.fn(() => "summarize"),
  buildTranslatePrompt: vi.fn(() => "translate"),
  buildAiCommandPrompt: vi.fn(() => "command"),
  buildAnalogiesPrompt: vi.fn(() => "analogies"),
  buildComparisonsPrompt: vi.fn(() => "comparisons"),
  buildExamplesPrompt: vi.fn(() => "examples"),
  buildCounterpointsPrompt: vi.fn(() => "counterpoints"),
  buildNeoparadigmaPrompt: vi.fn(() => "neoparadigma"),
  buildCognatosPrompt: vi.fn(() => "cognatos"),
  buildChatPrompt: vi.fn(() => "chat"),
  buildVerbeteDefinologiaPrompt: vi.fn(() => "definologia"),
  buildVerbeteFraseEnfaticaPrompt: vi.fn(() => "frase"),
  buildVerbeteSinonimologiaPrompt: vi.fn(() => "sinonimologia"),
  buildVerbeteFatologiaPrompt: vi.fn(() => "fatologia"),
  buildPensataAnalysisPrompt: vi.fn(() => "pensata"),
  uploadLlmSourceFiles: vi.fn().mockResolvedValue([]),
}));

const setMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
};

describe("Index page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    setMatchMedia(false);
  });

  it("renders desktop shell and opens document parameters", async () => {
    render(<Index />);

    expect(await screen.findByText(/Parapreceptor\s+●\s+Ghost Writer Editor/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Documento" }));

    await waitFor(() => {
      expect(screen.getByText("Novo Documento em Branco")).toBeInTheDocument();
    });
  });

  it("renders mobile panel header when viewport is mobile", async () => {
    setMatchMedia(true);

    render(<Index />);

    await waitFor(() => {
      expect(screen.getByText("Painel")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Abrir menu de paineis" })).toBeInTheDocument();
  });

  it("shows the Etimologia action with the standard parameter panel", async () => {
    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /termos & conceitos/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Etimologia\b/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Etimologia")[0]).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /select & import/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a word, phrase or text")).toBeInTheDocument();
  });

  it("shows the DicionÃ¡rio action with the standard parameter panel", async () => {
    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /trad.*dicion/i }));
    fireEvent.click(screen.getByRole("button", { name: /^dicion/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/dicion/i)[0]).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /select & import/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a word, phrase or text")).toBeInTheDocument();
  });

  it("shows consulta dict in traducao e registra resultado no historico", async () => {
    vi.mocked(backendApi.searchOnlineDictionaryApp).mockResolvedValue({
      ok: true,
      result: {
        term: "casa",
        sources_total: 5,
        sources_ok: 2,
        sources_failed: 3,
        elapsed_ms: 120.5,
        request_id: "abc123",
        summary: {
          definitions: ["Moradia habitual.", "Edificação para habitação."],
          synonyms: ["lar", "residência"],
          examples: ["A casa estava vazia."],
          etymology: "Do latim casa.",
        },
        results: [
          {
            source: "Aulete",
            ok: true,
            url: "https://example.com/aulete",
            elapsed_ms: 30,
            quality_score: 100,
            definitions: ["Moradia habitual."],
            synonyms: ["lar"],
            examples: ["A casa estava vazia."],
            etymology: "Do latim casa.",
            query_term: "casa",
            retry_without_accents: false,
            error: null,
          },
          {
            source: "Michaelis",
            ok: true,
            url: "https://example.com/michaelis",
            elapsed_ms: 40,
            quality_score: 95,
            definitions: ["Edificação para habitação."],
            synonyms: ["residência"],
            examples: [],
            etymology: null,
            query_term: "casa",
            retry_without_accents: false,
            error: null,
          },
          {
            source: "Priberam",
            ok: false,
            url: "https://example.com/priberam",
            elapsed_ms: 50,
            quality_score: 10,
            definitions: [],
            synonyms: [],
            examples: [],
            etymology: null,
            query_term: "casa",
            retry_without_accents: false,
            error: "falha",
          },
          {
            source: "Wiktionary",
            ok: false,
            url: "https://example.com/wiktionary",
            elapsed_ms: 60,
            quality_score: 10,
            definitions: [],
            synonyms: [],
            examples: [],
            etymology: null,
            query_term: "casa",
            retry_without_accents: false,
            error: "falha",
          },
          {
            source: "Dicio",
            ok: false,
            url: "https://example.com/dicio",
            elapsed_ms: 70,
            quality_score: 10,
            definitions: [],
            synonyms: [],
            examples: [],
            etymology: null,
            query_term: "casa",
            retry_without_accents: false,
            error: "falha",
          },
        ],
      },
    });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /trad.*dicion/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^dicion/i })[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/dicion/i)[0]).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "casa" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^dicion/i })[1]);

    await waitFor(() => {
      expect(screen.getByText("Consulta Dicionários")).toBeInTheDocument();
    });

    expect((await screen.findAllByText(/Moradia habitual/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Nome da Fonte/i)).toBeInTheDocument();
    expect(screen.getByText(/Definições \(resumo\)/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/Aulete/i)).length).toBeGreaterThan(0);
  });
  it("opens customized prompts and runs analogias with the standard parameter panel", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "Resposta de analogias." });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /customized prompts/i }));
    fireEvent.click(screen.getByRole("button", { name: /^analogias\b/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Analogias")[0]).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /select & import/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write a word, phrase or text")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "Texto base" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^analogias\b/i })[1]);

    await waitFor(() => {
      expect(screen.getAllByText("Analogias")[1]).toBeInTheDocument();
    });

    expect(await screen.findByText(/Resposta de analogias/i)).toBeInTheDocument();
  });

  it("runs cognatos through the generic action flow without vector store ids", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "cognato-um\ncognato-dois" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /termos & conceitos/i }));
    fireEvent.click(screen.getByRole("button", { name: /^cognatos\b/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Cognatos")[0]).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "holopensene" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^cognatos\b/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    const payload = vi.mocked(openai.executeLLM).mock.calls.at(-1)?.[0];
    expect(openai.buildCognatosPrompt).toHaveBeenCalledWith("holopensene");
    expect(payload?.vectorStoreIds).toEqual([]);
    expect(await screen.findByText(/cognato-um/i)).toBeInTheDocument();
  });

  it("shows the new customized prompt buttons", async () => {
    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /customized prompts/i }));

    expect(screen.getByRole("button", { name: /^analogias\b/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^comparações\b/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^exemplos\b/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^contrapontos\b/i })).toBeInTheDocument();
  });
});
