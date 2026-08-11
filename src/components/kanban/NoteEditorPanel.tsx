import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Archive,
  ArchiveRestore,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { NOTE_COLORS, type Note } from "@/lib/board-types";
import { ChecklistEditor } from "./ChecklistEditor";
import { NoteImages } from "./NoteImages";
import { PriorityDeadlineControls } from "./NoteMeta";
import { SubnoteDeck } from "./SubnoteDeck";
import { TagEditor } from "./TagEditor";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "./note-style";

export function NoteEditorPanel({
  note,
  store,
  onClose,
}: {
  note: Note;
  store: BoardStore;
  onClose: () => void;
}) {
  const onChange = (patch: Partial<Note>) => store.updateNote(note.id, patch);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: note.content,
    immediatelyRender: false,
    editorProps: { attributes: { class: "min-h-40 text-sm outline-none" } },
    onUpdate: ({ editor }) => onChangeRef.current({ content: editor.getHTML() }),
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (!editor.isFocused && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, editor]);

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
    <section className="flex w-[26rem] shrink-0 flex-col border-l border-border bg-background">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-semibold">Nota</span>
        <button
          onClick={() => store.setNoteArchived(note.id, !note.archived)}
          aria-label={note.archived ? "Restaurar nota" : "Arquivar nota"}
          className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
        >
          {note.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          {note.archived ? "Restaurar" : "Arquivar"}
        </button>
        <button onClick={onClose} aria-label="Fechar nota" className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto p-3">
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
            Prioridade e prazo
          </p>
          <div className="mt-2">
            <PriorityDeadlineControls note={note} onChange={onChange} />
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
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tags
          </p>
          <div className="mt-2">
            <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} size="md" />
          </div>
        </div>

        <div className="mt-5">
          <ChecklistEditor
            items={note.checklist}
            onAdd={(text) => store.addChecklistItem(note.id, text)}
            onUpdate={(id, patch) => store.updateChecklistItem(note.id, id, patch)}
            onRemove={(id) => store.removeChecklistItem(note.id, id)}
          />
        </div>

        <div className="mt-5">
          <NoteImages
            images={note.images}
            onAdd={(url, link) => store.addImage(note.id, url, link)}
            onUpdate={(id, patch) => store.updateImage(note.id, id, patch)}
            onRemove={(id) => store.removeImage(note.id, id)}
          />
        </div>

        <div className="mt-5">
          <SubnoteDeck
            subnotes={note.subnotes}
            onAdd={(text, color, status) => store.addSubnote(note.id, text, color, status)}
            onUpdate={(subId, text) => store.updateSubnote(note.id, subId, text)}
            onMove={(subId, status) => store.moveSubnote(note.id, subId, status)}
            onRemove={(subId) => store.removeSubnote(note.id, subId)}
          />
        </div>
      </div>
    </section>
  );
}
