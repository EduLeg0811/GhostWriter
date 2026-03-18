export const DEFAULT_MARKDOWN_PLACEHOLDER_HTML =""
  // "<span class='text-muted-foreground'>A resposta da macro aparece aqui.</span>";

export function renderBasicMarkdown(text: string): string {
  const escaped = (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function renderInlineMarkdown(text: string): string {
  const escaped = (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // suporte basico a links markdown: [label](https://...)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

export function markdownToEditorHtml(text: string): string {
  const raw = (text || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return "";

  const lines = raw.split("\n");
  const htmlLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "<br/>";
    if (/^###\s+/.test(trimmed)) return `<h3>${renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}</h3>`;
    if (/^##\s+/.test(trimmed)) return `<h2>${renderInlineMarkdown(trimmed.replace(/^##\s+/, ""))}</h2>`;
    if (/^#\s+/.test(trimmed)) return `<h1>${renderInlineMarkdown(trimmed.replace(/^#\s+/, ""))}</h1>`;
    return `<p>${renderInlineMarkdown(trimmed)}</p>`;
  });

  return htmlLines.join("");
}

export function plainTextToEditorHtml(text: string): string {
  const raw = (text || "").replace(/\r\n/g, "\n");
  if (!raw.trim()) return "<p></p>";
  return raw
    .split("\n")
    .map((line) => `<p>${renderInlineMarkdown(line.trim()) || "<br/>"}</p>`)
    .join("");
}

export function normalizeHistoryContentToMarkdown(text: string): string {
  const raw = (text || "").trim();
  if (!raw) return "";

  const hasHtml = /<\s*\/?\s*(strong|b|em|i|br|p)\b[^>]*>/i.test(raw);
  if (!hasHtml) return raw;

  return raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n")
    .replace(/<\s*p\b[^>]*>/gi, "")
    .replace(/<\s*(strong|b)\b[^>]*>([\s\S]*?)<\s*\/\s*(strong|b)\s*>/gi, "**$2**")
    .replace(/<\s*(em|i)\b[^>]*>([\s\S]*?)<\s*\/\s*(em|i)\s*>/gi, "*$2*")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .trim();
}
