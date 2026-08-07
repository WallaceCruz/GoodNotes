import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { BoardStore } from "@/hooks/useBoardStore";
import { KanbanColumn } from "./KanbanColumn";

export function KanbanBoard({
  store,
  activeNoteId,
  onOpenNote,
}: {
  store: BoardStore;
  activeNoteId: string | null;
  onOpenNote: (id: string) => void;
}) {
  const file = store.file;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (!file) {
    return (
      <div className="canvas-dots flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Selecione ou crie um arquivo para começar.
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const noteId = String(active.id);
    const overId = String(over.id);
    if (noteId === overId) return;

    const column = file.columns.find((c) => c.id === overId);
    if (column) {
      store.moveNote(noteId, column.id);
      return;
    }
    const overNote = file.notes.find((n) => n.id === overId);
    if (overNote) store.moveNote(noteId, overNote.columnId, overNote.id);
  };

  return (
    <div className="canvas-dots flex-1 overflow-x-auto p-4">
      <DndContext id="kanban-dnd" sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-3">
          {file.columns.map((c) => (
            <KanbanColumn
              key={c.id}
              column={c}
              notes={file.notes.filter((n) => n.columnId === c.id)}
              activeNoteId={activeNoteId}
              onRename={(title) => store.renameColumn(c.id, title)}
              onRemove={() => store.removeColumn(c.id)}
              onAddNote={() => onOpenNote(store.addNote(c.id) ?? "")}
              onOpenNote={onOpenNote}
              onDeleteNote={store.removeNote}
            />
          ))}
          <button
            onClick={store.addColumn}
            className="flex w-52 items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            Nova coluna
          </button>
        </div>
      </DndContext>
    </div>
  );
}
