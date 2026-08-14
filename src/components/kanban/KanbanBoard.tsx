import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { BoardStore } from "@/hooks/useBoardStore";
import type { Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./KanbanColumn";
import { noteBg, stripHtml } from "./note-style";

// Mantém a posição do scroll do quadro ao abrir/fechar a página de detalhes.
let savedBoardScroll = { top: 0, left: 0 };

export function KanbanBoard({
  store,
  activeNoteId,
  onOpenNote,
  matches,
  highlightIds,
}: {
  store: BoardStore;
  activeNoteId: string | null;
  onOpenNote: (id: string) => void;
  matches: (note: Note) => boolean;
  highlightIds?: Set<string> | undefined;
}) {
  const file = store.file;
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = savedBoardScroll.top;
    el.scrollLeft = savedBoardScroll.left;
  }, []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Memoizado: arrays estáveis evitam remedições em loop do dnd-kit.
  const notesByColumn = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const c of file?.columns ?? []) {
      map.set(
        c.id,
        (file?.notes ?? [])
          .filter((n) => n.columnId === c.id && matches(n))
          .sort(
            (a, b) =>
              Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || a.order - b.order,
          ),
      );
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.columns, file?.notes, matches]);

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas text-sm text-muted-foreground">
        Selecione ou crie um arquivo para começar.
      </div>
    );
  }

  const resolveTarget = (noteId: string, overId: string) => {
    const column = file.columns.find((c) => c.id === overId);
    if (column) return { columnId: column.id, beforeId: undefined as string | undefined };
    const overNote = file.notes.find((n) => n.id === overId);
    if (overNote && overNote.id !== noteId)
      return { columnId: overNote.columnId, beforeId: overNote.id };
    return null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const noteId = String(active.id);
    const target = resolveTarget(noteId, String(over.id));
    const note = file.notes.find((n) => n.id === noteId);
    if (!target || !note) return;
    if (note.columnId !== target.columnId) store.moveNote(noteId, target.columnId, target.beforeId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;
    const noteId = String(active.id);
    const overId = String(over.id);
    if (overId === noteId) return;
    const note = file.notes.find((n) => n.id === noteId);
    const overNote = file.notes.find((n) => n.id === overId);
    if (overNote) {
      const sameColumn = overNote.columnId === note?.columnId;
      store.reorderNote(noteId, overId);
      const column = file.columns.find((c) => c.id === overNote.columnId);
      if (sameColumn) toast.success(`"${note?.title || "Nota"}" reordenada`);
      else if (column) toast.success(`"${note?.title || "Nota"}" movida para ${column.title}`);
      return;
    }
    const target = resolveTarget(noteId, overId);
    if (!target) return;
    store.moveNote(noteId, target.columnId, target.beforeId);
    const column = file.columns.find((c) => c.id === target.columnId);
    if (column) toast.success(`"${note?.title || "Nota"}" movida para ${column.title}`);
  };

  const dragging = file.notes.find((n) => n.id === draggingId);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        savedBoardScroll = {
          top: e.currentTarget.scrollTop,
          left: e.currentTarget.scrollLeft,
        };
      }}
      className="scroll-thin flex-1 overflow-auto bg-canvas p-4"
    >
      <DndContext
        id="kanban-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: DragStartEvent) => setDraggingId(String(e.active.id))}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggingId(null)}
      >
        <div className="flex h-full items-start gap-3">
          {file.columns.map((c) => (
            <KanbanColumn
              key={c.id}
              column={c}
              store={store}
              notes={notesByColumn.get(c.id) ?? []}
              activeNoteId={activeNoteId}
              onAddNote={(kind) => store.addNote(c.id, kind)}
              onOpenNote={onOpenNote}
              highlightIds={highlightIds}
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

        <DragOverlay
          dropAnimation={{
            duration: 260,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: "0.35" } },
            }),
          }}
        >
          {dragging ? (
            <div
              className={cn(
                "w-96 origin-center scale-[1.03] cursor-grabbing rounded-lg border border-border/60 p-3 shadow-2xl ring-2 ring-ring/40 transition-transform",
                dragging.kind === "notepad"
                  ? "bg-card text-card-foreground"
                  : cn("rotate-2", noteBg[dragging.color]),
              )}
            >
              <p className="text-[15px] font-semibold leading-snug">{dragging.title}</p>
              <p className="mt-1 line-clamp-3 text-xs text-foreground/70">
                {stripHtml(dragging.content)}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
