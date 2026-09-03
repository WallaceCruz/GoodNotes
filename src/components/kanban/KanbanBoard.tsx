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
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { GripVertical, Plus } from "lucide-react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { BoardFile, Note } from "@/lib/board-types";
import { boardActions, getActiveFile, useActiveFile } from "@/stores/board";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./KanbanColumn";
import { columnIdOf, columnSortableId } from "./column-drag";
import { noteBg, stripHtml } from "./note-style";

// Mantém a posição do scroll do quadro ao abrir/fechar a página de detalhes.
let savedBoardScroll = { top: 0, left: 0 };

export function KanbanBoard({
  activeNoteId,
  onOpenNote,
  matches,
  highlightIds,
}: {
  activeNoteId: string | null;
  onOpenNote: (id: string, mode?: "view" | "edit") => void;
  matches: (note: Note) => boolean;
  highlightIds?: Set<string> | undefined;
}) {
  const file = useActiveFile();
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = savedBoardScroll.top;
    el.scrollLeft = savedBoardScroll.left;
  }, []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Arrastar coluna só colide com colunas; arrastar nota só com notas/áreas de nota.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const movingColumn = columnIdOf(args.active.data.current) !== null;
    return closestCorners({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (c) => (columnIdOf(c.data.current) !== null) === movingColumn,
      ),
    });
  }, []);

  const columnIds = useMemo(
    () => (file?.columns ?? []).map((c) => columnSortableId(c.id)),
    [file?.columns],
  );

  // Guarda o agrupamento anterior para reaproveitar os arrays que não mudaram.
  const grouped = useRef(new Map<string, Note[]>());

  /**
   * Notas por coluna. Editar uma nota recria o array de `file.notes`, o que
   * geraria um array novo para *toda* coluna e re-renderizaria o quadro inteiro;
   * reaproveitar a referência anterior quando o conteúdo é o mesmo faz só a
   * coluna afetada (e, dentro dela, só o card alterado) re-renderizar.
   */
  const notesByColumn = useMemo(() => {
    const next = new Map<string, Note[]>();
    for (const c of file?.columns ?? []) {
      const list = (file?.notes ?? [])
        .filter((n) => n.columnId === c.id && matches(n))
        .sort(
          (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || a.order - b.order,
        );
      const previous = grouped.current.get(c.id);
      const unchanged =
        previous?.length === list.length && list.every((n, i) => previous[i] === n);
      next.set(c.id, unchanged ? previous : list);
    }
    grouped.current = next;
    return next;
  }, [file?.columns, file?.notes, matches]);

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas text-sm text-muted-foreground">
        Selecione ou crie um arquivo para começar.
      </div>
    );
  }

  const resolveTarget = (activeFile: BoardFile, noteId: string, overId: string) => {
    const column = activeFile.columns.find((c) => c.id === overId);
    if (column) return { columnId: column.id, beforeId: undefined as string | undefined };
    const overNote = activeFile.notes.find((n) => n.id === overId);
    if (overNote && overNote.id !== noteId)
      return { columnId: overNote.columnId, beforeId: overNote.id };
    return null;
  };

  /**
   * A nota só é movida no estado *uma vez*, ao soltar — não a cada evento de
   * sobrevoo. Mover durante o arraste (havia um `onDragOver` que fazia isso,
   * para a nota "entrar" visualmente na coluna de destino antes de soltar)
   * muda o DOM; o dnd-kit remede o layout a cada quadro enquanto arrasta
   * (measuring "WhileDragging"), e a remedição após aquela mudança pode
   * reportar outra nota sob o cursor mesmo sem o mouse ter se mexido —
   * reentrando no mesmo handler, que move de novo, remede de novo, ad
   * infinitum. Nenhuma deduplicação por chave resolve isso, porque cada
   * remedição É um evento novo e genuíno aos olhos do dnd-kit. `handleDragEnd`
   * abaixo já cobre soltar sobre outra nota (`reorderNote`, que reatribui a
   * coluna) e soltar sobre uma coluna vazia (`moveNote`) — a troca de coluna
   * funciona igual, só sem o reflow ao vivo durante o arraste.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    setDraggingColumnId(null);
    const { active, over } = event;
    if (!over) return;
    const activeFile = getActiveFile();
    if (!activeFile) return;

    const fromId = columnIdOf(active.data.current);
    if (fromId) {
      const toId = columnIdOf(over.data.current);
      if (!toId || toId === fromId) return;
      boardActions.reorderColumn(fromId, toId);
      const column = activeFile.columns.find((c) => c.id === fromId);
      if (column) toast.success(`Coluna "${column.title}" movida`);
      return;
    }

    const noteId = String(active.id);
    const overId = String(over.id);
    if (overId === noteId) return;
    const note = activeFile.notes.find((n) => n.id === noteId);
    const overNote = activeFile.notes.find((n) => n.id === overId);
    if (overNote) {
      const sameColumn = overNote.columnId === note?.columnId;
      boardActions.reorderNote(noteId, overId);
      const column = activeFile.columns.find((c) => c.id === overNote.columnId);
      if (sameColumn) toast.success(`"${note?.title || "Nota"}" reordenada`);
      else if (column) toast.success(`"${note?.title || "Nota"}" movida para ${column.title}`);
      return;
    }
    const target = resolveTarget(activeFile, noteId, overId);
    if (!target) return;
    boardActions.moveNote(noteId, target.columnId, target.beforeId);
    const column = activeFile.columns.find((c) => c.id === target.columnId);
    if (column) toast.success(`"${note?.title || "Nota"}" movida para ${column.title}`);
  };

  const dragging = file.notes.find((n) => n.id === draggingId);
  const draggingColumn = file.columns.find((c) => c.id === draggingColumnId);

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
        collisionDetection={collisionDetection}
        // Mede as colunas apenas durante o arraste: evita loop de remedição do dnd-kit.
        measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
        onDragStart={(e: DragStartEvent) => {
          const columnId = columnIdOf(e.active.data.current);
          if (columnId) setDraggingColumnId(columnId);
          else setDraggingId(String(e.active.id));
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setDraggingId(null);
          setDraggingColumnId(null);
        }}
      >
        <div className="flex h-full items-start gap-3">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {file.columns.map((c, i) => (
              <KanbanColumn
                key={c.id}
                column={c}
                notes={notesByColumn.get(c.id) ?? []}
                activeNoteId={activeNoteId}
                index={i}
                total={file.columns.length}
                onAddNote={(kind) => boardActions.addNote(c.id, kind)}
                onOpenNote={onOpenNote}
                highlightIds={highlightIds}
              />
            ))}
          </SortableContext>
          <button
            onClick={boardActions.addColumn}
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
          {draggingColumn ? (
            <div className="w-96 rotate-1 cursor-grabbing overflow-hidden rounded-lg border border-border/60 bg-card shadow-2xl ring-2 ring-ring/40">
              <div
                className={cn(
                  "h-1.5 w-full",
                  draggingColumn.color ? noteBg[draggingColumn.color] : "bg-muted",
                )}
              />
              <div className="flex items-center gap-2 px-3 py-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <p className="truncate text-sm font-semibold">{draggingColumn.title}</p>
                <span className="ml-auto rounded bg-muted px-1.5 text-[11px] text-muted-foreground">
                  {notesByColumn.get(draggingColumn.id)?.length ?? 0}
                </span>
              </div>
            </div>
          ) : dragging ? (
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
