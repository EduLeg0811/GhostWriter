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
  fetchSemanticOverviewProgress: vi.fn().mockResolvedValue({ ok: true, result: { status: "idle", events: [] } }),
  fetchLexicalOverviewProgress: vi.fn().mockResolvedValue({ ok: true, result: { status: "idle", events: [] } }),
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
  searchSemanticOverviewApp: vi.fn(),
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
  LLM_VECTOR_STORE_TRANSLATE_RAG: "vs_translate_rag",
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
  buildRewriteConsPrompt: vi.fn(() => "rewriteCons"),
  buildSummarizePrompt: vi.fn(() => "summarize"),
  buildSummarizeConsPrompt: vi.fn(() => "summarizeCons"),
  buildTranslatePrompt: vi.fn(() => "translate"),
  buildTranslateConsPrompt: vi.fn(() => "translateCons"),
  buildDictLookupPrompt: vi.fn(() => "dict_lookup"),
  buildDictLookupConsPrompt: vi.fn(() => "dict_lookupCons"),
  buildAiCommandPrompt: vi.fn(() => "command"),
  buildAnalogiesPrompt: vi.fn(() => "analogies"),
  buildAnalogiesConsPrompt: vi.fn(() => "analogiesCons"),
  buildComparisonsPrompt: vi.fn(() => "comparisons"),
  buildComparisonsConsPrompt: vi.fn(() => "comparisonsCons"),
  buildExamplesPrompt: vi.fn(() => "examples"),
  buildExamplesConsPrompt: vi.fn(() => "examplesCons"),
  buildCounterpointsPrompt: vi.fn(() => "counterpoints"),
  buildCounterpointsConsPrompt: vi.fn(() => "counterpointsCons"),
  buildNeoparadigmaPrompt: vi.fn(() => "neoparadigma"),
  buildNeoparadigmaConsPrompt: vi.fn(() => "neoparadigmaCons"),
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
    expect((await screen.findAllByText(/Defini.*CONS/i))[0]).toBeInTheDocument();
  });

  it("allows changing the Terms & Concepts vector store after Conscienciografia initializes it", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "definicao conscienciografica" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /termos & conceitos/i }));
    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /definição|definicao/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /configs/i }));
    fireEvent.click(screen.getByRole("button", { name: /^ia$/i }));

    const vectorStoreSelect = screen.getAllByRole("combobox").find(
      (element) => (element as HTMLSelectElement).value === "vs_6912908250e4819197e23fe725e04fae",
    ) as HTMLSelectElement;
    fireEvent.change(vectorStoreSelect, { target: { value: "vs_69bb11928ff08191b24e3e35a93b4d5b" } });
    await waitFor(() => {
      expect(vectorStoreSelect.value).toBe("vs_69bb11928ff08191b24e3e35a93b4d5b");
    });

    fireEvent.click(screen.getByRole("button", { name: /fechar configs/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /termos & conceitos/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /definição|definicao/i })[0]);
    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "holopensene" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /definição|definicao/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    const payload = vi.mocked(openai.executeLLM).mock.calls.at(-1)?.[0];
    expect(payload?.vectorStoreIds).toEqual(["vs_69bb11928ff08191b24e3e35a93b4d5b"]);
    expect(openai.buildDefineConsPrompt).toHaveBeenCalledWith("holopensene");
  });

  it("switches Traduzir to Translate RAG only when Conscienciografia is active", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "translated text" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /trad.*dicion/i }));
    fireEvent.click(screen.getByRole("button", { name: /^traduzir\b/i }));

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "texto base" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^traduzir\b/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    let payload = vi.mocked(openai.executeLLM).mock.calls.at(-1)?.[0];
    expect(payload?.vectorStoreIds).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^traduzir\b/i })[1]);

    await waitFor(() => {
      expect(vi.mocked(openai.executeLLM).mock.calls.length).toBeGreaterThan(1);
    });

    payload = vi.mocked(openai.executeLLM).mock.calls.at(-1)?.[0];
    expect(payload?.vectorStoreIds).toEqual(["vs_translate_rag"]);
    expect(openai.buildTranslateConsPrompt).toHaveBeenCalledWith("texto base", "Ingles");
  });

  it("allows changing Traduzir vector store after Conscienciografia initializes Translate RAG", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "translated text" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /trad.*dicion/i }));
    fireEvent.click(screen.getByRole("button", { name: /^traduzir\b/i }));
    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getByRole("button", { name: /configs/i }));
    fireEvent.click(screen.getByRole("button", { name: /^ia$/i }));

    const vectorStoreSelect = screen.getAllByRole("combobox").find(
      (element) => (element as HTMLSelectElement).value === "vs_translate_rag",
    ) as HTMLSelectElement;
    fireEvent.change(vectorStoreSelect, { target: { value: "" } });
    await waitFor(() => {
      expect(vectorStoreSelect.value).toBe("");
    });

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "texto base" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^traduzir\b/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    const payload = vi.mocked(openai.executeLLM).mock.calls.at(-1)?.[0];
    expect(payload?.vectorStoreIds).toEqual([]);
    expect(openai.buildTranslateConsPrompt).toHaveBeenCalledWith("texto base", "Ingles");
  });

  it("switches Dicionarios to the Cons prompt when Conscienciografia is active", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "resultado cons" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /trad.*dicion/i }));
    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^dicion/i })[0]);

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "casa" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^dicion/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    expect(openai.buildDictLookupConsPrompt).toHaveBeenCalledWith("casa");
  });

  it("switches Analogias to the Cons prompt when Conscienciografia is active", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "analogia cons" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /customized prompts/i }));
    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getByRole("button", { name: /^analogias\b/i }));

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "Texto base" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^analogias\b/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    expect(openai.buildAnalogiesConsPrompt).toHaveBeenCalledWith("Texto base");
  });

  it("switches Epigrafe to the Cons prompt when Conscienciografia is active", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "epigrafe cons" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /par[aá]grafos|trechos/i }));
    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getByRole("button", { name: /^ep[ií]grafe\b/i }));

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "Texto base" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^ep[ií]grafe\b/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    expect(openai.buildEpigraphConsPrompt).toHaveBeenCalledWith("Texto base");
  });

  it("switches Reescrever to the Cons prompt when Conscienciografia is active", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "rewrite cons" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /par[aá]grafos|trechos/i }));
    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getByRole("button", { name: /^reescrever\b/i }));

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "Texto base" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^reescrever\b/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    expect(openai.buildRewriteConsPrompt).toHaveBeenCalledWith("Texto base");
  });

  it("switches Resumir to the Cons prompt when Conscienciografia is active", async () => {
    const openai = await import("@/lib/openai");
    vi.mocked(openai.executeLLM).mockResolvedValue({ content: "summary cons" });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /par[aá]grafos|trechos/i }));
    fireEvent.click(screen.getByRole("button", { name: /conscienciografia/i }));
    fireEvent.click(screen.getByRole("button", { name: /^resumir\b/i }));

    fireEvent.change(screen.getByPlaceholderText("Write a word, phrase or text"), {
      target: { value: "Texto base" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /^resumir\b/i })[1]);

    await waitFor(() => {
      expect(openai.executeLLM).toHaveBeenCalled();
    });

    expect(openai.buildSummarizeConsPrompt).toHaveBeenCalledWith("Texto base");
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

  it("runs Semantic Overview inside Semantic Search and renders grouped history", async () => {
    const backendApi = await import("@/lib/backend-api");
    vi.mocked(backendApi.searchSemanticOverviewApp).mockResolvedValue({
      ok: true,
      result: {
        term: "cosmoetica",
        limit: 2,
        minScore: 0.25,
        recommendedMinScoreMin: 0.53,
        recommendedMinScoreMax: 0.60,
        usesCalibratedMinScores: true,
        totalIndexes: 2,
        totalFound: 2,
        lexicalFilteredCount: 0,
        ragContext: {
          usedRagContext: false,
          sourceQuery: "cosmoetica",
          vectorStoreIds: [],
          keyTerms: [],
          definitions: [],
          relatedTerms: [],
          disambiguatedQuery: "",
          references: [],
        },
        groups: [
          {
            indexId: "lo",
            indexLabel: "LO Semantic",
            totalFound: 1,
            shownCount: 1,
            matches: [
              {
                book: "LO",
                index_id: "lo",
                index_label: "LO Semantic",
                row: 1,
                text: "Trecho com cosmoetica expandida",
                metadata: { title: "Cosmoetica" },
                score: 0.9876,
              },
            ],
          },
          {
            indexId: "quest",
            indexLabel: "QUEST Semantic",
            totalFound: 1,
            shownCount: 1,
            matches: [
              {
                book: "QUEST",
                index_id: "quest",
                index_label: "QUEST Semantic",
                row: 2,
                text: "Outro trecho semanticamente afim",
                metadata: { author: "E.Q." },
                score: 0.8765,
              },
            ],
          },
        ],
      },
    });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /semantic search/i }));
    fireEvent.click(screen.getByRole("button", { name: /semantic overview/i }));

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "cosmoetica" },
    });
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }));

    await waitFor(() => {
      expect(backendApi.searchSemanticOverviewApp).toHaveBeenCalledWith({
        term: "cosmoetica",
        limit: 2,
        minScore: 0.25,
        useRagContext: true,
        vectorStoreIds: [],
      });
    });

    expect(await screen.findByRole("button", { name: /lo semantic/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /quest semantic/i })).toBeInTheDocument();
    expect(screen.getAllByText((_, node) => (node?.textContent || "").includes("Trecho com cosmoetica expandida")).length).toBeGreaterThan(0);
  });

  it("opens Search Log from Configuracoes and loads the monitor panel", async () => {
    const backendApi = await import("@/lib/backend-api");
    vi.mocked(backendApi.fetchSemanticOverviewProgress).mockResolvedValue({
      ok: true,
      result: {
        status: "running",
        term: "cosmoetica",
        limit: 5,
        totalIndexes: 12,
        processedIndexes: 3,
        currentIndexPosition: 4,
        currentIndexLabel: "LO Semantic",
        currentMatches: 5,
        totalMatchesAccumulated: 11,
        totalFound: 0,
        groupsCount: 0,
        topScore: 0.93,
        message: "Processando base LO Semantic.",
        events: [
          {
            at: "2026-04-10T15:00:00Z",
            stage: "index_completed",
            indexId: "lo",
            indexLabel: "LO Semantic",
            position: 4,
            totalIndexes: 12,
            matchesFound: 5,
            totalMatchesAccumulated: 11,
            topScore: 0.93,
            note: "Trechos ranqueados.",
          },
        ],
      },
    });

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /^logs$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^logs$/i })).toBeInTheDocument();
      expect(screen.getByText(/semantic overview monitor/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/processando base lo semantic/i)).toBeInTheDocument();
    expect(screen.getByText(/^bases$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/lo semantic/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/5 achados/i)).toBeInTheDocument();
  });

  it("resets persisted config from LLM Sources after confirmation", async () => {
    window.localStorage.setItem("llm_settings_v1", JSON.stringify({ model: "gpt-5.4-nano", temperature: 1.2 }));
    window.localStorage.setItem("ai_actions_llm_settings_v1", JSON.stringify({ model: "gpt-5.4-nano" }));
    window.localStorage.setItem("biblio_externa_llm_settings_v1", JSON.stringify({ model: "gpt-5.4-nano" }));
    window.localStorage.setItem("general_settings_v1", JSON.stringify({ enableHistoryNumbering: false }));

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<Index />);

    fireEvent.click(await screen.findByRole("button", { name: /^configs$/i }));
    fireEvent.click(screen.getByRole("button", { name: /reset config parameters/i }));

    expect(confirmSpy).toHaveBeenCalledWith("Reset all config parameters. Are you shure?");

    await waitFor(() => {
      expect(screen.getByDisplayValue("gpt-5.4")).toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });
});
