import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Plus,
  Strikethrough,
  Trash2,
  Underline as UnderlineIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NOTE_COLORS, type Note, type NoteColor } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "./note-style";

type Props = {
  note: Note;
  onClose: () => void;
  onChange: (patch: Partial<Note>) => void;
  onAddSubnote: (text: string, color: NoteColor) => void;
  onUpdateSubnote: (subId: string, text: string) => void;
  onRemoveSubnote: (subId: string) => void;
};

export function NoteEditorPanel({
  note,
  onClose,
  onChange,
  onAddSubnote,
  onUpdateSubnote,
  onRemoveSubnote,
}: Props) {
  const [subColor, setSubColor] = useState<NoteColor>("amber");

  const editor = useEditor(
    {
      extensions: [StarterKit, Underline],
      content: note.content,
      immediatelyRender: false,
      editorProps: { attributes: { class: "min-h-40 text-sm outline-none" } },
      onUpdate: ({ editor }) => onChange({ content: editor.getHTML() }),
    },
    [note.id],
  );

  useEffect(() => {
    if (editor && editor.getHTML() !== note.content && !editor.isFocused) {
      editor.commands.setContent(note.content);
    }
  }, [note.id]);

  const btn = (activeKey: string, action: () => void, Icon: typeof Bold, label: string) => (
    <button
      key={label}
      aria-label={label}
      onClick={action}
      className={cn(
        "rounded p-1 text-foreground/70 hover:bg-foreground/10",
        editor?.isActive(activeKey) && "bg-foreground/10 text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <section className="flex w-96 shrink-0 flex-col border-l border-border bg-background">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-semibold">Nota</span>
        <button onClick={onClose} aria-label="Fechar nota" className="ml-auto text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        <div className={cn("rounded-md border border-border/60 shadow-sm", noteBg[note.color])}>
          <input
            value={note.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full bg-transparent px-3 pt-3 text-base font-bold outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center gap-0.5 border-y border-foreground/10 px-2 py-1">
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
            {btn(
              "heading",
              () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
              Heading3,
              "Título 3",
            )}
            {btn("bulletList", () => editor?.chain().focus().toggleBulletList().run(), List, "Lista")}
            {btn(
              "orderedList",
              () => editor?.chain().focus().toggleOrderedList().run(),
              ListOrdered,
              "Lista numerada",
            )}
          </div>
          <div className="note-prose px-3 py-2">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cor da nota
          </p>
          <div className="mt-2 flex gap-2">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                aria-label={noteLabel[c]}
                onClick={() => onChange({ color: c })}
                className={cn(
                  "h-6 w-6 rounded-full border border-border",
                  noteBg[c],
                  note.color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
              />
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Subnotas
            </p>
            <div className="flex items-center gap-1">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Cor da subnota ${noteLabel[c]}`}
                  onClick={() => setSubColor(c)}
                  className={cn(
                    "h-4 w-4 rounded-full border border-border",
                    noteBg[c],
                    subColor === c && "ring-2 ring-ring",
                  )}
                />
              ))}
              <button
                aria-label="Adicionar subnota"
                onClick={() => onAddSubnote("Nova subnota", subColor)}
                className="ml-1 rounded p-1 text-muted-foreground hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {note.subnotes.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group relative rounded-md border border-border/60 p-2 shadow-sm",
                  noteBg[s.color],
                )}
              >
                <textarea
                  value={s.text}
                  onChange={(e) => onUpdateSubnote(s.id, e.target.value)}
                  rows={3}
                  className="w-full resize-none bg-transparent text-xs leading-relaxed outline-none"
                />
                <button
                  aria-label="Excluir subnota"
                  onClick={() => onRemoveSubnote(s.id)}
                  className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3 text-foreground/60" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
