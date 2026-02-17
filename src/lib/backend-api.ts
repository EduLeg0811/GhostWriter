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
