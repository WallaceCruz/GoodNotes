import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { NOTE_COLORS, type Note, type NoteColor, type SubStatus } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel, stripHtml } from "./note-style";
import { SubnoteDeck } from "./SubnoteDeck";
import { TagEditor } from "./TagEditor";

export function StickyNoteCard({
  note,
  active,
  onOpen,
  onDelete,
  onChange,
  onAddSubnote,
  onUpdateSubnote,
  onMoveSubnote,
  onRemoveSubnote,
}: {
  note: Note;
  active: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onChange: (patch: Partial<Note>) => void;
  onAddSubnote: (text: string, color: NoteColor, status: SubStatus) => void;
  onUpdateSubnote: (subId: string, text: string) => void;
  onMoveSubnote: (subId: string, status: SubStatus) => void;
  onRemoveSubnote: (subId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onOpen}
      className={cn(
        "group cursor-pointer rounded-lg border border-border/60 p-3 shadow-sm transition-shadow hover:shadow-md",
        noteBg[note.color],
        isDragging && "opacity-50",
        active && "ring-2 ring-ring",
      )}
    >
      <div className="flex items-center gap-1 pb-1.5">
        <button
          {...attributes}
          {...listeners}
          aria-label="Mover nota"
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab text-foreground/40"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-1">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Cor ${noteLabel[c]}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange({ color: c });
              }}
              className={cn(
                "h-3 w-3 rounded-full border border-border/70",
                noteBg[c],
                note.color === c && "ring-1 ring-ring",
              )}
            />
          ))}
        </div>
        <button
          aria-label="Excluir nota"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-auto opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5 text-foreground/50" />
        </button>
      </div>

      <input
        value={note.title}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange({ title: e.target.value })}
        aria-label="Título da nota"
        className="w-full bg-transparent text-[15px] font-semibold leading-snug text-foreground outline-none"
      />

      <textarea
        value={stripHtml(note.content)}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange({ content: `<p>${e.target.value}</p>` })}
        rows={3}
        placeholder="Escreva aqui..."
        aria-label="Conteúdo da nota"
        className="mt-1 w-full resize-none bg-transparent text-xs leading-relaxed text-foreground/75 outline-none"
      />

      <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
        <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="mt-2 flex w-full items-center gap-1 text-[11px] text-foreground/60"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {note.subnotes.length} subtarefa{note.subnotes.length === 1 ? "" : "s"}
      </button>

      {expanded && (
        <div className="mt-2">
          <SubnoteDeck
            subnotes={note.subnotes}
            compact
            onAdd={onAddSubnote}
            onUpdate={onUpdateSubnote}
            onMove={onMoveSubnote}
            onRemove={onRemoveSubnote}
          />
        </div>
      )}
    </div>
  );
}
