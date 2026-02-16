import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import LeftPanel from "@/components/LeftPanel";
import RightPanel, { AIResponse } from "@/components/RightPanel";
import OnlyOfficeEditor, { OnlyOfficeDocumentConfig } from "@/components/OnlyOfficeEditor";
import InsertRefBookPanel from "@/components/InsertRefBookPanel";
import InsertRefVerbetePanel from "@/components/InsertRefVerbetePanel";
import BiblioGeralPanel from "@/components/BiblioGeralPanel";
import Macro1HighlightPanel from "@/components/Macro1HighlightPanel";
import Macro2ManualNumberingPanel from "@/components/Macro2ManualNumberingPanel";
import type { Macro2SpacingMode } from "@/components/Macro2ManualNumberingPanel";
import AiActionParametersPanel from "@/components/AiActionParametersPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useTextStats } from "@/hooks/useTextStats";
import {
  createBlankDocOnServer,
  biblioGeralApp,
  fetchFileText,
  fetchOnlyOfficeConfig,
  forceSaveOnlyOffice,
  healthCheck,
  highlightFileTerm,
  insertRefBookMacro,
  insertRefVerbeteApp,
  UploadedFileMeta,
  uploadFileToServer,
} from "@/lib/backend-api";
import { OnlyOfficeControlApi } from "@/lib/onlyoffice-control";
import { markdownToOnlyOfficeHtml, normalizeHistoryContentToMarkdown } from "@/lib/markdown";
import {
  callOpenAI,
  ChatMessage,
  searchVectorStore,
  buildDefinePrompt,
  buildSynonymsPrompt,
  buildEpigraphPrompt,
  buildRewritePrompt,
  buildSummarizePrompt,
  buildTranslatePrompt,
  buildChatPrompt,
} from "@/lib/openai";

const OPENAI_VECTOR_STORES = (import.meta.env.VITE_OPENAI_VECTOR_STORES as string | undefined)?.trim() || "";
const OPENAI_VECTOR_STORE_LO = (import.meta.env.VITE_OPENAI_VECTOR_STORE_LO as string | undefined)?.trim() || "";
const OPENAI_VECTOR_STORE_TRANSLATE_RAG = (import.meta.env.VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG as string | undefined)?.trim() || "";

type MacroActionId = "macro1" | "macro2";
type AppActionId = "app1" | "app2" | "app3";
type AiActionId = "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "translate";
type ParameterPanelTarget =
  | { section: "actions"; id: AiActionId }
  | { section: "macros"; id: MacroActionId }
  | { section: "apps"; id: AppActionId }
  | null;

const parameterAppMeta: Record<"app1", { title: string; description: string }> = {
  app1: { title: "Bibliografia de Livros", description: "Cria Bibliografia de livros de Waldo Vieira." },
};
const parameterMacroMeta: Record<MacroActionId, { title: string; description: string }> = {
  macro1: { title: "Highlight", description: "Destaca termos no documento (highlight em cores)." },
  macro2: { title: "Macro2", description: "Converte lista numerada automatica da selecao para numeracao manual." },
};
const parameterAppsGenericMeta: Record<"app2" | "app3", { title: string; description: string }> = {
  app2: { title: "Bibliografia de Verbetes", description: "Cria Listagem ou Bibliografia de verbetes da EnciclopÃ©dia." },
  app3: { title: "Bibliografia Geral", description: "Busca 10 correspondencias bibliograficas a partir da caixa de entrada." },
};
const parameterActionMeta: Record<AiActionId, { title: string; description: string }> = {
  define: { title: "Definir", description: "Definologia conscienciologica." },
  synonyms: { title: "Sinonimia", description: "Sinonimologia (10 itens)." },
  epigraph: { title: "Epigrafe", description: "Sugerir epigrafe." },
  rewrite: { title: "Reescrever", description: "Melhora clareza e fluidez." },
  summarize: { title: "Resumir", description: "Sintese concisa." },
  pensatas: { title: "Pensatas LO", description: "Pensatas afins (10 itens)." },
  translate: { title: "Traduzir", description: "Traduzir para o idioma selecionado." },
};
const sidePanelClass = "bg-card";
const PANEL_SIZES = {
  left: { default: 10, min: 7, max: 15 },
  center: { default: 70, min: 35 },
  parameter: { default: 9, min: 5, max: 25 },
  editorWithParameter: { default: 55, min: 35 },
  editorWithoutParameter: { default: 70, min: 35 },
  right: { default: 20, min: 10, max: 40 },
} as const;
const MACRO1_HIGHLIGHT_COLORS = [
  { id: "yellow", label: "Amarelo", swatch: "#fef08a" },
  { id: "green", label: "Verde", swatch: "#86efac" },
  { id: "cyan", label: "Ciano", swatch: "#a5f3fc" },
  { id: "magenta", label: "Magenta", swatch: "#f5d0fe" },
  { id: "blue", label: "Azul", swatch: "#bfdbfe" },
  { id: "red", label: "Vermelho", swatch: "#fecaca" },
] as const;
const TRANSLATE_LANGUAGE_OPTIONS = [
  { value: "Ingles", label: "Ingles" },
  { value: "Espanhol", label: "Espanhol" },
  { value: "Frances", label: "Frances" },
  { value: "Alemao", label: "Alemao" },
  { value: "Italiano", label: "Italiano" },
  { value: "Portugues", label: "Portugues" },
  { value: "Mandarim", label: "Mandarim" },
  { value: "Japones", label: "Japones" },
  { value: "Arabe", label: "Arabe" },
  { value: "Russo", label: "Russo" },
] as const;
const Index = () => {
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionText, setActionText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [documentText, setDocumentText] = useState("");
  const [documentPageCount, setDocumentPageCount] = useState<number | null>(null);
  const [documentParagraphCount, setDocumentParagraphCount] = useState<number | null>(null);
  const [documentWordCount, setDocumentWordCount] = useState<number | null>(null);
  const [documentSymbolCount, setDocumentSymbolCount] = useState<number | null>(null);
  const [documentSymbolWithSpacesCount, setDocumentSymbolWithSpacesCount] = useState<number | null>(null);
  const [currentFileId, setCurrentFileId] = useState("");
  const [statsKey, setStatsKey] = useState(0);
  const [officeDoc, setOfficeDoc] = useState<OnlyOfficeDocumentConfig | null>(null);
  const [isOpeningDocument, setIsOpeningDocument] = useState(false);
  const [openAiReady, setOpenAiReady] = useState(false);
  const [onlyOfficeControlApi, setOnlyOfficeControlApi] = useState<OnlyOfficeControlApi | null>(null);
  const [parameterPanelTarget, setParameterPanelTarget] = useState<ParameterPanelTarget>(null);
  const [selectedRefBook, setSelectedRefBook] = useState("LO");
  const [refBookPages, setRefBookPages] = useState("");
  const [isRunningInsertRefBook, setIsRunningInsertRefBook] = useState(false);
  const [insertRefBookResult, setInsertRefBookResult] = useState("");
  const [verbeteInput, setVerbeteInput] = useState("");
  const [isRunningInsertRefVerbete, setIsRunningInsertRefVerbete] = useState(false);
  const [insertRefVerbeteListResult, setInsertRefVerbeteListResult] = useState("");
  const [insertRefVerbeteBiblioResult, setInsertRefVerbeteBiblioResult] = useState("");
  const [biblioGeralAuthor, setBiblioGeralAuthor] = useState("");
  const [biblioGeralTitle, setBiblioGeralTitle] = useState("");
  const [biblioGeralYear, setBiblioGeralYear] = useState("");
  const [biblioGeralExtra, setBiblioGeralExtra] = useState("");
  const [isRunningBiblioGeral, setIsRunningBiblioGeral] = useState(false);
  const [biblioGeralResult, setBiblioGeralResult] = useState("");
  const [translateLanguage, setTranslateLanguage] = useState<(typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"]>("Ingles");
  const [macro1Term, setMacro1Term] = useState("");
  const [macro1ColorId, setMacro1ColorId] = useState<(typeof MACRO1_HIGHLIGHT_COLORS)[number]["id"]>("yellow");
  const [macro2SpacingMode, setMacro2SpacingMode] = useState<Macro2SpacingMode>("nbsp_double");

  const stats = useTextStats(
    documentText || actionText,
    statsKey,
    documentPageCount,
    documentParagraphCount,
    documentWordCount,
    documentSymbolCount,
    documentSymbolWithSpacesCount,
  );

  const refreshHealth = useCallback(() => {
    healthCheck().then((h) => setOpenAiReady(h.openaiConfigured)).catch(() => setOpenAiReady(false));
  }, []);

  useEffect(() => {
    refreshHealth();
    const intervalId = window.setInterval(refreshHealth, 15000);
    window.addEventListener("focus", refreshHealth);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshHealth);
    };
  }, [refreshHealth]);

  const refreshDocumentText = useCallback(async (fileId: string) => {
    if (!fileId) {
      setDocumentText("");
      setDocumentPageCount(null);
      setDocumentParagraphCount(null);
      setDocumentWordCount(null);
      setDocumentSymbolCount(null);
      setDocumentSymbolWithSpacesCount(null);
      return;
    }
    try {
      const data = await fetchFileText(fileId);
      setDocumentText(data.text || "");
    } catch (_err) {
      setDocumentText("");
    }
  }, []);
  const refreshDocumentPageCount = useCallback(async () => {
    if (!onlyOfficeControlApi || !currentFileId) {
      setDocumentPageCount(null);
      setDocumentParagraphCount(null);
      setDocumentWordCount(null);
      setDocumentSymbolCount(null);
      setDocumentSymbolWithSpacesCount(null);
      return;
    }
    try {
      const statsData = await onlyOfficeControlApi.getDocumentStats();
      setDocumentPageCount(statsData.pages);
      setDocumentParagraphCount(statsData.paragraphs);
      setDocumentWordCount(statsData.words);
      setDocumentSymbolCount(statsData.symbols);
      setDocumentSymbolWithSpacesCount(statsData.symbolsWithSpaces);
    } catch (_err) {
      setDocumentPageCount(null);
      setDocumentParagraphCount(null);
      setDocumentWordCount(null);
      setDocumentSymbolCount(null);
      setDocumentSymbolWithSpacesCount(null);
    }
  }, [currentFileId, onlyOfficeControlApi]);
  useEffect(() => {
    void refreshDocumentText(currentFileId);
  }, [currentFileId, refreshDocumentText]);

  useEffect(() => {
    void refreshDocumentPageCount();
  }, [refreshDocumentPageCount]);

  const handleWordFileUpload = useCallback(async (file: File): Promise<UploadedFileMeta> => {
    setIsOpeningDocument(true);
    try {
      const uploaded = await uploadFileToServer(file);
      if (!["docx", "doc", "rtf", "odt"].includes(uploaded.ext)) {
        const reason = uploaded.conversionError ? ` ${uploaded.conversionError}` : "";
        throw new Error(`NÃ£o foi possÃ­vel abrir no ONLYOFFICE. O PDF nÃ£o converteu para DOCX.${reason}`);
      }

      const payload = await fetchOnlyOfficeConfig(uploaded.id);
      setActionText("");
      setCurrentFileId(uploaded.id);
      void refreshDocumentText(uploaded.id);
      setOfficeDoc({ documentServerUrl: payload.documentServerUrl, config: payload.config, token: payload.token });
      return uploaded;
    } finally {
      setIsOpeningDocument(false);
    }
  }, [refreshDocumentText]);

  const handleCreateBlankDocument = useCallback(async (): Promise<void> => {
    setIsOpeningDocument(true);
    try {
      const created = await createBlankDocOnServer("novo-documento.docx");
      const payload = await fetchOnlyOfficeConfig(created.id);
      setActionText("");
      setCurrentFileId(created.id);
      void refreshDocumentText(created.id);
      setOfficeDoc({ documentServerUrl: payload.documentServerUrl, config: payload.config, token: payload.token });
    } finally {
      setIsOpeningDocument(false);
    }
  }, [refreshDocumentText]);

  const handleRefreshStats = useCallback(async () => {
    if (!currentFileId) {
      toast.error("Nenhum documento aberto no ONLYOFFICE.");
      return;
    }

    const previousText = documentText;
    try {
      await forceSaveOnlyOffice(currentFileId);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    } catch (_err) {
      // continue
    }

    let lastFetchedText = previousText;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const data = await fetchFileText(currentFileId);
        const fetched = data.text || "";
        lastFetchedText = fetched;
        setDocumentText(fetched);
        if (fetched !== previousText) break;
      } catch (_err) {
        // continue
      }
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }

    if (lastFetchedText === previousText) {
      await refreshDocumentText(currentFileId);
    }
    await refreshDocumentPageCount();
    setStatsKey((k) => k + 1);
  }, [currentFileId, documentText, refreshDocumentPageCount, refreshDocumentText]);

  const waitForceSavePropagation = useCallback(async (fileId: string, baselineText: string) => {
    try {
      await forceSaveOnlyOffice(fileId);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    } catch (_err) {
      // continue
    }

    let lastFetchedText = baselineText;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const data = await fetchFileText(fileId);
        const fetched = data.text || "";
        lastFetchedText = fetched;
        setDocumentText(fetched);
        if (fetched !== baselineText) break;
      } catch (_err) {
        // continue
      }
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }

    return lastFetchedText;
  }, []);

  const handleRetrieveSelectedText = useCallback(async () => {
    if (!onlyOfficeControlApi) {
      toast.error("API do ONLYOFFICE indisponÃ­vel no momento.");
      return;
    }

    try {
      const selected = (await onlyOfficeControlApi.getSelectedText()).trim();
      if (!selected) throw new Error("Nenhum texto selecionado no ONLYOFFICE.");
      setActionText(selected);
      toast.success("Trecho selecionado aplicado na caixa de texto.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao obter seleÃ§Ã£o.");
    }
  }, [onlyOfficeControlApi]);

  const handleSelectAllContent = useCallback(async () => {
    if (!onlyOfficeControlApi) {
      toast.error("Controle do ONLYOFFICE indisponÃ­vel.");
      return;
    }

    try {
      await onlyOfficeControlApi.selectAllContent();
      toast.success("Documento inteiro selecionado.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao selecionar todo o documento.");
    }
  }, [onlyOfficeControlApi]);

  const handleTriggerSave = useCallback(async () => {
    if (!onlyOfficeControlApi) {
      toast.error("API do ONLYOFFICE indisponÃ­vel no momento.");
      return;
    }
    if (responses.length === 0) {
      toast.error("Ainda nÃ£o hÃ¡ resposta no histÃ³rico para aplicar.");
      return;
    }

    const latestResponse = responses[0]?.content?.trim() || "";
    if (!latestResponse) {
      toast.error("A Ãºltima resposta do histÃ³rico estÃ¡ vazia.");
      return;
    }

    try {
      const markdownContent = normalizeHistoryContentToMarkdown(latestResponse);
      const html = markdownToOnlyOfficeHtml(markdownContent);
      await onlyOfficeControlApi.replaceSelectionRich(markdownContent, html);
      toast.success("Ãšltima resposta aplicada no cursor/seleÃ§Ã£o do ONLYOFFICE.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao aplicar resposta no ONLYOFFICE.");
    }
  }, [onlyOfficeControlApi, responses]);

  const addResponse = (type: AIResponse["type"], query: string, content: string) => {
    setResponses((prev) => [{ id: crypto.randomUUID(), type, query, content, timestamp: new Date() }, ...prev]);
  };

  const insertRefBook = useCallback(async (book: string) => {
    const data = await insertRefBookMacro(book);
    return data.result;
  }, []);

  const handleActionMacros = useCallback(async (type: MacroActionId) => {
    setParameterPanelTarget({ section: "macros", id: type });
    if (type === "macro1") {
      const input = actionText.trim();
      if (!macro1Term.trim() && input) setMacro1Term(input);
    }
  }, [actionText, macro1Term]);

  const handleRunMacro2ManualNumbering = useCallback(async () => {
    if (!onlyOfficeControlApi || !currentFileId) {
      toast.error("Abra um documento no ONLYOFFICE antes de executar Macro2.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await onlyOfficeControlApi.runMacro2ManualNumberingSelection(macro2SpacingMode);
      toast.success(`Macro2 aplicada: ${result.converted} item(ns) convertidos para numeracao manual.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao executar Macro2.");
    } finally {
      setIsLoading(false);
    }
  }, [currentFileId, macro2SpacingMode, onlyOfficeControlApi]);

  const handleRunMacro1Highlight = useCallback(async () => {
    if (!onlyOfficeControlApi || !currentFileId) {
      toast.error("Abra um documento no ONLYOFFICE antes de executar Highlight.");
      return;
    }

    const input = macro1Term.trim();
    if (!input) {
      toast.error("Informe o termo no painel Parameters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await onlyOfficeControlApi.runMacro1HighlightDocument(input, macro1ColorId);
      if (result.matches <= 0) {
        toast.info("Highlight executado. Nenhuma ocorrÃªncia encontrada.");
        return;
      }
      toast.success(
        `Highlight executado: ${result.matches} ocorrÃªncia(s) encontradas e ${result.highlighted} destacada(s).`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao executar Highlight.");
    } finally {
      setIsLoading(false);
    }
  }, [currentFileId, macro1ColorId, macro1Term, onlyOfficeControlApi]);

  const handleClearMacro1Highlight = useCallback(async () => {
    if (!onlyOfficeControlApi || !currentFileId) {
      toast.error("Abra um documento no ONLYOFFICE antes de limpar marcaÃ§Ã£o.");
      return;
    }

    const input = macro1Term.trim();
    if (!input) {
      toast.error("Informe o termo no painel Parameters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await onlyOfficeControlApi.clearMacro1HighlightDocument(input);
      if (result.matches <= 0 || result.cleared <= 0) {
        toast.info("Nenhuma marcaÃ§Ã£o encontrada para limpar.");
        return;
      }
      toast.success(`MarcaÃ§Ã£o limpa em ${result.cleared} ocorrÃªncia(s).`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao limpar marcaÃ§Ã£o.");
    } finally {
      setIsLoading(false);
    }
  }, [currentFileId, macro1Term, onlyOfficeControlApi]);

  const handleSelectRefBook = useCallback((book: string) => {
    setSelectedRefBook(book);
  }, []);

  const normalizeRefPages = useCallback((pages: string) => {
    return pages
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }, []);

  const insertRefBookResultWithPages = useMemo(() => {
    const reference = (insertRefBookResult || "").trim();
    if (!reference) return "";
    const pages = normalizeRefPages(refBookPages);
    if (!pages) return reference;
    return `${reference}; p. ${pages}.`;
  }, [insertRefBookResult, normalizeRefPages, refBookPages]);

  const handleRunInsertRefBook = useCallback(async () => {
    setIsRunningInsertRefBook(true);
    try {
      const result = await insertRefBook(selectedRefBook);
      setInsertRefBookResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Insert Ref Book.";
      setInsertRefBookResult(msg);
      toast.error(msg);
    } finally {
      setIsRunningInsertRefBook(false);
    }
  }, [insertRefBook, selectedRefBook]);

  const handleRunInsertRefVerbete = useCallback(async () => {
    const raw = verbeteInput.trim();
    if (!raw) {
      toast.error("Informe ao menos um verbete.");
      return;
    }

    setIsRunningInsertRefVerbete(true);
    try {
      const data = await insertRefVerbeteApp(raw);
      setInsertRefVerbeteListResult(data.result.ref_list || "");
      setInsertRefVerbeteBiblioResult(data.result.ref_biblio || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Insert Ref Verbete.";
      setInsertRefVerbeteListResult(msg);
      setInsertRefVerbeteBiblioResult(msg);
      toast.error(msg);
    } finally {
      setIsRunningInsertRefVerbete(false);
    }
  }, [verbeteInput]);

  const handleRunBiblioGeral = useCallback(async () => {
    const author = biblioGeralAuthor.trim();
    const title = biblioGeralTitle.trim();
    const year = biblioGeralYear.trim();
    const extra = biblioGeralExtra.trim();
    if (!author && !title && !year && !extra) {
      toast.error("Informe ao menos um campo para buscar bibliografias.");
      return;
    }

    setIsRunningBiblioGeral(true);
    try {
      const data = await biblioGeralApp({ author, title, year, extra, topK: 10 });
      setBiblioGeralResult(data.result.markdown || "");
      if (!data.result.matches?.length) {
        toast.info("Nenhuma bibliografia encontrada.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao executar Bibliografia Geral.";
      setBiblioGeralResult(msg);
      toast.error(msg);
    } finally {
      setIsRunningBiblioGeral(false);
    }
  }, [biblioGeralAuthor, biblioGeralExtra, biblioGeralTitle, biblioGeralYear]);

  const handleInsertRefBookResponseIntoEditor = useCallback(async () => {
    if (!onlyOfficeControlApi) {
      toast.error("API do ONLYOFFICE indisponÃƒÂ­vel no momento.");
      return;
    }

    const content = (insertRefBookResultWithPages || "").trim();
    if (!content) {
      toast.error("A resposta da referÃƒÂªncia estÃƒÂ¡ vazia.");
      return;
    }

    try {
      const markdownContent = normalizeHistoryContentToMarkdown(content);
      const html = markdownToOnlyOfficeHtml(markdownContent);
      await onlyOfficeControlApi.replaceSelectionRich(markdownContent, html);
      toast.success("Resposta inserida no cursor/seleÃƒÂ§ÃƒÂ£o do ONLYOFFICE.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao inserir resposta no ONLYOFFICE.");
    }
  }, [insertRefBookResultWithPages, onlyOfficeControlApi]);

  const handleActionApps = useCallback((type: AppActionId) => {
    setParameterPanelTarget({ section: "apps", id: type });
    if (type === "app1") {
      setInsertRefBookResult("");
      setRefBookPages("");
    }
    if (type === "app2") {
      setInsertRefVerbeteListResult("");
      setInsertRefVerbeteBiblioResult("");
    }
    if (type === "app3") {
      setBiblioGeralResult("");
      if (!biblioGeralTitle.trim() && actionText.trim()) setBiblioGeralTitle(actionText.trim());
    }
  }, [actionText, biblioGeralTitle]);

  const handleAction = useCallback(async (type: "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "translate" | "highlight") => {
    const text = actionText.trim();

    if (!text) {
      toast.error("Selecione um trecho no documento ou escreva na caixa de texto.");
      return;
    }

    if (type === "highlight") {
      if (!currentFileId || !officeDoc) {
        toast.error("Abra um documento no ONLYOFFICE antes de usar Highlight.");
        return;
      }

      setIsLoading(true);
      try {
        const baselineText = documentText;
        const propagatedText = await waitForceSavePropagation(currentFileId, baselineText);
        if (propagatedText === baselineText) {
          await refreshDocumentText(currentFileId);
        }

        const result = await highlightFileTerm(currentFileId, text);
        const payload = await fetchOnlyOfficeConfig(currentFileId);
        setOfficeDoc({ documentServerUrl: payload.documentServerUrl, config: payload.config, token: payload.token });
        await refreshDocumentText(currentFileId);
        setStatsKey((k) => k + 1);
        toast.success(`Highlight aplicado em ${result.matches} ocorrÃƒÂªncia(s).`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erro ao aplicar highlight.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!openAiReady) {
      toast.error("Backend sem OPENAI_API_KEY. Configure no servidor.");
      return;
    }

    if (type === "pensatas") {
      if (!OPENAI_VECTOR_STORE_LO) {
        toast.error("Configure VITE_OPENAI_VECTOR_STORE_LO.");
        return;
      }

      setIsLoading(true);
      try {
        const chunks = await searchVectorStore(OPENAI_VECTOR_STORE_LO, text);
        if (chunks.length === 0) {
          toast.info("Nenhuma correspondÃƒÂªncia encontrada na Vector Store LO.");
        } else {
          const allParagraphs = chunks.flatMap((c) => c.split(/\n/)).map((p) => p.trim()).filter(Boolean).slice(0, 10);
          const content = allParagraphs.map((p, i) => `**${i + 1}.** ${p}`).join("\n\n");
          addResponse("pensatas", text.slice(0, 80), content);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erro ao buscar Pensatas LO.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      let ragContext: string | undefined;
      if (type === "define" || type === "synonyms") {
        const storeIds = OPENAI_VECTOR_STORES.split(",").map((s) => s.trim()).filter(Boolean);
        if (storeIds.length > 0) {
          const allChunks: string[] = [];
          for (const storeId of storeIds) {
            const chunks = await searchVectorStore(storeId, text);
            allChunks.push(...chunks);
          }
          if (allChunks.length > 0) ragContext = allChunks.join("\n\n---\n\n");
        }
      }
      if (type === "translate") {
        if (!OPENAI_VECTOR_STORE_TRANSLATE_RAG) {
          throw new Error("Configure VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG.");
        }
        const chunks = await searchVectorStore(OPENAI_VECTOR_STORE_TRANSLATE_RAG, text);
        if (chunks.length > 0) ragContext = chunks.join("\n\n---\n\n");
      }

      const promptMap = {
        define: (t: string) => buildDefinePrompt(t, ragContext),
        synonyms: (t: string) => buildSynonymsPrompt(t, ragContext),
        epigraph: (t: string) => buildEpigraphPrompt(t, ragContext),
        rewrite: buildRewritePrompt,
        summarize: buildSummarizePrompt,
        translate: (t: string) => buildTranslatePrompt(t, translateLanguage, ragContext),
      };

      const messages = promptMap[type](text);
      const result = await callOpenAI(messages);
      addResponse(type, text.slice(0, 80), result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro na chamada a IA.");
    } finally {
      setIsLoading(false);
    }
  }, [actionText, currentFileId, documentText, officeDoc, openAiReady, refreshDocumentText, translateLanguage, waitForceSavePropagation]);

  const handleOpenAiActionParameters = useCallback((type: "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "translate" | "highlight") => {
    if (type === "highlight") return;
    setParameterPanelTarget({ section: "actions", id: type });
  }, []);

  const handleChat = useCallback(async (message: string) => {
    if (!openAiReady) return;
    setIsLoading(true);
    try {
      const messages = buildChatPrompt(actionText, message, chatHistory);
      const result = await callOpenAI(messages);
      setChatHistory((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: result }]);
      addResponse("chat", message, result);
    } catch (_err) {
      // chat box is not rendered in this layout
    } finally {
      setIsLoading(false);
    }
  }, [openAiReady, actionText, chatHistory]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          id="left-panel"
          order={1}
          defaultSize={PANEL_SIZES.left.default}
          minSize={PANEL_SIZES.left.min}
          maxSize={PANEL_SIZES.left.max}
          className="border-r border-border bg-card"
        >
          <LeftPanel
            stats={stats}
            onWordFileUpload={handleWordFileUpload}
            onCreateBlankDocument={handleCreateBlankDocument}
            onAction={handleOpenAiActionParameters}
            onActionMacros={handleActionMacros}
            onActionApps={handleActionApps}
            actionText={actionText}
            onActionTextChange={setActionText}
            onRetrieveSelectedText={handleRetrieveSelectedText}
            onSelectAllContent={handleSelectAllContent}
            onTriggerSave={handleTriggerSave}
            isLoading={isLoading}
            hasVectorStoreLO={Boolean(OPENAI_VECTOR_STORE_LO)}
            hasDocumentOpen={Boolean(currentFileId)}
            onlyOfficeReady={Boolean(onlyOfficeControlApi)}
            onRefreshStats={() => void handleRefreshStats()}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          id="center-panel"
          order={2}
          defaultSize={PANEL_SIZES.center.default}
          minSize={PANEL_SIZES.center.min}
        >
          <ResizablePanelGroup direction="horizontal">
            {parameterPanelTarget && (
              <>
                <ResizablePanel
                  id="parameter-panel"
                  order={1}
                  defaultSize={PANEL_SIZES.parameter.default}
                  minSize={PANEL_SIZES.parameter.min}
                  maxSize={PANEL_SIZES.parameter.max}
                  className={`border-r border-border ${sidePanelClass}`}
                >
                  {parameterPanelTarget.section === "actions" ? (
                    <AiActionParametersPanel
                      title={parameterActionMeta[parameterPanelTarget.id].title}
                      description={parameterActionMeta[parameterPanelTarget.id].description}
                      actionText={actionText}
                      onActionTextChange={setActionText}
                      onRetrieveSelectedText={() => void handleRetrieveSelectedText()}
                      onApply={() => void handleAction(parameterPanelTarget.id)}
                      isLoading={isLoading}
                      hasDocumentOpen={Boolean(currentFileId)}
                      showLanguageSelect={parameterPanelTarget.id === "translate"}
                      languageOptions={TRANSLATE_LANGUAGE_OPTIONS.map((option) => ({ ...option }))}
                      selectedLanguage={translateLanguage}
                      onSelectedLanguageChange={(value) => setTranslateLanguage(value as (typeof TRANSLATE_LANGUAGE_OPTIONS)[number]["value"])}
                      onClose={() => setParameterPanelTarget(null)}
                    />
                  ) : parameterPanelTarget.section === "macros" && parameterPanelTarget.id === "macro1" ? (
                    <Macro1HighlightPanel
                      title={parameterMacroMeta.macro1.title}
                      description={parameterMacroMeta.macro1.description}
                      term={macro1Term}
                      onTermChange={setMacro1Term}
                      colorOptions={MACRO1_HIGHLIGHT_COLORS.map((item) => ({ ...item }))}
                      selectedColorId={macro1ColorId}
                      onSelectColor={(value) => setMacro1ColorId(value as (typeof MACRO1_HIGHLIGHT_COLORS)[number]["id"])}
                      onRunHighlight={() => void handleRunMacro1Highlight()}
                      onRunClear={() => void handleClearMacro1Highlight()}
                      isRunning={isLoading}
                      onClose={() => setParameterPanelTarget(null)}
                    />
                  ) : parameterPanelTarget.section === "macros" && parameterPanelTarget.id === "macro2" ? (
                    <Macro2ManualNumberingPanel
                      title={parameterMacroMeta.macro2.title}
                      description={parameterMacroMeta.macro2.description}
                      spacingMode={macro2SpacingMode}
                      onSpacingModeChange={setMacro2SpacingMode}
                      isRunning={isLoading}
                      onRun={() => void handleRunMacro2ManualNumbering()}
                      onClose={() => setParameterPanelTarget(null)}
                    />
                  ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app1" ? (
                    <InsertRefBookPanel
                      title={parameterAppMeta.app1.title}
                      description={parameterAppMeta.app1.description}
                      selectedRefBook={selectedRefBook}
                      refBookPages={refBookPages}
                      onSelectRefBook={handleSelectRefBook}
                      onRefBookPagesChange={setRefBookPages}
                      onRunInsertRefBook={() => void handleRunInsertRefBook()}
                      onInsertResponseIntoEditor={() => void handleInsertRefBookResponseIntoEditor()}
                      insertRefBookResult={insertRefBookResultWithPages}
                      isRunningInsertRefBook={isRunningInsertRefBook}
                      onClose={() => setParameterPanelTarget(null)}
                    />
                  ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app2" ? (
                    <InsertRefVerbetePanel
                      title={parameterAppsGenericMeta.app2.title}
                      description={parameterAppsGenericMeta.app2.description}
                      verbeteInput={verbeteInput}
                      onVerbeteInputChange={setVerbeteInput}
                      onRun={() => void handleRunInsertRefVerbete()}
                      refListResult={insertRefVerbeteListResult}
                      refBiblioResult={insertRefVerbeteBiblioResult}
                      isRunning={isRunningInsertRefVerbete}
                      onClose={() => setParameterPanelTarget(null)}
                    />
                  ) : parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app3" ? (
                    <BiblioGeralPanel
                      title={parameterAppsGenericMeta.app3.title}
                      description={parameterAppsGenericMeta.app3.description}
                      author={biblioGeralAuthor}
                      titleField={biblioGeralTitle}
                      year={biblioGeralYear}
                      extra={biblioGeralExtra}
                      onAuthorChange={setBiblioGeralAuthor}
                      onTitleFieldChange={setBiblioGeralTitle}
                      onYearChange={setBiblioGeralYear}
                      onExtraChange={setBiblioGeralExtra}
                      onRun={() => void handleRunBiblioGeral()}
                      resultMarkdown={biblioGeralResult}
                      isRunning={isRunningBiblioGeral}
                      onClose={() => setParameterPanelTarget(null)}
                    />
                  ) : (
                    <div className="flex h-full flex-col">
                      <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--panel-header))] px-4 py-3">
                        <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
                        <button
                          type="button"
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => setParameterPanelTarget(null)}
                          title="Fechar Parameters"
                        >
                          x
                        </button>
                      </div>
                      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                        {parameterPanelTarget.section === "macros"
                          ? `${parameterMacroMeta[parameterPanelTarget.id].title}: ${parameterMacroMeta[parameterPanelTarget.id].description}`
                          : `${parameterAppsGenericMeta[parameterPanelTarget.id as "app2" | "app3"]?.title || "App"}: ${parameterAppsGenericMeta[parameterPanelTarget.id as "app2" | "app3"]?.description || "Sem configuraÃƒÂ§ÃƒÂ£o disponÃƒÂ­vel."}`}
                      </div>
                    </div>
                  )}
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            <ResizablePanel
              id="editor-panel"
              order={parameterPanelTarget ? 2 : 1}
              defaultSize={parameterPanelTarget ? PANEL_SIZES.editorWithParameter.default : PANEL_SIZES.editorWithoutParameter.default}
              minSize={parameterPanelTarget ? PANEL_SIZES.editorWithParameter.min : PANEL_SIZES.editorWithoutParameter.min}
            >
              <main className="relative h-full min-w-0 bg-[hsl(var(--panel-bg))]">
                <OnlyOfficeEditor documentConfig={officeDoc} onControlApiReady={setOnlyOfficeControlApi} />
                {isOpeningDocument && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Processing</span>
                    </div>
                  </div>
                )}
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          id="right-panel"
          order={3}
          defaultSize={PANEL_SIZES.right.default}
          minSize={PANEL_SIZES.right.min}
          maxSize={PANEL_SIZES.right.max}
          className={`border-l border-border ${sidePanelClass}`}
        >
          <RightPanel
            responses={responses}
            onClear={() => setResponses([])}
            onSendMessage={(message) => void handleChat(message)}
            isSending={isLoading}
            chatDisabled={!openAiReady}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {isLoading && (
        <div className="pointer-events-none absolute right-4 top-3 inline-flex h-7 items-center gap-1.5 rounded-full border border-green-200 bg-green-50/95 px-3 text-[11px] font-semibold leading-none text-green-800 shadow-sm ring-1 ring-green-100">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-green-700" />
          <span className="leading-none">Processando</span>
        </div>
      )}
    </div>
  );
};

export default Index;




