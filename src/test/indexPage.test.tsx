import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  randomPensataApp: vi.fn(),
  saveFileText: vi.fn(),
  semanticSearchPensatasApp: vi.fn(),
  searchLexicalBookApp: vi.fn(),
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
  buildSynonymsPrompt: vi.fn(() => "synonyms"),
  buildEpigraphPrompt: vi.fn(() => "epigraph"),
  buildRewritePrompt: vi.fn(() => "rewrite"),
  buildSummarizePrompt: vi.fn(() => "summarize"),
  buildTranslatePrompt: vi.fn(() => "translate"),
  buildAiCommandPrompt: vi.fn(() => "command"),
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

    expect(await screen.findByText("Parapreceptor • Ghost Writer Editor")).toBeInTheDocument();

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
});
