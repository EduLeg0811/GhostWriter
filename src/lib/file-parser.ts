import mammoth from "mammoth";

export async function parseDocxArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
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
