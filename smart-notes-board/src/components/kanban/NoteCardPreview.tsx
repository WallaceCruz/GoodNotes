import { GripVertical, Pin } from "lucide-react";
import { type Note } from "@/lib/board/model";
import { noteAssignees } from "@/lib/board/notes";
import { isNoteDone } from "@/lib/board/status";
import { useActiveProjectId, useFileColumns, useFileTags } from "@/stores/board";
import { useNoteAppearance } from "@/stores/note-appearance";
import { cn } from "@/lib/utils";
import { noteSurface } from "@/components/note/note-appearance";
import { AssigneeStack, ChecklistBar, NoteBadges, TagChips } from "@/components/note/note-parts";
import { NoteRichContent } from "@/components/note/NoteRichContent";

/**
 * Réplica somente-leitura da nota, para o `DragOverlay` do arraste.
 *
 * Antes o overlay era uma caixa simplificada — só título e um trecho de texto,
 * sem cor, sem badges, sem checklist. O pedido era o card completo durante o
 * arraste; a réplica visual (em vez de montar o `StickyNoteCard` de verdade
 * dentro do overlay) evita reativar edição de título, editor de texto rico e
 * dropdowns interativos flutuando junto com o cursor, que não fazem sentido
 * numa prévia que está sendo arrastada.
 */
export function NoteCardPreview({ note }: { note: Note }) {
  const activeProjectId = useActiveProjectId();
  const { appearance } = useNoteAppearance(activeProjectId);
  const surface = noteSurface(appearance, note.color, { tint: note.colorHex ?? null });
  const columns = useFileColumns();
  const fileTags = useFileTags();
  const done = isNoteDone(note, columns);
  const assignees = noteAssignees(note);

  return (
    <div
      style={surface.style}
      className={cn(
        "w-96 origin-center scale-[1.03] cursor-grabbing overflow-hidden border-border/60 p-3 text-note-foreground shadow-2xl ring-2 ring-ring/40 transition-transform",
        surface.className,
        done && "opacity-70",
      )}
    >
      <div className="-mx-1 flex items-center gap-1 rounded px-1 pb-1.5">
        <GripVertical className="h-3.5 w-3.5 text-foreground/40" />
        <span
          className={cn(
            "flex h-3.5 w-3.5 items-center justify-center rounded-sm border",
            done ? "border-emerald-600 bg-emerald-600" : "border-foreground/40",
          )}
        />
        {note.pinned && <Pin className="h-3.5 w-3.5 text-foreground/70" />}
      </div>

      <NoteBadges note={note} columns={columns} className="pb-1" />

      <p className="note-title-color truncate text-[1.15em] font-semibold leading-snug">
        {note.title || "Sem título"}
      </p>

      <NoteRichContent
        html={note.content}
        className="note-prose mt-1 max-h-40 overflow-hidden text-xs"
      />

      <ChecklistBar items={note.checklist} className="mt-2" />

      {(assignees.length > 0 || note.tags.length > 0) && (
        <footer className="mt-1 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-2">
          <AssigneeStack names={assignees} />
          <TagChips tags={note.tags} tagDefs={fileTags} className="flex-1" />
        </footer>
      )}
    </div>
  );
}
