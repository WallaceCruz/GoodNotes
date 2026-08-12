import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function RichNoteEditor({
  content,
  onChange,
  minHeight = "min-h-16",
  compact = false,
}: {
  content: string;
  onChange: (html: string) => void;
  minHeight?: string;
  compact?: boolean;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("outline-none", minHeight, compact ? "text-xs" : "text-sm"),
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (!editor.isFocused && editor.getHTML() !== content) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  const btn = (key: string, action: () => void, Icon: typeof Bold, label: string) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        action();
      }}
      className={cn(
        "rounded p-1 text-foreground/60 hover:bg-foreground/10",
        editor?.isActive(key) && "bg-foreground/10 text-foreground",
      )}
    >
      <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} />
    </button>
  );

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-0.5 border-y border-foreground/10 py-0.5">
        {btn("bold", () => editor?.chain().focus().toggleBold().run(), Bold, "Negrito")}
        {btn("italic", () => editor?.chain().focus().toggleItalic().run(), Italic, "Itálico")}
        {btn(
          "underline",
          () => editor?.chain().focus().toggleUnderline().run(),
          UnderlineIcon,
          "Sublinhado",
        )}
        {btn("strike", () => editor?.chain().focus().toggleStrike().run(), Strikethrough, "Tachado")}
        {btn(
          "heading",
          () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
          Heading1,
          "Título 1",
        )}
        {btn(
          "heading",
          () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          Heading2,
          "Título 2",
        )}
        {btn("bulletList", () => editor?.chain().focus().toggleBulletList().run(), List, "Lista")}
        {btn(
          "orderedList",
          () => editor?.chain().focus().toggleOrderedList().run(),
          ListOrdered,
          "Lista numerada",
        )}
      </div>
      <div className="note-prose py-1.5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
