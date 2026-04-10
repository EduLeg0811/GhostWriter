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
  CHAT_MAX_OUTPUT_TOKENS: 1000,
  CHAT_MAX_NUM_RESULTS: 5,
  CHAT_SYSTEM_PROMPT: "system",
  BIBLIO_EXTERNA_DEFAULT_SYSTEM_PROMPT: "biblio-system",
  LLM_VECTOR_STORE_LO: "vs_lo",
  LLM_VECTOR_STORE_TRANSLATE_RAG: "",
  buildDefinePrompt: vi.fn(() => "dictionary"),
  buildDefineConsPrompt: vi.fn(() => "dictionaryCons"),
  buildDefinologiaPrompt: vi.fn(() => "define"),
  buildSinonimologiaPrompt: vi.fn(() => "sinonimologia"),
  buildEpigraphConsPrompt: vi.fn(() => "epigraph_cons"),
  buildSynonymsPrompt: vi.fn(() => "synonyms"),
  buildSynonymsConsPrompt: vi.fn(() => "synonymsCons"),
  buildAntonymsPrompt: vi.fn(() => "antonyms"),
  buildAntonymsConsPrompt: vi.fn(() => "antonymsCons"),
  buildEtymologyPrompt: vi.fn(() => "etymology"),
  buildEtymologyConsPrompt: vi.fn(() => "etymologyCons"),
  buildEpigraphPrompt: vi.fn(() => "epigraph"),
  buildRewritePrompt: vi.fn(() => "rewrite"),
  buildSummarizePrompt: vi.fn(() => "summarize"),
  buildTranslatePrompt: vi.fn(() => "translate"),
  buildDictLookupPrompt: vi.fn(() => "dict_lookup"),
  buildAiCommandPrompt: vi.fn(() => "command"),
  buildAnalogiesPrompt: vi.fn(() => "analogies"),
  buildComparisonsPrompt: vi.fn(() => "comparisons"),
  buildExamplesPrompt: vi.fn(() => "examples"),
  buildCounterpointsPrompt: vi.fn(() => "counterpoints"),
  buildNeoparadigmaPrompt: vi.fn(() => "neoparadigma"),
  buildCognatosPrompt: vi.fn(() => "cognatos"),
  buildCognatosConsPrompt: vi.fn(() => "cognatosCons"),
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

    expect(await screen.findByText(/Ghost Writer Editor/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Documento" }));

    await waitFor(() => {
      expect(screen.getByText("Novo Documento em Branco")).toBeInTheDocument();
    });
  });

  it("renders mobile panel header when viewport is mobile", async () => {
    setMatchMedia(true);

    render(<Index />);

    await waitFor(() => {
      expect(screen.getByText("Navegacao")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parametros" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Historico" })).toBeInTheDocument();
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

  it("shows the Dicionario action with the standard parameter panel", async () => {
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
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "Moradia habitual." });

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
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    expect(openai.buildDictLookupPrompt).toHaveBeenCalledWith("casa");
    expect((await screen.findAllByText(/dicion/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Moradia habitual/i)).toBeInTheDocument();
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
    expect(payload?.previousResponseId).toBeUndefined();
    expect(payload?.vectorStoreIds).toEqual([]);
    expect(await screen.findByText(/cognato-um/i)).toBeInTheDocument();
  });

  it("switches Termos & Conceitos to WVBooks and prompt Cons when Conscienciografia is active", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "definicao conscienciografica" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /termos & conceitos/i }));
    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getByRole("button", { name: /^definição\b|^definicao\b/i }));

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "holopensene" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^definição\b|^definicao\b/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    const payload = vi.mocked(openai.executeLLM).mock.calls.at(-1)?.[0];
    expect(openai.buildDefineConsPrompt).toHaveBeenCalledWith("holopensene");
    expect(payload?.vectorStoreIds).toEqual(["vs_6912908250e4819197e23fe725e04fae"]);
  });

  it("shows the new customized prompt buttons", async () => {
    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /customized prompts/i }));

    expect(screen.getByRole("button", { name: /^comando ia\b/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^analogias\b/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^compara/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^exemplos\b/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^contrapontos\b/i })).toBeInTheDocument();
  });
});
