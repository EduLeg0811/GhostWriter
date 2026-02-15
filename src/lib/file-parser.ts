import mammoth from "mammoth";

/**
 * Parse a DOCX file and return its HTML content.
 */
export async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "b => strong",
        "i => em",
        "u => u",
        "strike => s",
      ],
    },
  );
  if (result.messages.length > 0) {
    console.log("[file-parser] mammoth messages:", result.messages);
  }
  return result.value;
}

/**
 * Parse a plain text or RTF file (fallback: read as text).
 */
export async function parsePlainText(file: File): Promise<string> {
  const text = await file.text();
  // Wrap paragraphs in <p> tags
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/**
 * Determine parser based on file extension and return HTML.
 */
export async function parseFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (["docx", "doc"].includes(ext)) {
    return parseDocx(file);
  }

  if (["txt", "rtf", "odt"].includes(ext)) {
    return parsePlainText(file);
  }

  if (ext === "pdf") {
    // PDF support would require pdfjs-dist; for now, read as text fallback
    return parsePlainText(file);
  }

  throw new Error(`Formato não suportado: .${ext}`);
}
