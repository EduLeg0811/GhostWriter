import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Highlighter,
  RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface TipTapEditorHandle {
  getHTML: () => string;
  getText: () => string;
  getSelectedText: () => string;
  setContent: (html: string) => void;
  replaceSelection: (html: string) => void;
  selectAll: () => void;
  isEmpty: () => boolean;
}

interface TipTapEditorProps {
  initialContent?: string;
  onReady?: (handle: TipTapEditorHandle) => void;
  onUpdate?: (html: string, text: string) => void;
}

const TipTapEditor = ({ initialContent, onReady, onUpdate }: TipTapEditorProps) => {
  const handleRef = useRef<TipTapEditorHandle | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Importe um documento ou comece a digitar…" }),
      TextStyle,
      Color,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none min-h-[200px] outline-none px-6 py-4 focus:outline-none " +
          "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground " +
          "prose-em:text-foreground prose-li:text-foreground",
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdate?.(e.getHTML(), e.getText());
    },
  });

  const buildHandle = useCallback((): TipTapEditorHandle | null => {
    if (!editor) return null;
    return {
      getHTML: () => editor.getHTML(),
      getText: () => editor.getText(),
      getSelectedText: () => {
        const { from, to } = editor.state.selection;
        if (from === to) return "";
        return editor.state.doc.textBetween(from, to, "\n");
      },
      setContent: (html: string) => editor.commands.setContent(html),
      replaceSelection: (html: string) => {
        editor.commands.insertContent(html);
      },
      selectAll: () => editor.commands.selectAll(),
      isEmpty: () => editor.isEmpty,
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const handle = buildHandle();
    if (handle) {
      handleRef.current = handle;
      onReadyRef.current?.(handle);
    }
  }, [editor, buildHandle]);

  // Update content when initialContent changes externally
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const current = editor.getHTML();
      if (current !== initialContent) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  if (!editor) return null;

  const ToolBtn = ({
    active,
    onClick,
    children,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-7 w-7"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-[hsl(var(--panel-header))] px-2 py-1">
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Alinhar esquerda">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centralizar">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Alinhar direita">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} title="Destacar">
          <Highlighter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpar formatação">
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo2 className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* Editor content */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default TipTapEditor;
