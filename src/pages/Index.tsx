import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import LeftPanel from "@/components/LeftPanel";
import RightPanel, { AIResponse } from "@/components/RightPanel";
import OnlyOfficeEditor, { OnlyOfficeDocumentConfig } from "@/components/OnlyOfficeEditor";
import InsertRefBookPanel from "@/components/InsertRefBookPanel";
import InsertRefVerbetePanel from "@/components/InsertRefVerbetePanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useTextStats } from "@/hooks/useTextStats";
import {
  createBlankDocOnServer,
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
  buildChatPrompt,
} from "@/lib/openai";

const OPENAI_VECTOR_STORES = (import.meta.env.VITE_OPENAI_VECTOR_STORES as string | undefined)?.trim() || "";
const OPENAI_VECTOR_STORE_LO = (import.meta.env.VITE_OPENAI_VECTOR_STORE_LO as string | undefined)?.trim() || "";

type MacroActionId = "macro1" | "macro2";
type AppActionId = "app1" | "app2";
type ParameterPanelTarget = { section: "macros"; id: MacroActionId } | { section: "apps"; id: AppActionId } | null;

const parameterAppMeta: Record<"app1", { title: string; description: string }> = {
  app1: { title: "Bibliografia de Livros", description: "Cria Bibliografia de livros de Waldo Vieira." },
};
const parameterMacroMeta: Record<MacroActionId, { title: string; description: string }> = {
  macro1: { title: "Macro1", description: "Sem acao associada no momento." },
  macro2: { title: "Macro2", description: "Sem acao associada no momento." },
};
const parameterAppsGenericMeta: Record<"app2", { title: string; description: string }> = {
  app2: { title: "Bibliografia de Verbetes", description: "Cria Listagem ou Bibliografia de verbetes da Enciclopedia." },
};
const sidePanelClass = "bg-card";
const PANEL_SIZES = {
  left: { default: 10, min: 7, max: 15 },
  parameter: { default: 9, min: 5, max: 15 },
  editorWithParameter: { default: 55, min: 35 },
  editorWithoutParameter: { default: 70, min: 35 },
  right: { default: 20, min: 10, max: 40 },
} as const;

const Index = () => {
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionText, setActionText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [documentText, setDocumentText] = useState("");
  const [currentFileId, setCurrentFileId] = useState("");
  const [statsKey, setStatsKey] = useState(0);
  const [officeDoc, setOfficeDoc] = useState<OnlyOfficeDocumentConfig | null>(null);
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

  const stats = useTextStats(documentText || actionText, statsKey);

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
      return;
    }
    try {
      const data = await fetchFileText(fileId);
      setDocumentText(data.text || "");
    } catch (_err) {
      setDocumentText("");
    }
  }, []);

  useEffect(() => {
    void refreshDocumentText(currentFileId);
  }, [currentFileId, refreshDocumentText]);

  const handleWordFileUpload = useCallback(async (file: File): Promise<UploadedFileMeta> => {
    const uploaded = await uploadFileToServer(file);
    if (!["docx", "doc", "rtf", "odt"].includes(uploaded.ext)) {
      const reason = uploaded.conversionError ? ` ${uploaded.conversionError}` : "";
      throw new Error(`Nao foi possivel abrir no ONLYOFFICE. O PDF nao converteu para DOCX.${reason}`);
    }

    const payload = await fetchOnlyOfficeConfig(uploaded.id);
    setActionText("");
    setCurrentFileId(uploaded.id);
    void refreshDocumentText(uploaded.id);
    setOfficeDoc({ documentServerUrl: payload.documentServerUrl, config: payload.config, token: payload.token });
    return uploaded;
  }, [refreshDocumentText]);

  const handleCreateBlankDocument = useCallback(async (): Promise<void> => {
    const created = await createBlankDocOnServer("novo-documento.docx");
    const payload = await fetchOnlyOfficeConfig(created.id);
    setActionText("");
    setCurrentFileId(created.id);
    void refreshDocumentText(created.id);
    setOfficeDoc({ documentServerUrl: payload.documentServerUrl, config: payload.config, token: payload.token });
  }, [refreshDocumentText]);

  const handleRefreshStats = useCallback(async () => {
    setStatsKey((k) => k + 1);
    if (!currentFileId) {
      toast.error("Nenhum documento aberto no ONLYOFFICE.");
      return;
    }

    try {
      await forceSaveOnlyOffice(currentFileId);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
    } catch (_err) {
      // continue
    }

    await refreshDocumentText(currentFileId);
  }, [currentFileId, refreshDocumentText]);

  const handleRetrieveSelectedText = useCallback(async () => {
    if (!onlyOfficeControlApi) {
      toast.error("API do ONLYOFFICE indisponivel no momento.");
      return;
    }

    try {
      const selected = (await onlyOfficeControlApi.getSelectedText()).trim();
      if (!selected) throw new Error("Nenhum texto selecionado no ONLYOFFICE.");
      setActionText(selected);
      toast.success("Trecho selecionado aplicado na caixa de texto.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao obter selecao.");
    }
  }, [onlyOfficeControlApi]);

  const handleSelectAllContent = useCallback(async () => {
    if (!onlyOfficeControlApi) {
      toast.error("Controle do ONLYOFFICE indisponivel.");
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
      toast.error("API do ONLYOFFICE indisponivel no momento.");
      return;
    }
    if (responses.length === 0) {
      toast.error("Ainda nao ha resposta no historico para aplicar.");
      return;
    }

    const latestResponse = responses[0]?.content?.trim() || "";
    if (!latestResponse) {
      toast.error("A ultima resposta do historico esta vazia.");
      return;
    }

    try {
      const markdownContent = normalizeHistoryContentToMarkdown(latestResponse);
      const html = markdownToOnlyOfficeHtml(markdownContent);
      await onlyOfficeControlApi.replaceSelectionRich(markdownContent, html);
      toast.success("Ultima resposta aplicada no cursor/selecao do ONLYOFFICE.");
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

  const handleActionMacros = useCallback((type: MacroActionId) => {
    setParameterPanelTarget({ section: "macros", id: type });
  }, []);

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

  const handleInsertRefBookResponseIntoEditor = useCallback(async () => {
    if (!onlyOfficeControlApi) {
      toast.error("API do ONLYOFFICE indisponivel no momento.");
      return;
    }

    const content = (insertRefBookResultWithPages || "").trim();
    if (!content) {
      toast.error("A resposta da referencia esta vazia.");
      return;
    }

    try {
      const markdownContent = normalizeHistoryContentToMarkdown(content);
      const html = markdownToOnlyOfficeHtml(markdownContent);
      await onlyOfficeControlApi.replaceSelectionRich(markdownContent, html);
      toast.success("Resposta inserida no cursor/selecao do ONLYOFFICE.");
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
  }, []);

  const handleAction = useCallback(async (type: "define" | "synonyms" | "epigraph" | "rewrite" | "summarize" | "pensatas" | "highlight") => {
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
        try {
          await forceSaveOnlyOffice(currentFileId);
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        } catch (_err) {
          // continue
        }

        const result = await highlightFileTerm(currentFileId, text);
        const payload = await fetchOnlyOfficeConfig(currentFileId);
        setOfficeDoc({ documentServerUrl: payload.documentServerUrl, config: payload.config, token: payload.token });
        await refreshDocumentText(currentFileId);
        setStatsKey((k) => k + 1);
        toast.success(`Highlight aplicado em ${result.matches} ocorrencia(s).`);
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
          toast.info("Nenhuma correspondencia encontrada na Vector Store LO.");
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

      const promptMap = {
        define: (t: string) => buildDefinePrompt(t, ragContext),
        synonyms: (t: string) => buildSynonymsPrompt(t, ragContext),
        epigraph: (t: string) => buildEpigraphPrompt(t, ragContext),
        rewrite: buildRewritePrompt,
        summarize: buildSummarizePrompt,
      };

      const messages = promptMap[type](text);
      const result = await callOpenAI(messages);
      addResponse(type, text.slice(0, 80), result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro na chamada a IA.");
    } finally {
      setIsLoading(false);
    }
  }, [actionText, currentFileId, officeDoc, openAiReady, refreshDocumentText]);

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
            onAction={handleAction}
            onActionMacros={handleActionMacros}
            onActionApps={handleActionApps}
            actionText={actionText}
            onActionTextChange={setActionText}
            onRetrieveSelectedText={handleRetrieveSelectedText}
            onSelectAllContent={handleSelectAllContent}
            onTriggerSave={handleTriggerSave}
            isLoading={isLoading}
            openAiReady={openAiReady}
            hasVectorStoreLO={Boolean(OPENAI_VECTOR_STORE_LO)}
            hasDocumentOpen={Boolean(currentFileId)}
            onlyOfficeReady={Boolean(onlyOfficeControlApi)}
            onRefreshStats={() => void handleRefreshStats()}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {parameterPanelTarget && (
          <>
            <ResizablePanel
              id="parameter-panel"
              order={2}
              defaultSize={PANEL_SIZES.parameter.default}
              minSize={PANEL_SIZES.parameter.min}
              maxSize={PANEL_SIZES.parameter.max}
              className={`border-r border-border ${sidePanelClass}`}
            >
              {parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app1" ? (
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
                      : `${parameterAppsGenericMeta[parameterPanelTarget.id as "app2"]?.title || "App"}: ${parameterAppsGenericMeta[parameterPanelTarget.id as "app2"]?.description || "Sem configuracao disponivel."}`}
                  </div>
                </div>
              )}
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel
          id="editor-panel"
          order={parameterPanelTarget ? 3 : 2}
          defaultSize={parameterPanelTarget ? PANEL_SIZES.editorWithParameter.default : PANEL_SIZES.editorWithoutParameter.default}
          minSize={parameterPanelTarget ? PANEL_SIZES.editorWithParameter.min : PANEL_SIZES.editorWithoutParameter.min}
        >
          <main className="h-full min-w-0 bg-[hsl(var(--panel-bg))]">
            <OnlyOfficeEditor documentConfig={officeDoc} onControlApiReady={setOnlyOfficeControlApi} />
          </main>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          id="right-panel"
          order={parameterPanelTarget ? 4 : 3}
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
