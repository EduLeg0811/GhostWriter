import { useEffect, useMemo, useRef } from "react";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontFamily, FontSize, LineHeight, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Bold, Highlighter, Italic, List, ListOrdered, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HtmlEditorControlApi } from "@/lib/html-editor-control";

interface HtmlEditorProps {
  contentHtml: string;
  onControlApiReady?: (api: HtmlEditorControlApi | null) => void;
  onContentChange?: (payload: { html: string; text: string }) => void;
}

const HtmlEditor = ({ contentHtml, onControlApiReady, onContentChange }: HtmlEditorProps) => {
  const controlApiRef = useRef<HtmlEditorControlApi | null>(null);

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
          "min-h-full w-full px-6 py-5 text-[15px] leading-7 text-foreground focus:outline-none",
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

  if (!editor) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Abrindo editor...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card px-2 py-1.5">
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
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default HtmlEditor;
