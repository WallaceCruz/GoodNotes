import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Archive, ArchiveRestore, GripVertical, Maximize2, Trash2 } from "lucide-react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { NOTE_COLORS, type Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { AssigneeSelect } from "./AssigneeSelect";
import { ChecklistEditor } from "./ChecklistEditor";
import { noteBg, noteLabel } from "./note-style";
import { DeadlineBadge, PriorityBadge } from "./NoteMeta";
import { RichNoteEditor } from "./RichNoteEditor";
import { TagEditor } from "./TagEditor";

export function StickyNoteCard({
  note,
  active,
  store,
  onOpen,
}: {
  note: Note;
  active: boolean;
  store: BoardStore;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });
  const onChange = (patch: Partial<Note>) => store.updateNote(note.id, patch);
  const showChecklist = note.showChecklist || note.checklist.length > 0;


  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group rounded-lg border border-border/60 p-3 shadow-sm transition-shadow hover:shadow-md",
        noteBg[note.color],
        isDragging && "opacity-40",
        note.archived && "opacity-60 grayscale",
        active && "ring-2 ring-ring",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="-mx-1 flex cursor-grab items-center gap-1 rounded px-1 pb-1.5 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5 text-foreground/40" />
        <div className="flex flex-wrap items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Cor ${noteLabel[c]}`}
              onClick={() => onChange({ color: c })}
              className={cn(
                "h-3 w-3 rounded-full border border-border/70",
                noteBg[c],
                note.color === c && "ring-1 ring-ring",
              )}
            />
          ))}
        </div>
        <div
          className="ml-auto flex items-center gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            aria-label="Abrir detalhes"
            onClick={onOpen}
            className="opacity-0 group-hover:opacity-100"
          >
            <Maximize2 className="h-3.5 w-3.5 text-foreground/50" />
          </button>
          <button
            aria-label={note.archived ? "Restaurar nota" : "Arquivar nota"}
            onClick={() => store.setNoteArchived(note.id, !note.archived)}
            className="opacity-0 group-hover:opacity-100"
          >
            {note.archived ? (
              <ArchiveRestore className="h-3.5 w-3.5 text-foreground/50" />
            ) : (
              <Archive className="h-3.5 w-3.5 text-foreground/50" />
            )}
          </button>
          <button
            aria-label="Excluir nota"
            onClick={() => store.removeNote(note.id)}
            className="opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5 text-foreground/50" />
          </button>
        </div>
      </div>

      {(note.priority || note.deadline) && (
        <div className="flex flex-wrap items-center gap-1 pb-1">
          {note.priority && <PriorityBadge priority={note.priority} />}
          {note.deadline && <DeadlineBadge deadline={note.deadline} />}
        </div>
      )}

      <input
        value={note.title}
        onChange={(e) => onChange({ title: e.target.value })}
        aria-label="Título da nota"
        className="w-full bg-transparent text-[15px] font-semibold leading-snug text-foreground outline-none"
      />

      <RichNoteEditor
        content={note.content}
        onChange={(html) => onChange({ content: html })}
        minHeight="min-h-14"
        compact
        checklistActive={showChecklist}
        onToggleChecklist={() => onChange({ showChecklist: !showChecklist })}
      />

      {showChecklist && (
        <div className="mt-2">
          <ChecklistEditor
            items={note.checklist}
            onAdd={(text) => store.addChecklistItem(note.id, text)}
            onUpdate={(id, patch) => store.updateChecklistItem(note.id, id, patch)}
            onRemove={(id) => store.removeChecklistItem(note.id, id)}
          />
        </div>
      )}

      <footer className="mt-2 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-2">
        <AssigneeSelect
          value={note.assignee}
          onChange={(assignee) => onChange({ assignee })}
        />
        <div className="min-w-0 flex-1">
          <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} />
        </div>
      </footer>
    </div>
  );
}
