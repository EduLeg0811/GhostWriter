export interface UploadedFileMeta {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  ext: string;
  createdAt: string;
  convertedFromPdf?: boolean;
  sourceExt?: string;
  sourceStoredName?: string;
  conversionError?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function safeReadError(res: Response): Promise<string> {
  try {
    const text = (await res.text()).trim();
    if (!text) return `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      return parsed?.detail || text;
    } catch {
      return text;
    }
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function fetchJsonWithRetry<T>(input: string, init: RequestInit, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return (await res.json()) as T;

      const message = await safeReadError(res);
      if (attempt < retries && RETRYABLE_STATUS.has(res.status)) {
        await wait(180 * (attempt + 1));
        continue;
      }
      throw new Error(message);
    } catch (err: unknown) {
      lastError = err;
      const isNetworkError =
        err instanceof TypeError ||
        (err instanceof Error && /failed to fetch|networkerror|load failed/i.test(err.message));
      if (attempt < retries && isNetworkError) {
        await wait(180 * (attempt + 1));
        continue;
      }
      break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Falha de rede ao comunicar com o backend.");
}

export async function uploadFileToServer(file: File): Promise<UploadedFileMeta> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(apiUrl("/api/files/upload"), { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createBlankDocOnServer(title = "novo-documento.docx"): Promise<UploadedFileMeta> {
  const res = await fetch(apiUrl("/api/files/create-blank"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchFileText(fileId: string): Promise<{ id: string; ext: string; text: string; html?: string; updatedAt: string }> {
  const res = await fetch(apiUrl(`/api/files/${encodeURIComponent(fileId)}/text?t=${Date.now()}`), { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchFileContentBuffer(fileId: string): Promise<ArrayBuffer> {
  const res = await fetch(apiUrl(`/api/files/${encodeURIComponent(fileId)}/content?t=${Date.now()}`), { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.arrayBuffer();
}

export async function saveFileText(fileId: string, payload: { text: string; html?: string }): Promise<{ ok: boolean; id: string; updatedAt: string }> {
  const res = await fetch(apiUrl(`/api/files/${encodeURIComponent(fileId)}/text`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function highlightFileTerm(fileId: string, term: string): Promise<{ ok: boolean; updated: boolean; matches: number; term: string; color: string }> {
  const res = await fetch(apiUrl(`/api/files/${encodeURIComponent(fileId)}/highlight`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function healthCheck(): Promise<{ ok: boolean; openaiConfigured: boolean }> {
  const res = await fetch(apiUrl("/api/health"));
  if (!res.ok) throw new Error("Backend indisponivel.");
  return res.json();
}

export async function insertRefBookMacro(book: string): Promise<{ ok: boolean; result: string }> {
  const res = await fetch(apiUrl("/api/macros/insert-ref-book"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function insertRefVerbeteApp(titles: string): Promise<{ ok: boolean; result: { ref_list: string; ref_biblio: string } }> {
  const res = await fetch(apiUrl("/api/apps/insert-ref-verbete"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titles }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function biblioGeralApp(payload: { author?: string; title?: string; year?: string; extra?: string; topK?: number }): Promise<{ ok: boolean; result: { query: { author: string; title: string; year: string; extra: string }; matches: string[]; markdown: string } }> {
  const res = await fetch(apiUrl("/api/apps/biblio-geral"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function biblioExternaApp(payload: {
  query?: string;
  author?: string;
  title?: string;
  year?: string;
  journal?: string;
  publisher?: string;
  identifier?: string;
  extra?: string;
  topK?: number;
}): Promise<{ ok: boolean; result: { query: string; matches: string[]; markdown: string; score?: { score_percentual?: number; classificacao?: string } } }> {
  const res = await fetch(apiUrl("/api/apps/biblio-externa"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function randomPensataApp(): Promise<{ ok: boolean; result: { paragraph: string; paragraph_number: number; total_paragraphs: number; source: string } }> {
  const res = await fetch(apiUrl("/api/apps/random-pensata"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function openVerbetografiaTableApp(payload: { title?: string; specialty?: string }): Promise<UploadedFileMeta> {
  const res = await fetch(apiUrl("/api/apps/verbetografia/open-table"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listLexicalBooksApp(): Promise<{ ok: boolean; result: { books: string[] } }> {
  return fetchJsonWithRetry(apiUrl("/api/apps/lexical/books"), { method: "GET", cache: "no-store" });
}

export async function searchLexicalBookApp(payload: {
  book: string;
  term: string;
  limit?: number;
}): Promise<{
  ok: boolean;
  result: {
    book: string;
    term: string;
    total: number;
    matches: Array<{
      book: string;
      row: number;
      number: number | null;
      title: string;
      text: string;
      data: Record<string, string>;
    }>;
  };
}> {
  return fetchJsonWithRetry(apiUrl("/api/apps/lexical/search"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

export async function searchVerbeteApp(payload: {
  author?: string;
  title?: string;
  area?: string;
  text?: string;
  limit?: number;
}): Promise<{
  ok: boolean;
  result: {
    query: {
      author: string;
      title: string;
      area: string;
      text: string;
    };
    total: number;
    matches: Array<{
      row: number;
      number: number | null;
      title: string;
      text: string;
      link: string;
      data: Record<string, string>;
    }>;
  };
}> {
  return fetchJsonWithRetry(apiUrl("/api/apps/lexical/verbetes/search"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}
