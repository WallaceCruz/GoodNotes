import { useSortable } from "@dnd-kit/sortable";
import { memo } from "react";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Maximize2, Pin, Square, SquareCheck } from "lucide-react";
import { type Note } from "@/lib/board/model";
import { noteAssignees } from "@/lib/board/notes";
import { isNoteDone } from "@/lib/board/status";
import {
  boardActions,
  useActiveProjectId,
  useFileColumns,
  useIsNoteSelected,
  useSelectionMode,
} from "@/stores/board";
import { cn } from "@/lib/utils";
import { NoteOptionsMenu } from "./NoteOptionsMenu";
import { AssigneeSelect } from "@/components/note/AssigneeSelect";
import { BelowChecklistNote } from "@/components/editor/BelowChecklistNote";
import { CardResizeHandle } from "./CardResizeHandle";
import { ChecklistEditor } from "@/components/note/ChecklistEditor";
import { hasRichContent } from "@/lib/html";
import { noteSurface } from "@/components/note/note-appearance";
import { NoteBadges } from "@/components/note/note-parts";
import { useNoteAppearance } from "@/stores/note-appearance";
import { RichNoteEditor } from "@/components/editor/RichNoteEditor";
import { TagEditor } from "@/components/note/TagEditor";

function StickyNoteCardBase({
  note,
  active,
  onOpen,
}: {
  note: Note;
  active: boolean;
  onOpen: (mode?: "view" | "edit") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    transition: { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  });
  const onChange = (patch: Partial<Note>) => boardActions.updateNote(note.id, patch);
  const showChecklist = note.showChecklist;
  const activeProjectId = useActiveProjectId();
  const { appearance } = useNoteAppearance(activeProjectId);
  const surface = noteSurface(appearance, note.color, { tint: note.colorHex ?? null });
  const columns = useFileColumns();
  const done = isNoteDone(note, columns);
  const selectionMode = useSelectionMode();
  const selected = useIsNoteSelected(note.id);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...surface.style,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 30 : undefined,
      }}
      onClick={() => {
        if (selectionMode) boardActions.toggleNoteSelected(note.id);
      }}
      className={cn(
        "group relative overflow-hidden border-border/60 text-note-foreground transition-all duration-200",
        surface.className,
        isDragging && "scale-[0.98] opacity-40 shadow-none ring-2 ring-dashed ring-ring/40",
        note.archived && "opacity-60 grayscale",
        done && "opacity-70",
        active && "ring-2 ring-ring",
        selectionMode && "cursor-pointer",
        selected && "ring-2 ring-primary",
      )}
    >
      {selectionMode ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            boardActions.toggleNoteSelected(note.id);
          }}
          className={cn(
            "-mx-1 mb-1.5 flex w-[calc(100%+0.5rem)] items-center gap-2 rounded px-1.5 py-1 text-xs font-medium transition-colors",
            selected ? "bg-primary/15 text-primary" : "text-foreground/60 hover:bg-foreground/5",
          )}
        >
          {selected ? (
            <SquareCheck className="h-4 w-4 shrink-0" />
          ) : (
            <Square className="h-4 w-4 shrink-0" />
          )}
          {selected ? "Selecionada" : "Selecionar nota"}
          {note.pinned && <Pin className="ml-auto h-3.5 w-3.5 shrink-0 text-foreground/70" />}
        </button>
      ) : (
        <div
          {...attributes}
          {...listeners}
          className="-mx-1 flex cursor-grab items-center gap-1 rounded px-1 pb-1.5 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5 text-foreground/40" />
          <input
            type="checkbox"
            checked={done}
            aria-label="Marcar tarefa como concluída"
            title="Marcar como concluída"
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => boardActions.setNoteDone(note.id, e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-emerald-600"
          />
          {note.pinned && <Pin className="h-3.5 w-3.5 text-foreground/70" />}
          <div
            className="ml-auto flex items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Expandir nota"
              title="Expandir nota"
              onClick={() => onOpen("view")}
              className="flex h-6 w-6 items-center justify-center rounded text-foreground/60 opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <NoteOptionsMenu note={note} onOpen={() => onOpen("edit")} />
          </div>
        </div>
      )}

      <div onPointerDown={(e) => e.stopPropagation()}>
        <NoteBadges
          note={note}
          columns={columns}
          className={cn("pb-1", selectionMode && "pointer-events-none")}
        />
      </div>

      <input
        value={note.title}
        onChange={(e) => onChange({ title: e.target.value })}
        aria-label="Título da nota"
        readOnly={selectionMode}
        className={cn(
          "note-title-color w-full bg-transparent text-[1.15em] font-semibold leading-snug outline-none",
          selectionMode && "pointer-events-none",
        )}
      />

      <div
        // Rola em vez de cortar: sem limite o card estica e domina a coluna, e
        // com `overflow-hidden` o texto além da altura ficava inacessível.
        // `pr-2` mantém o texto fora da barra de rolagem.
        className={cn(
          "scroll-thin overflow-y-auto pr-2",
          !note.height && "max-h-96",
          selectionMode && "pointer-events-none select-none",
        )}
        style={note.height ? { height: note.height } : undefined}
      >
        <RichNoteEditor
          content={note.content}
          onChange={(html) => onChange({ content: html })}
          minHeight="min-h-14"
          compact
        />

        {showChecklist && (
          <div className="mt-2">
            <ChecklistEditor
              items={note.checklist}
              onAdd={(text) => boardActions.addChecklistItem(note.id, text)}
              onUpdate={(id, patch) => boardActions.updateChecklistItem(note.id, id, patch)}
              onRemove={(id) => boardActions.removeChecklistItem(note.id, id)}
            />
          </div>
        )}

        {(showChecklist || hasRichContent(note.contentBelow)) && (
          <BelowChecklistNote
            value={note.contentBelow ?? ""}
            onChange={(html) => onChange({ contentBelow: html })}
            compact
          />
        )}
      </div>

      {!selectionMode && (
        <CardResizeHandle
          height={note.height}
          defaultHeight={160}
          min={96}
          onChange={(h) => onChange({ height: h })}
          onReset={() => onChange({ height: null })}
        />
      )}

      <footer
        className={cn(
          "mt-1 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-2",
          selectionMode && "pointer-events-none",
        )}
      >
        <AssigneeSelect
          value={noteAssignees(note)}
          onChange={(names) => onChange({ assignees: names, assignee: names[0] ?? null })}
        />
        <div className="min-w-0 flex-1">
          <TagEditor tags={note.tags} onChange={(tags) => onChange({ tags })} />
        </div>
      </footer>
    </div>
  );
}

// `columns` e `appearance` chegam por assinatura direta ao Zustand (dentro do
// componente), não por prop — então comparar `note`/`active` já basta aqui.
export const StickyNoteCard = memo(
  StickyNoteCardBase,
  (prev, next) => prev.note === next.note && prev.active === next.active,
);
