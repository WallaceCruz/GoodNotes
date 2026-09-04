import { GripVertical, Pin } from "lucide-react";
import { effectiveStatus, initials, noteAssignees, tagColorOf, type Note } from "@/lib/board-types";
import { useActiveProjectId, useFileColumns, useFileTags } from "@/stores/board";
import { useNoteAppearance } from "@/stores/noteAppearance";
import { cn } from "@/lib/utils";
import { noteSurface } from "./note-appearance";
import { CategoryBadge } from "./CategorySelect";
import { DeadlineBadge, PriorityBadge } from "./NoteMeta";
import { StatusBadge } from "./StatusSelect";
import { noteBg } from "./note-style";
import { NoteRichContent } from "./NoteRichContent";

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
  const columns = useFileColumns() ?? [];
  const fileTags = useFileTags() ?? [];
  const status = effectiveStatus(note, columns);
  const done = status === "done";
  const assignees = noteAssignees(note);
  const checklistDone = note.checklist.filter((i) => i.done).length;
  const checklistPct =
    note.checklist.length === 0 ? 0 : Math.round((checklistDone / note.checklist.length) * 100);

  return (
    <div
      style={surface.style}
      className={cn(
        "w-96 origin-center scale-[1.03] cursor-grabbing overflow-hidden border-border/60 p-3 text-note-foreground shadow-2xl ring-2 ring-ring/40 transition-transform",
        appearance.style === "classic" &&
          !appearance.bgColor &&
          !note.colorHex &&
          noteBg[note.color],
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

      <div className="flex flex-wrap items-center gap-1 pb-1">
        {status && <StatusBadge status={status} />}
        {note.category && <CategoryBadge category={note.category} />}
        {note.priority && <PriorityBadge priority={note.priority} />}
        {note.deadline && <DeadlineBadge deadline={note.deadline} />}
      </div>

      <p className="note-title-color truncate text-[1.15em] font-semibold leading-snug">
        {note.title || "Sem título"}
      </p>

      <NoteRichContent
        html={note.content}
        className="note-prose mt-1 max-h-40 overflow-hidden text-xs"
      />

      {note.checklist.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Checklist
            </p>
            <span className="text-[10px] text-foreground/60">
              {checklistDone}/{note.checklist.length} · {checklistPct}%
            </span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-primary" style={{ width: `${checklistPct}%` }} />
          </div>
        </div>
      )}

      {(assignees.length > 0 || note.tags.length > 0) && (
        <footer className="mt-1 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-2">
          {assignees.length > 0 && (
            <div className="flex items-center">
              {assignees.slice(0, 4).map((name, i) => (
                <span
                  key={name}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border border-background bg-primary text-[10px] font-semibold text-primary-foreground",
                    i > 0 && "-ml-2",
                  )}
                >
                  {initials(name)}
                </span>
              ))}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {note.tags.map((t) => (
              <span
                key={t}
                className={cn(
                  "rounded-full border border-foreground/10 px-2 py-0.5 text-[10px] text-foreground/80",
                  noteBg[tagColorOf(fileTags, t)],
                )}
              >
                #{t}
              </span>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
