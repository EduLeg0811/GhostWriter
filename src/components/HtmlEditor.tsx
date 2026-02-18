import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontFamily, FontSize, LineHeight, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Bold, Highlighter, Italic, List, ListOrdered, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HtmlEditorControlApi } from "@/lib/html-editor-control";

interface HtmlEditorProps {
  contentHtml: string;
  documentVersion?: number;
  onControlApiReady?: (api: HtmlEditorControlApi | null) => void;
  onContentChange?: (payload: { html: string; text: string }) => void;
  onCloseEditor?: () => void;
}

const HtmlEditor = ({ contentHtml, documentVersion = 0, onControlApiReady, onContentChange, onCloseEditor }: HtmlEditorProps) => {
  const controlApiRef = useRef<HtmlEditorControlApi | null>(null);
  const [documentFontSizePx, setDocumentFontSizePx] = useState(15);
  const [documentLineHeightRatio, setDocumentLineHeightRatio] = useState(1.6);
  const DEFAULT_DOCUMENT_FONT_SIZE_PX = 12;
  const DEFAULT_DOCUMENT_LINE_HEIGHT_RATIO = 1.5;

  const normalizedContent = useMemo(() => (contentHtml || "").trim(), [contentHtml]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
    ],
    content: normalizedContent || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-full w-full px-6 py-5 text-foreground focus:outline-none",
      },
    },
    onCreate: ({ editor: e }) => {
      const api = new HtmlEditorControlApi(e);
      api.init();
      controlApiRef.current = api;
      onControlApiReady?.(api);
    },
    onUpdate: ({ editor: e }) => {
      onContentChange?.({
        html: e.getHTML(),
        text: e.getText({ blockSeparator: "\n" }),
      });
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = (editor.getHTML() || "").trim();
    const next = normalizedContent || "<p></p>";
    if (current === next) return;
    editor.commands.setContent(next, { emitUpdate: true });
  }, [editor, normalizedContent]);

  useEffect(() => {
    return () => {
      if (controlApiRef.current) {
        controlApiRef.current.destroy();
        controlApiRef.current = null;
      }
      onControlApiReady?.(null);
    };
  }, [onControlApiReady]);

  const applyDocumentFontSize = useCallback((nextFontSizePx: number) => {
    const clamped = Math.max(8, Math.min(72, nextFontSizePx));
    setDocumentFontSizePx(clamped);
  }, []);

  const increaseDocumentFontSize = useCallback(() => {
    applyDocumentFontSize(documentFontSizePx + 1);
  }, [applyDocumentFontSize, documentFontSizePx]);

  const decreaseDocumentFontSize = useCallback(() => {
    applyDocumentFontSize(documentFontSizePx - 1);
  }, [applyDocumentFontSize, documentFontSizePx]);

  const applyDocumentLineHeight = useCallback((nextRatio: number) => {
    const clampedRatio = Math.max(0.8, Math.min(3, Number(nextRatio.toFixed(2))));
    setDocumentLineHeightRatio(clampedRatio);
  }, []);

  const increaseDocumentLineHeight = useCallback(() => {
    applyDocumentLineHeight(documentLineHeightRatio + 0.1);
  }, [applyDocumentLineHeight, documentLineHeightRatio]);

  const decreaseDocumentLineHeight = useCallback(() => {
    applyDocumentLineHeight(documentLineHeightRatio - 0.1);
  }, [applyDocumentLineHeight, documentLineHeightRatio]);

  const resetDocumentTypography = useCallback(() => {
    setDocumentFontSizePx(DEFAULT_DOCUMENT_FONT_SIZE_PX);
    setDocumentLineHeightRatio(DEFAULT_DOCUMENT_LINE_HEIGHT_RATIO);
  }, []);

  useEffect(() => {
    // Applies the same typography baseline used by the Reset button whenever a document is opened/reloaded.
    setDocumentFontSizePx(DEFAULT_DOCUMENT_FONT_SIZE_PX);
    setDocumentLineHeightRatio(DEFAULT_DOCUMENT_LINE_HEIGHT_RATIO);
  }, [documentVersion]);

  if (!editor) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Abrindo editor...</div>;
  }

  return (
    <div
      className="doc-editor-root flex h-full flex-col"
      style={
        {
          "--doc-font-size": `${documentFontSizePx}px`,
          "--doc-line-height": `${documentLineHeightRatio}`,
        } as CSSProperties
      }
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-[hsl(var(--panel-header))] px-4 py-2.5">
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" className="h-8 px-2 text-xs font-semibold" onClick={decreaseDocumentFontSize} title="Diminuir fonte de todo o documento">
          A-
        </Button>
        <Button type="button" variant="ghost" className="h-8 px-2 text-xs font-semibold" onClick={increaseDocumentFontSize} title="Aumentar fonte de todo o documento">
          A+
        </Button>
        <Button type="button" variant="ghost" className="h-8 px-2 text-xs font-semibold" onClick={decreaseDocumentLineHeight} title="Diminuir espacamento entre linhas de todo o documento">
          LH-
        </Button>
        <Button type="button" variant="ghost" className="h-8 px-2 text-xs font-semibold" onClick={increaseDocumentLineHeight} title="Aumentar espacamento entre linhas de todo o documento">
          LH+
        </Button>
        <Button type="button" variant="ghost" className="h-8 px-2 text-xs font-semibold" onClick={resetDocumentTypography} title="Resetar fonte e espacamento para o padrao">
          Reset
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHighlight({ color: "yellow" }).run()}
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="ml-auto h-8 w-8"
          onClick={onCloseEditor}
          title="Fechar editor"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default HtmlEditor;
