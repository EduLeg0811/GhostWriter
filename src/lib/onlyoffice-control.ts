export interface OnlyOfficeSelectionSnapshot {
  text: string;
  selectionType: string;
  changedAt: number;
}

type SelectionListener = (snapshot: OnlyOfficeSelectionSnapshot) => void;

interface BridgeMessage {
  source?: string;
  type?: string;
  payload?: {
    id?: string;
    result?: unknown;
    message?: string;
    text?: string;
    selectionType?: string;
    changedAt?: number;
  };
}

const APP_SOURCE = "parapreceptor-app";
const PLUGIN_SOURCE = "parapreceptor-onlyoffice-plugin";
const REQUEST_TIMEOUT_MS = 4000;
const READY_TIMEOUT_MS = 12000;
const LONG_REQUEST_TIMEOUT_MS = 30000;

export class OnlyOfficeControlApi {
  private getTargetWindow: () => Window | null;
  private selectionListeners = new Set<SelectionListener>();
  private latestSelection: OnlyOfficeSelectionSnapshot = { text: "", selectionType: "none", changedAt: Date.now() };
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private pluginReady = false;
  private bridgeWindow: Window | null = null;
  private requestMap = new Map<string, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void; timer: number }>();

  constructor(getTargetWindow: () => Window | null) {
    this.getTargetWindow = getTargetWindow;
  }

  async init(): Promise<void> {
    if (this.messageHandler) return;

    this.messageHandler = (event: MessageEvent) => {
      const data = (event.data || {}) as BridgeMessage;
      if (data.source !== PLUGIN_SOURCE) return;

      if (data.type === "ready") {
        this.pluginReady = true;
        this.bridgeWindow = (event.source as Window) || this.bridgeWindow;
        return;
      }

      if (data.type === "selectionChanged") {
        this.bridgeWindow = (event.source as Window) || this.bridgeWindow;
        const snapshot: OnlyOfficeSelectionSnapshot = {
          text: String(data.payload?.text || ""),
          selectionType: String(data.payload?.selectionType || "unknown"),
          changedAt: Number(data.payload?.changedAt || Date.now()),
        };
        this.latestSelection = snapshot;
        for (const listener of this.selectionListeners) listener(snapshot);
        return;
      }

      const id = data.payload?.id;
      if (!id || !this.requestMap.has(id)) return;
      const req = this.requestMap.get(id)!;
      window.clearTimeout(req.timer);
      this.requestMap.delete(id);

      if (data.type === "response") req.resolve(data.payload?.result);
      if (data.type === "error") req.reject(new Error(data.payload?.message || "Erro no bridge ONLYOFFICE."));
    };

    window.addEventListener("message", this.messageHandler);

    const start = Date.now();
    while (Date.now() - start < READY_TIMEOUT_MS) {
      if (this.pluginReady) return;
      await new Promise((resolve) => window.setTimeout(resolve, 200));
    }
    throw new Error("Bridge do ONLYOFFICE nao respondeu (timeout).");
  }

  destroy(): void {
    for (const req of this.requestMap.values()) {
      window.clearTimeout(req.timer);
      req.reject(new Error("Bridge encerrado."));
    }
    this.requestMap.clear();
    this.selectionListeners.clear();
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }
    this.pluginReady = false;
    this.bridgeWindow = null;
  }

  onSelectionChanged(listener: SelectionListener): () => void {
    this.selectionListeners.add(listener);
    listener(this.latestSelection);
    return () => this.selectionListeners.delete(listener);
  }

  async getSelectedText(): Promise<string> {
    const live = (this.latestSelection.text || "").trim();
    if (live) return live;
    const result = await this.request("getSelectedText");
    return String(result || "").trim();
  }

  async selectAllContent(): Promise<void> {
    await this.request("selectAllContent");
  }

  async getDocumentPageCount(): Promise<number> {
    const result = await this.request("getDocumentPageCount", {}, LONG_REQUEST_TIMEOUT_MS);
    const count = Number(result || 0);
    return Number.isFinite(count) && count >= 0 ? count : 0;
  }

  async getDocumentStats(): Promise<{ pages: number; paragraphs: number; words: number; symbols: number; symbolsWithSpaces: number }> {
    const result = await this.request("getDocumentStats", {}, LONG_REQUEST_TIMEOUT_MS);
    const data = (result || {}) as { pages?: number; paragraphs?: number; words?: number; symbols?: number; symbolsWithSpaces?: number };
    return {
      pages: Number.isFinite(Number(data.pages)) ? Number(data.pages) : 0,
      paragraphs: Number.isFinite(Number(data.paragraphs)) ? Number(data.paragraphs) : 0,
      words: Number.isFinite(Number(data.words)) ? Number(data.words) : 0,
      symbols: Number.isFinite(Number(data.symbols)) ? Number(data.symbols) : 0,
      symbolsWithSpaces: Number.isFinite(Number(data.symbolsWithSpaces)) ? Number(data.symbolsWithSpaces) : 0,
    };
  }

  async replaceSelection(text: string): Promise<void> {
    const content = text.trim();
    if (!content) throw new Error("Texto vazio para substituir.");
    await this.request("replaceSelection", { text: content });
  }

  async replaceSelectionRich(text: string, html: string): Promise<void> {
    const content = text.trim();
    const htmlContent = html.trim();
    if (!content && !htmlContent) throw new Error("Texto vazio para substituir.");
    await this.request("replaceSelection", { text: content, html: htmlContent });
  }

  async runMacro1HighlightDocument(
    text: string,
    color = "yellow",
  ): Promise<{ terms: number; matches: number; highlighted: number; color: string }> {
    const content = text.trim();
    if (!content) throw new Error("Informe o Texto de entrada para a Macro1.");
    const result = await this.request("macro1HighlightDocument", { text: content, color }, LONG_REQUEST_TIMEOUT_MS);
    return (result || {}) as { terms: number; matches: number; highlighted: number; color: string };
  }

  async clearMacro1HighlightDocument(text: string): Promise<{ terms: number; matches: number; cleared: number }> {
    const content = text.trim();
    if (!content) throw new Error("Informe o Texto de entrada para limpar marcacoes da Macro1.");
    const result = await this.request("macro1ClearHighlightDocument", { text: content }, LONG_REQUEST_TIMEOUT_MS);
    return (result || {}) as { terms: number; matches: number; cleared: number };
  }

  private request(command: string, payload: Record<string, unknown> = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<unknown> {
    const target = this.bridgeWindow || this.getTargetWindow();
    if (!target) return Promise.reject(new Error("Iframe ONLYOFFICE indisponivel."));

    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timer = window.setTimeout(() => {
        this.requestMap.delete(id);
        reject(new Error(`Timeout comando bridge: ${command}`));
      }, timeoutMs);

      this.requestMap.set(id, { resolve, reject, timer });
      target.postMessage({ source: APP_SOURCE, type: "command", id, command, payload }, "*");
    });
  }
}
