import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, X } from "lucide-react";
import type { Column, Note } from "@/lib/board-types";
import { StickyNoteCard } from "./StickyNoteCard";

export function KanbanColumn({
  column,
  notes,
  activeNoteId,
  onRename,
  onRemove,
  onAddNote,
  onOpenNote,
  onDeleteNote,
}: {
  column: Column;
  notes: Note[];
  activeNoteId: string | null;
  onRename: (title: string) => void;
  onRemove: () => void;
  onAddNote: () => void;
  onOpenNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card/70 backdrop-blur-sm">
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        <input
          value={column.title}
          onChange={(e) => onRename(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
        <span className="rounded bg-muted px-1.5 text-[11px] text-muted-foreground">
          {notes.length}
        </span>
        <button onClick={onAddNote} aria-label="Adicionar nota" className="text-muted-foreground">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={onRemove} aria-label="Excluir coluna" className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-32 flex-1 flex-col gap-2 p-2 ${isOver ? "bg-accent/60" : ""}`}
      >
        <SortableContext items={notes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          {notes.map((n) => (
            <StickyNoteCard
              key={n.id}
              note={n}
              active={activeNoteId === n.id}
              onOpen={() => onOpenNote(n.id)}
              onDelete={() => onDeleteNote(n.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
