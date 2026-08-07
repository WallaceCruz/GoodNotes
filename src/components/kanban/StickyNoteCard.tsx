import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, StickyNote as StickyIcon, Trash2 } from "lucide-react";
import type { Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, stripHtml } from "./note-style";

export function StickyNoteCard({
  note,
  active,
  onOpen,
  onDelete,
}: {
  note: Note;
  active: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onOpen}
      className={cn(
        "group cursor-pointer rounded-md border border-border/60 p-3 shadow-sm transition-shadow hover:shadow-md",
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
        <span className="truncate text-[11px] font-medium text-foreground/60">Nota adesiva</span>
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
      <p className="text-sm font-semibold leading-snug text-foreground">{note.title}</p>
      {stripHtml(note.content) && (
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-foreground/70">
          {stripHtml(note.content)}
        </p>
      )}
      {note.subnotes.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-foreground/60">
          <StickyIcon className="h-3 w-3" />
          {note.subnotes.length} subnota{note.subnotes.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
