import { useEffect, useMemo, useRef, useState } from "react";
import { OnlyOfficeControlApi } from "@/lib/onlyoffice-control";
import { FileText } from "lucide-react";

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: Record<string, unknown>) => {
        destroyEditor?: () => void;
      };
    };
  }
}

export interface OnlyOfficeDocumentConfig {
  documentServerUrl: string;
  config: Record<string, unknown>;
  token?: string;
}

interface OnlyOfficeEditorProps {
  documentConfig: OnlyOfficeDocumentConfig | null;
  onControlApiReady?: (api: OnlyOfficeControlApi | null) => void;
}

type EditorInstance = { destroyEditor?: () => void };

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (window.DocsAPI) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar API ONLYOFFICE: ${src}`));
    document.body.appendChild(script);
  });
}

async function waitForEditorIframe(host: HTMLDivElement, timeoutMs = 10000): Promise<HTMLIFrameElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const iframe =
      host.querySelector("iframe")
      || document.querySelector("#onlyoffice-editor-host iframe")
      || document.querySelector("iframe[name*='frameEditor']");
    if (iframe) return iframe as HTMLIFrameElement;
    await new Promise((resolve) => window.setTimeout(resolve, 120));
  }
  return null;
}

function findPluginBridgeWindow(): Window | null {
  const pluginIframe = document.querySelector("iframe[src*='/onlyoffice-plugin/plugin.html']") as HTMLIFrameElement | null;
  return pluginIframe?.contentWindow || null;
}

const OnlyOfficeEditor = ({ documentConfig, onControlApiReady }: OnlyOfficeEditorProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  const controlApiRef = useRef<OnlyOfficeControlApi | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedServerUrl = useMemo(
    () => documentConfig?.documentServerUrl?.replace(/\/+$/, "") || "",
    [documentConfig],
  );

  useEffect(() => {
    if (!documentConfig || !hostRef.current) return;

    let disposed = false;
    let retryTimer: number | null = null;

    const mount = async () => {
      if (!normalizedServerUrl) throw new Error("ONLYOFFICE_DOCUMENT_SERVER_URL nao configurada.");

      setStatus("loading");
      setErrorMessage("");

      await loadScript(`${normalizedServerUrl}/web-apps/apps/api/documents/api.js`);
      if (disposed || !window.DocsAPI || !hostRef.current) return;

      if (controlApiRef.current) {
        controlApiRef.current.destroy();
        controlApiRef.current = null;
      }
      onControlApiReady?.(null);

      if (editorRef.current?.destroyEditor) editorRef.current.destroyEditor();

      hostRef.current.innerHTML = "";
      hostRef.current.id = "onlyoffice-editor-host";

      const config: Record<string, unknown> = { ...documentConfig.config };
      if (documentConfig.token?.trim()) config.token = documentConfig.token.trim();

      editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor-host", config);
      setStatus("ready");

      const attachBridge = async (attempt = 1): Promise<void> => {
        if (disposed || !hostRef.current) return;
        const iframe = await waitForEditorIframe(hostRef.current, 10000);
        if (!iframe?.contentWindow) {
          throw new Error("iframe do editor nao encontrado.");
        }

        const controlApi = new OnlyOfficeControlApi(() => findPluginBridgeWindow() || iframe.contentWindow);
        await controlApi.init();
        if (disposed) {
          controlApi.destroy();
          return;
        }
        controlApiRef.current = controlApi;
        onControlApiReady?.(controlApi);
        console.log(`[onlyoffice] bridge conectado (tentativa ${attempt})`);
      };

      const tryAttachWithRetry = async (attempt = 1) => {
        try {
          await attachBridge(attempt);
        } catch (err) {
          console.warn(`[onlyoffice] bridge indisponivel (tentativa ${attempt})`, err);
          if (disposed || attempt >= 8) return;
          retryTimer = window.setTimeout(() => {
            void tryAttachWithRetry(attempt + 1);
          }, 1500);
        }
      };

      void tryAttachWithRetry(1);
    };

    mount().catch((err) => {
      console.error("[onlyoffice]", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Falha ao abrir documento no ONLYOFFICE.");
    });

    return () => {
      disposed = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
      if (controlApiRef.current) {
        controlApiRef.current.destroy();
        controlApiRef.current = null;
      }
      onControlApiReady?.(null);
      if (editorRef.current?.destroyEditor) editorRef.current.destroyEditor();
      editorRef.current = null;
    };
  }, [documentConfig, normalizedServerUrl, onControlApiReady]);

  if (!documentConfig) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Faca upload de um documento para abrir no ONLYOFFICE.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4 text-center text-sm text-muted-foreground">
          Abrindo documento...
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background p-6 text-center text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default OnlyOfficeEditor;
